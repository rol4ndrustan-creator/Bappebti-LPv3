// "Tindakan Berikutnya" action registry for the Bappebti case detail page.
// Every regulator action a case can go through — what fields it asks for,
// what happens after it runs, and which actions make sense for the case's
// current status — lives here instead of scattered across the page.

import { ComplaintCase, InternalWorkflowState, OwnerType, TimelineEvent } from "./types";
import { WORKFLOW_STATES, deriveWorkflowState } from "./workflow-config";
import { BURSA_LIST, KLIRING_LIST, PLATFORM_LIST } from "./mock-data";
import { DEMO_USERS } from "./permissions";
import {
  addEvidence,
  addTimelineEvent,
  closeCase,
  reopenCase,
  setCaseOfficer,
  setCurrentOwner,
  setWorkflowState,
} from "./mock-service/store";

export type CaseActionId =
  | "assign-to-member"
  | "request-reporter-data"
  | "request-supervisor-review"
  | "approve-resolution"
  | "close-case"
  | "send-reminder"
  | "request-resolution-revision"
  | "escalate-enforcement"
  | "close-administrative"
  | "reopen-case";

export type ActionButtonTone = "primary" | "secondary" | "success" | "destructive" | "muted";

export type ActionFieldType = "text" | "textarea" | "select" | "date" | "pdf";

export interface ActionFieldSpec {
  id: string;
  label: string;
  type: ActionFieldType;
  required: boolean;
  options?: string[];
  /** Grouped <optgroup> options for "select" fields, e.g. PIC candidates split by Internal Bappebti / Platform / Bursa / Kliring. Takes precedence over `options` when present. */
  optionGroups?: { label: string; options: string[] }[];
  placeholder?: string;
  defaultValue?: (c: ComplaintCase) => string;
}

export interface ActionImpact {
  status: string;
  owner: string;
  sla: string;
}

export interface CaseActionDefinition {
  id: CaseActionId;
  label: string;
  tone: ActionButtonTone;
  modalTitle: string;
  body: (c: ComplaintCase) => string;
  impact: (c: ComplaintCase) => ActionImpact;
  fields: ActionFieldSpec[];
  confirmLabel: string;
}

export const DEADLINE_OPTIONS = ["1 hari kerja", "3 hari kerja", "5 hari kerja", "7 hari kerja"];

/** PIC candidates for "Tugaskan / Alihkan Penanggung Jawab" / "Buka Kembali Pengaduan": internal Bappebti staff, or hand the case to the platform / bursa / kliring ecosystem. */
const PIC_OPTION_GROUPS = [
  { label: "Internal Bappebti", options: DEMO_USERS.filter((u) => u.role.startsWith("BAPPEBTI_")).map((u) => u.name) },
  { label: "Pialang", options: PLATFORM_LIST.filter((p) => p !== "Tidak tahu / belum terdaftar") },
  { label: "Bursa", options: BURSA_LIST },
  { label: "Kliring", options: KLIRING_LIST },
];

/** Remark penolakan baku (List Revisi 14 #1) — sama dengan modal Tolak Komplain / Tolak Pengaduan. */
export const CLOSE_ADMINISTRATIVE_REASONS = [
  "Isu sudah selesai",
  "Isu sedang aktif (sedang diproses)",
  "Isu sudah masuk ke proses pengadilan / arbitrase",
];

export const CASE_ACTIONS: Record<CaseActionId, CaseActionDefinition> = {
  "assign-to-member": {
    id: "assign-to-member",
    label: "Tugaskan / Alihkan Penanggung Jawab",
    tone: "primary",
    modalTitle: "Tugaskan / Alihkan Penanggung Jawab",
    body: () =>
      "Pengaduan akan ditugaskan atau dialihkan penanggung jawabnya. Pilih Pialang Berjangka, unit ekosistem (bursa/kliring), atau staf internal Bappebti yang akan menangani selanjutnya.",
    impact: (c) => ({ status: "Dalam Tindak Lanjut Pelaku Usaha", owner: c.platform, sla: "3 hari kerja" }),
    fields: [
      { id: "targetInstitution", label: "Tujuan penugasan", type: "select", required: true, optionGroups: PIC_OPTION_GROUPS, defaultValue: (c) => c.platform },
      { id: "instructions", label: "Instruksi / alasan", type: "textarea", required: true },
      { id: "deadline", label: "Batas waktu", type: "select", required: true, options: DEADLINE_OPTIONS, defaultValue: () => "3 hari kerja" },
      { id: "internalNote", label: "Catatan internal Bappebti", type: "textarea", required: false },
      { id: "attachmentNote", label: "Lampiran (opsional)", type: "text", required: false },
    ],
    confirmLabel: "Tugaskan / Alihkan",
  },
  "request-reporter-data": {
    id: "request-reporter-data",
    label: "Minta Data dari Pelapor",
    tone: "secondary",
    modalTitle: "Minta Data Tambahan dari Pelapor",
    body: () => "Pelapor akan diminta melengkapi data atau dokumen tambahan sebelum kasus dapat dilanjutkan.",
    impact: () => ({ status: "Menunggu Data Pelapor", owner: "Pelapor", sla: "3 hari kerja" }),
    fields: [
      { id: "dataRequested", label: "Data yang diminta", type: "textarea", required: true },
      { id: "noteForReporter", label: "Catatan untuk pelapor", type: "textarea", required: true },
      { id: "deadline", label: "Batas waktu", type: "select", required: true, options: DEADLINE_OPTIONS, defaultValue: () => "3 hari kerja" },
    ],
    confirmLabel: "Kirim Permintaan",
  },
  "request-supervisor-review": {
    id: "request-supervisor-review",
    label: "Minta Review Supervisor",
    tone: "secondary",
    modalTitle: "Minta Review Supervisor Bappebti",
    body: () => "Kasus akan ditinjau oleh supervisor internal Bappebti sebelum keputusan pengawasan berikutnya diambil.",
    impact: () => ({ status: "Dalam Review Supervisor", owner: "Supervisor Bappebti", sla: "1 hari kerja" }),
    fields: [
      { id: "reviewReason", label: "Alasan review", type: "textarea", required: true },
      { id: "decisionPoints", label: "Poin yang perlu diputuskan", type: "textarea", required: true },
      { id: "targetSupervisor", label: "Supervisor tujuan", type: "text", required: true },
    ],
    confirmLabel: "Kirim ke Supervisor",
  },
  "approve-resolution": {
    id: "approve-resolution",
    label: "Setujui Penyelesaian",
    tone: "success",
    modalTitle: "Setujui Penyelesaian Pengaduan",
    body: (c) => `Solusi yang diajukan ${c.platform} akan disetujui dan diteruskan kepada pelapor untuk konfirmasi.`,
    impact: () => ({ status: "Penyelesaian Disetujui", owner: "Pelapor (konfirmasi)", sla: "3 hari kerja" }),
    fields: [
      { id: "resolutionSummary", label: "Ringkasan penyelesaian", type: "textarea", required: true },
      { id: "approvalNote", label: "Catatan persetujuan", type: "textarea", required: true },
      { id: "resolutionDocument", label: "Dokumen resolusi", type: "text", required: true },
    ],
    confirmLabel: "Setujui Penyelesaian",
  },
  "close-case": {
    id: "close-case",
    label: "Tutup Pengaduan",
    tone: "secondary",
    modalTitle: "Tutup Pengaduan",
    body: () => "Pengaduan akan ditutup dan dinyatakan selesai setelah hasil akhir dikonfirmasi.",
    impact: () => ({ status: "Selesai", owner: "-", sla: "Ditutup" }),
    fields: [
      { id: "finalSummary", label: "Ringkasan hasil akhir", type: "textarea", required: true },
      { id: "closureBasis", label: "Dasar penutupan", type: "textarea", required: true },
      { id: "resolutionDate", label: "Tanggal penyelesaian", type: "date", required: true },
    ],
    confirmLabel: "Tutup Pengaduan",
  },
  "send-reminder": {
    id: "send-reminder",
    label: "Kirim Pengingat",
    tone: "secondary",
    modalTitle: "Kirim Pengingat",
    body: (c) => `Pengingat akan dikirimkan kepada pihak yang saat ini bertanggung jawab menindaklanjuti pengaduan ${c.ticket}.`,
    impact: () => ({ status: "Tidak ada perubahan status", owner: "Tidak berubah", sla: "Tidak berubah" }),
    fields: [{ id: "note", label: "Catatan pengingat (opsional)", type: "textarea", required: false }],
    confirmLabel: "Kirim Pengingat",
  },
  "request-resolution-revision": {
    id: "request-resolution-revision",
    label: "Minta Perbaikan Resolusi",
    tone: "secondary",
    modalTitle: "Minta Perbaikan Resolusi",
    body: (c) => `Usulan penyelesaian dari ${c.platform} akan dikembalikan untuk diperbaiki sebelum ditinjau kembali.`,
    impact: (c) => ({ status: "Dalam Tindak Lanjut Pelaku Usaha", owner: c.platform, sla: "3 hari kerja" }),
    fields: [{ id: "revisionNote", label: "Catatan perbaikan yang diminta", type: "textarea", required: true }],
    confirmLabel: "Kirim Permintaan Perbaikan",
  },
  "escalate-enforcement": {
    id: "escalate-enforcement",
    label: "Eskalasi ke Penegakan",
    tone: "destructive",
    modalTitle: "Eskalasi ke Unit Penegakan",
    body: () => "Kasus akan dialihkan ke Unit Penegakan Bappebti untuk investigasi dugaan pelanggaran lebih lanjut. Gunakan hanya untuk kasus berisiko tinggi.",
    impact: () => ({ status: "Dalam Proses Penegakan", owner: "Unit Penegakan Bappebti", sla: "-" }),
    fields: [
      { id: "reason", label: "Alasan eskalasi", type: "textarea", required: true },
      { id: "suspectedViolation", label: "Dugaan pelanggaran", type: "textarea", required: true },
      { id: "supportingEvidence", label: "Bukti pendukung", type: "text", required: true },
    ],
    confirmLabel: "Eskalasi ke Penegakan",
  },
  "close-administrative": {
    id: "close-administrative",
    label: "Tutup Secara Administratif",
    tone: "muted",
    modalTitle: "Tutup Pengaduan Secara Administratif",
    body: () => "Pengaduan akan ditutup tanpa penyelesaian substantif.",
    impact: () => ({ status: "Ditutup Secara Administratif", owner: "-", sla: "Ditutup" }),
    fields: [
      { id: "reasonCategory", label: "Alasan (remark baku)", type: "select", required: true, options: CLOSE_ADMINISTRATIVE_REASONS },
      { id: "evidencePdf", label: "Dokumen bukti pendukung (PDF)", type: "pdf", required: true },
      { id: "note", label: "Catatan tambahan (opsional)", type: "textarea", required: false },
    ],
    confirmLabel: "Tutup Secara Administratif",
  },
  "reopen-case": {
    id: "reopen-case",
    label: "Buka Kembali Pengaduan",
    tone: "secondary",
    modalTitle: "Buka Kembali Pengaduan",
    body: () => "Pengaduan yang sebelumnya ditutup akan dibuka kembali untuk peninjauan lanjutan.",
    impact: () => ({ status: "Dibuka Kembali", owner: "Bappebti", sla: "Ditentukan ulang" }),
    fields: [
      { id: "reason", label: "Alasan pembukaan kembali", type: "textarea", required: true },
      { id: "newPic", label: "PIC baru", type: "select", required: true, optionGroups: PIC_OPTION_GROUPS },
      { id: "newSla", label: "SLA baru", type: "select", required: true, options: DEADLINE_OPTIONS },
    ],
    confirmLabel: "Buka Kembali Pengaduan",
  },
};

interface ContextualActions {
  primary: CaseActionId | null;
  secondary: CaseActionId[];
  overflow: CaseActionId[];
}

const NEW_OR_UNDER_REVIEW: InternalWorkflowState[] = [
  "INTAKE_SUBMITTED",
  "IDENTITY_VERIFICATION",
  "JURISDICTION_REVIEW",
  "COMPLETENESS_REVIEW",
  "ROUTING_REVIEW",
  "BAPPEBTI_OPERATIONAL_REVIEW",
  "BAPPEBTI_SUPERVISOR_REVIEW",
  "REOPENED",
];
const WAITING_STATES: InternalWorkflowState[] = ["WAITING_REPORTER_INFORMATION", "WAITING_MEMBER_INFORMATION"];
const MEMBER_WORKING: InternalWorkflowState[] = [
  "ASSIGNED_TO_PLATFORM",
  "ASSIGNED_TO_BURSA",
  "ASSIGNED_TO_CLEARING",
  "MEMBER_ACKNOWLEDGED",
  "MEMBER_INVESTIGATION",
  "WAITING_SUPPORTING_INSTITUTION",
];
const RESOLUTION_PROPOSED: InternalWorkflowState[] = ["PROPOSED_RESOLUTION", "WAITING_REPORTER_DECISION"];
const RESOLUTION_APPROVED: InternalWorkflowState[] = ["RESOLUTION_IMPLEMENTATION", "IMPLEMENTATION_VERIFICATION"];
const CLOSED_STATES: InternalWorkflowState[] = [
  "CLOSED_RESOLVED",
  "CLOSED_ADMINISTRATIVE",
  "REFERRED_EXTERNAL",
  "OUTSIDE_JURISDICTION",
  "WITHDRAWN_BY_REPORTER",
];

/** Section: CONTEXTUAL ACTION LOGIC — only actions relevant to the case's current status are shown. */
export function getContextualActions(c: ComplaintCase): ContextualActions {
  const state = deriveWorkflowState(c);
  const isClosed = CLOSED_STATES.includes(state);

  let visible: CaseActionId[];
  if (WAITING_STATES.includes(state)) {
    visible = ["send-reminder", "close-administrative", "assign-to-member"];
  } else if (MEMBER_WORKING.includes(state)) {
    visible = ["send-reminder", "request-supervisor-review", "escalate-enforcement"];
  } else if (RESOLUTION_PROPOSED.includes(state)) {
    visible = ["approve-resolution", "request-resolution-revision", "request-supervisor-review"];
  } else if (RESOLUTION_APPROVED.includes(state)) {
    visible = ["close-case", "reopen-case"];
  } else if (state === "ENFORCEMENT_REVIEW") {
    visible = ["close-case", "request-supervisor-review"];
  } else if (isClosed) {
    visible = [];
  } else if (NEW_OR_UNDER_REVIEW.includes(state)) {
    visible = ["assign-to-member", "request-reporter-data", "request-supervisor-review"];
  } else {
    visible = ["assign-to-member", "request-reporter-data", "request-supervisor-review"];
  }

  const overflowCandidates: CaseActionId[] = ["escalate-enforcement", "assign-to-member", "close-administrative", "reopen-case"];
  const overflow = overflowCandidates.filter((id) => {
    if (visible.includes(id)) return false;
    if (id === "reopen-case") return isClosed;
    if (isClosed) return false;
    return true;
  });

  return {
    primary: visible[0] ?? null,
    secondary: visible.slice(1, 4),
    overflow,
  };
}

/** Infers the case's new owner type from a selected PIC name (Section: Alihkan PIC / Buka Kembali Pengaduan). */
function resolvePicOwner(name: string): OwnerType | null {
  if (DEMO_USERS.some((u) => u.role.startsWith("BAPPEBTI_") && u.name === name)) return "Bappebti";
  if (PLATFORM_LIST.includes(name)) return "Pialang";
  if (BURSA_LIST.includes(name)) return "Bursa";
  if (KLIRING_LIST.includes(name)) return "Kliring";
  return null;
}

interface CaseActionExecutionContext {
  ticket: string;
  actor: string;
  values: Record<string, string>;
}

function noteFromValues(fields: ActionFieldSpec[], values: Record<string, string>): string {
  return fields
    .filter((f) => values[f.id]?.trim())
    .map((f) => `${f.label}: ${values[f.id].trim()}`)
    .join(" — ");
}

function transitionTo(
  ticket: string,
  state: InternalWorkflowState,
  event: Omit<TimelineEvent, "datetime">
) {
  setWorkflowState(ticket, state, WORKFLOW_STATES[state].publicLabel, event);
}

/** Executes a confirmed "Tindakan Berikutnya" action against the mock case store. */
export function executeCaseAction(actionId: CaseActionId, { ticket, actor, values }: CaseActionExecutionContext) {
  const def = CASE_ACTIONS[actionId];
  const note = noteFromValues(def.fields, values);

  switch (actionId) {
    case "assign-to-member": {
      const target = values.targetInstitution?.trim() || "-";
      const newOwner = resolvePicOwner(target);
      if (newOwner === "Bappebti") {
        // Purely an internal PIC reassignment — no member/ecosystem workflow transition.
        setCaseOfficer(ticket, target);
        addTimelineEvent(ticket, {
          actor,
          role: "Bappebti",
          action: "Penanggung jawab (PIC) dialihkan",
          note,
          status: "info",
          visibility: "internal",
        });
      } else {
        const owner = newOwner ?? "Pialang";
        setCurrentOwner(ticket, owner);
        setCaseOfficer(ticket, target);
        const targetState: InternalWorkflowState =
          owner === "Bursa" ? "ASSIGNED_TO_BURSA" : owner === "Kliring" ? "ASSIGNED_TO_CLEARING" : "MEMBER_INVESTIGATION";
        transitionTo(ticket, targetState, {
          actor,
          role: "Bappebti",
          action: "Tugaskan / Alihkan Penanggung Jawab",
          note,
          status: "info",
          visibility: "public",
        });
      }
      break;
    }
    case "request-reporter-data":
      setCurrentOwner(ticket, "Pelapor");
      transitionTo(ticket, "WAITING_REPORTER_INFORMATION", {
        actor,
        role: "Bappebti",
        action: "Minta Data dari Pelapor",
        note,
        status: "warning",
        visibility: "public",
      });
      break;
    case "request-supervisor-review":
      setCurrentOwner(ticket, "Bappebti");
      transitionTo(ticket, "BAPPEBTI_SUPERVISOR_REVIEW", {
        actor,
        role: "Bappebti",
        action: "Minta Review Supervisor",
        note,
        status: "warning",
        visibility: "internal",
      });
      break;
    case "approve-resolution":
      setCurrentOwner(ticket, "Pelapor");
      transitionTo(ticket, "RESOLUTION_IMPLEMENTATION", {
        actor,
        role: "Bappebti",
        action: "Setujui Penyelesaian",
        note,
        status: "success",
        visibility: "public",
      });
      break;
    case "close-case":
      closeCase(ticket, note, actor);
      break;
    case "send-reminder":
      addTimelineEvent(ticket, {
        actor,
        role: "Bappebti",
        action: "Pengingat dikirim",
        note: values.note?.trim() || "Pengingat dikirim kepada penanggung jawab saat ini.",
        status: "info",
        visibility: "internal",
      });
      break;
    case "request-resolution-revision":
      transitionTo(ticket, "MEMBER_INVESTIGATION", {
        actor,
        role: "Bappebti",
        action: "Minta Perbaikan Resolusi",
        note,
        status: "warning",
        visibility: "public",
      });
      break;
    case "escalate-enforcement":
      setCurrentOwner(ticket, "Bappebti");
      transitionTo(ticket, "ENFORCEMENT_REVIEW", {
        actor,
        role: "Bappebti",
        action: "Eskalasi ke Unit Penegakan",
        note,
        status: "danger",
        visibility: "internal",
      });
      break;
    case "close-administrative":
      if (values.evidencePdf) addEvidence(ticket, [values.evidencePdf]);
      transitionTo(ticket, "CLOSED_ADMINISTRATIVE", {
        actor,
        role: "Bappebti",
        action: "Ditutup secara administratif",
        note: note || values.reasonCategory,
        status: "warning",
        visibility: "public",
      });
      break;
    case "reopen-case": {
      const newPic = values.newPic?.trim();
      if (newPic) {
        setCaseOfficer(ticket, newPic);
        const newOwner = resolvePicOwner(newPic);
        if (newOwner) setCurrentOwner(ticket, newOwner);
      }
      reopenCase(ticket, note, actor);
      break;
    }
  }
}
