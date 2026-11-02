// Central workflow configuration (Section 3 of the product spec).
// Every case-status decision in the app should be derived from this file
// instead of being re-implemented ad hoc inside page components.

import {
  ComplaintCase,
  EscalationLevel,
  InstitutionStructure,
  InternalWorkflowState,
  PublicStatus,
  SlaClock,
  SlaClockStatus,
} from "./types";
import { Role } from "./permissions";
import { getActionOwnerLabel } from "./format";

export type BadgeTone = "navy" | "amber" | "red" | "green" | "muted";

export interface WorkflowStateConfig {
  code: InternalWorkflowState;
  publicLabel: PublicStatus;
  internalLabel: string;
  description: string;
  allowedNext: InternalWorkflowState[];
  rolesAllowed: Role[];
  reporterActionRequired: boolean;
  memberActionRequired: boolean;
  slaClockAction: "start" | "pause" | "resume" | "stop" | "none";
  badgeTone: BadgeTone;
  icon: string;
  isOpen: boolean;
}

const BAPPEBTI_ROLES: Role[] = [
  "BAPPEBTI_INTAKE_OFFICER",
  "BAPPEBTI_CASE_OFFICER",
  "BAPPEBTI_SUPERVISOR",
  "BAPPEBTI_ENFORCEMENT",
  "BAPPEBTI_EXECUTIVE",
];
const MEMBER_OFFICER_ROLES: Role[] = [
  "PLATFORM_CASE_OFFICER",
  "PLATFORM_SUPERVISOR",
  "BURSA_CASE_OFFICER",
  "BURSA_SUPERVISOR",
  "CLEARING_CASE_OFFICER",
  "CLEARING_SUPERVISOR",
];
const REPORTER_ROLES: Role[] = ["PUBLIC_REPORTER", "PUBLIC_REPRESENTATIVE"];

export const WORKFLOW_STATES: Record<InternalWorkflowState, WorkflowStateConfig> = {
  DRAFT: {
    code: "DRAFT",
    publicLabel: "Draft",
    internalLabel: "Draf tersimpan",
    description: "Pengaduan sedang disusun oleh pelapor dan belum dikirimkan.",
    allowedNext: ["INTAKE_SUBMITTED"],
    rolesAllowed: REPORTER_ROLES,
    reporterActionRequired: true,
    memberActionRequired: false,
    slaClockAction: "none",
    badgeTone: "muted",
    icon: "FileEdit",
    isOpen: true,
  },
  INTAKE_SUBMITTED: {
    code: "INTAKE_SUBMITTED",
    publicLabel: "Pengaduan Diterima",
    internalLabel: "Intake diterima",
    description: "Pengaduan telah diterima sistem dan menunggu verifikasi awal petugas intake.",
    allowedNext: ["IDENTITY_VERIFICATION", "JURISDICTION_REVIEW", "COMPLETENESS_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "Inbox",
    isOpen: true,
  },
  IDENTITY_VERIFICATION: {
    code: "IDENTITY_VERIFICATION",
    publicLabel: "Sedang Diperiksa",
    internalLabel: "Verifikasi identitas",
    description: "Bappebti memverifikasi identitas dan keabsahan pelapor.",
    allowedNext: ["JURISDICTION_REVIEW", "WAITING_REPORTER_INFORMATION"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "UserCheck",
    isOpen: true,
  },
  JURISDICTION_REVIEW: {
    code: "JURISDICTION_REVIEW",
    publicLabel: "Sedang Diperiksa",
    internalLabel: "Review yurisdiksi",
    description: "Bappebti menilai apakah permasalahan berada dalam ruang lingkup pengawasannya.",
    allowedNext: ["COMPLETENESS_REVIEW", "OUTSIDE_JURISDICTION", "REFERRED_EXTERNAL"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "Scale",
    isOpen: true,
  },
  COMPLETENESS_REVIEW: {
    code: "COMPLETENESS_REVIEW",
    publicLabel: "Sedang Diperiksa",
    internalLabel: "Review kelengkapan",
    description: "Bappebti memeriksa kelengkapan data dan bukti pendukung pengaduan.",
    allowedNext: ["WAITING_REPORTER_INFORMATION", "ROUTING_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "ClipboardCheck",
    isOpen: true,
  },
  WAITING_REPORTER_INFORMATION: {
    code: "WAITING_REPORTER_INFORMATION",
    publicLabel: "Menunggu Data dari Anda",
    internalLabel: "Menunggu Data Pelapor",
    description: "Bappebti atau anggota memerlukan data atau dokumen tambahan dari pelapor.",
    allowedNext: ["ROUTING_REVIEW", "MEMBER_INVESTIGATION", "WITHDRAWN_BY_REPORTER", "CLOSED_ADMINISTRATIVE"],
    rolesAllowed: [...BAPPEBTI_ROLES, ...REPORTER_ROLES],
    reporterActionRequired: true,
    memberActionRequired: false,
    slaClockAction: "pause",
    badgeTone: "amber",
    icon: "MessageSquareWarning",
    isOpen: true,
  },
  ROUTING_REVIEW: {
    code: "ROUTING_REVIEW",
    publicLabel: "Sedang Diperiksa",
    internalLabel: "Review routing",
    description: "Bappebti menentukan lembaga yang bertanggung jawab menindaklanjuti pengaduan.",
    allowedNext: ["ASSIGNED_TO_PLATFORM", "ASSIGNED_TO_BURSA", "ASSIGNED_TO_CLEARING", "OUTSIDE_JURISDICTION"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "GitBranch",
    isOpen: true,
  },
  ASSIGNED_TO_PLATFORM: {
    code: "ASSIGNED_TO_PLATFORM",
    publicLabel: "Diteruskan ke Pihak Terkait",
    internalLabel: "Ditugaskan ke platform",
    description: "Kasus diteruskan ke pelaku usaha (platform) untuk ditindaklanjuti.",
    allowedNext: ["MEMBER_ACKNOWLEDGED", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "Send",
    isOpen: true,
  },
  ASSIGNED_TO_BURSA: {
    code: "ASSIGNED_TO_BURSA",
    publicLabel: "Diteruskan ke Pihak Terkait",
    internalLabel: "Ditugaskan ke bursa",
    description: "Kasus memerlukan supervisi atau tindak lanjut dari bursa terkait.",
    allowedNext: ["MEMBER_ACKNOWLEDGED", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "Send",
    isOpen: true,
  },
  ASSIGNED_TO_CLEARING: {
    code: "ASSIGNED_TO_CLEARING",
    publicLabel: "Diteruskan ke Pihak Terkait",
    internalLabel: "Ditugaskan ke kliring",
    description: "Kasus memerlukan rekonsiliasi atau tindak lanjut dari lembaga kliring.",
    allowedNext: ["MEMBER_ACKNOWLEDGED", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "Send",
    isOpen: true,
  },
  MEMBER_ACKNOWLEDGED: {
    code: "MEMBER_ACKNOWLEDGED",
    publicLabel: "Diteruskan ke Pihak Terkait",
    internalLabel: "Diterima anggota",
    description: "Anggota telah menerima penugasan kasus dan akan memulai investigasi.",
    allowedNext: ["MEMBER_INVESTIGATION"],
    rolesAllowed: MEMBER_OFFICER_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "CheckCheck",
    isOpen: true,
  },
  MEMBER_INVESTIGATION: {
    code: "MEMBER_INVESTIGATION",
    publicLabel: "Sedang Diinvestigasi",
    internalLabel: "Dalam Tindak Lanjut Pelaku Usaha",
    description: "Pelaku usaha terkait sedang memeriksa dan menindaklanjuti pengaduan yang ditugaskan.",
    allowedNext: [
      "WAITING_MEMBER_INFORMATION",
      "WAITING_SUPPORTING_INSTITUTION",
      "PROPOSED_RESOLUTION",
      "BAPPEBTI_OPERATIONAL_REVIEW",
    ],
    rolesAllowed: MEMBER_OFFICER_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "amber",
    icon: "Search",
    isOpen: true,
  },
  WAITING_MEMBER_INFORMATION: {
    code: "WAITING_MEMBER_INFORMATION",
    publicLabel: "Menunggu Data dari Anda",
    internalLabel: "Menunggu data tambahan",
    description: "Anggota meminta data atau dokumen tambahan dari pelapor untuk melanjutkan investigasi.",
    allowedNext: ["MEMBER_INVESTIGATION", "CLOSED_ADMINISTRATIVE"],
    rolesAllowed: [...MEMBER_OFFICER_ROLES, ...REPORTER_ROLES],
    reporterActionRequired: true,
    memberActionRequired: false,
    slaClockAction: "pause",
    badgeTone: "amber",
    icon: "MessageSquareWarning",
    isOpen: true,
  },
  WAITING_SUPPORTING_INSTITUTION: {
    code: "WAITING_SUPPORTING_INSTITUTION",
    publicLabel: "Sedang Diinvestigasi",
    internalLabel: "Menunggu institusi pendukung",
    description: "Menunggu tanggapan bursa atau lembaga kliring sebagai institusi pendukung.",
    allowedNext: ["MEMBER_INVESTIGATION", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: MEMBER_OFFICER_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "amber",
    icon: "Users",
    isOpen: true,
  },
  BAPPEBTI_OPERATIONAL_REVIEW: {
    code: "BAPPEBTI_OPERATIONAL_REVIEW",
    publicLabel: "Dalam Review Bappebti",
    internalLabel: "Review operasional Bappebti",
    description: "Petugas operasional Bappebti meninjau perkembangan dan kepatuhan penanganan kasus.",
    allowedNext: ["BAPPEBTI_SUPERVISOR_REVIEW", "MEMBER_INVESTIGATION", "PROPOSED_RESOLUTION", "ENFORCEMENT_REVIEW"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "ShieldCheck",
    isOpen: true,
  },
  BAPPEBTI_SUPERVISOR_REVIEW: {
    code: "BAPPEBTI_SUPERVISOR_REVIEW",
    publicLabel: "Dalam Review Bappebti",
    internalLabel: "Dalam Review Supervisor",
    description: "Supervisor Bappebti meninjau kasus untuk keputusan pengawasan lanjutan.",
    allowedNext: ["ENFORCEMENT_REVIEW", "PROPOSED_RESOLUTION", "REFERRED_EXTERNAL", "CLOSED_ADMINISTRATIVE"],
    rolesAllowed: ["BAPPEBTI_SUPERVISOR", "BAPPEBTI_EXECUTIVE"],
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "red",
    icon: "ShieldAlert",
    isOpen: true,
  },
  ENFORCEMENT_REVIEW: {
    code: "ENFORCEMENT_REVIEW",
    publicLabel: "Dalam Review Bappebti",
    internalLabel: "Dalam Proses Penegakan",
    description: "Unit Penegakan Bappebti menginvestigasi dugaan pelanggaran lebih lanjut.",
    allowedNext: ["PROPOSED_RESOLUTION", "REFERRED_EXTERNAL", "CLOSED_ADMINISTRATIVE"],
    rolesAllowed: ["BAPPEBTI_ENFORCEMENT", "BAPPEBTI_EXECUTIVE"],
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "red",
    icon: "Gavel",
    isOpen: true,
  },
  PROPOSED_RESOLUTION: {
    code: "PROPOSED_RESOLUTION",
    publicLabel: "Solusi Diajukan",
    internalLabel: "Resolusi diajukan",
    description: "Anggota telah mengajukan solusi dan menunggu keputusan/review Bappebti.",
    allowedNext: ["WAITING_REPORTER_DECISION", "MEMBER_INVESTIGATION"],
    rolesAllowed: [...MEMBER_OFFICER_ROLES, ...BAPPEBTI_ROLES],
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "green",
    icon: "FileCheck2",
    isOpen: true,
  },
  WAITING_REPORTER_DECISION: {
    code: "WAITING_REPORTER_DECISION",
    publicLabel: "Solusi Diajukan",
    internalLabel: "Menunggu keputusan pelapor",
    description: "Pelapor diminta menerima, menerima sebagian, atau menyatakan keberatan atas solusi yang diajukan.",
    allowedNext: ["RESOLUTION_IMPLEMENTATION", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: REPORTER_ROLES,
    reporterActionRequired: true,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "amber",
    icon: "HelpCircle",
    isOpen: true,
  },
  RESOLUTION_IMPLEMENTATION: {
    code: "RESOLUTION_IMPLEMENTATION",
    publicLabel: "Solusi Sedang Dilaksanakan",
    internalLabel: "Penyelesaian Disetujui",
    description: "Penyelesaian telah disetujui Bappebti dan sedang dilaksanakan oleh pelaku usaha.",
    allowedNext: ["IMPLEMENTATION_VERIFICATION", "BAPPEBTI_OPERATIONAL_REVIEW"],
    rolesAllowed: MEMBER_OFFICER_ROLES,
    reporterActionRequired: false,
    memberActionRequired: true,
    slaClockAction: "start",
    badgeTone: "amber",
    icon: "Hammer",
    isOpen: true,
  },
  IMPLEMENTATION_VERIFICATION: {
    code: "IMPLEMENTATION_VERIFICATION",
    publicLabel: "Solusi Sedang Dilaksanakan",
    internalLabel: "Verifikasi implementasi",
    description: "Bappebti memverifikasi bukti pelaksanaan solusi sebelum kasus dinyatakan selesai.",
    allowedNext: ["CLOSED_RESOLVED", "RESOLUTION_IMPLEMENTATION"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "navy",
    icon: "ScanSearch",
    isOpen: true,
  },
  CLOSED_RESOLVED: {
    code: "CLOSED_RESOLVED",
    publicLabel: "Selesai",
    internalLabel: "Ditutup — terselesaikan",
    description: "Kasus telah selesai dan solusi telah diverifikasi terlaksana.",
    allowedNext: ["REOPENED"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "stop",
    badgeTone: "green",
    icon: "CheckCircle2",
    isOpen: false,
  },
  CLOSED_ADMINISTRATIVE: {
    code: "CLOSED_ADMINISTRATIVE",
    publicLabel: "Ditutup Secara Administratif",
    internalLabel: "Ditutup administratif",
    description: "Kasus ditutup karena pelapor tidak memberikan data yang diminta dalam batas waktu.",
    allowedNext: ["REOPENED"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "stop",
    badgeTone: "muted",
    icon: "FolderX",
    isOpen: false,
  },
  REFERRED_EXTERNAL: {
    code: "REFERRED_EXTERNAL",
    publicLabel: "Dialihkan ke Instansi Lain",
    internalLabel: "Dialihkan ke instansi lain",
    description: "Kasus berada di luar kewenangan Bappebti dan telah dialihkan ke instansi berwenang lain.",
    allowedNext: [],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "stop",
    badgeTone: "muted",
    icon: "ExternalLink",
    isOpen: false,
  },
  OUTSIDE_JURISDICTION: {
    code: "OUTSIDE_JURISDICTION",
    publicLabel: "Di Luar Kewenangan",
    internalLabel: "Di luar yurisdiksi",
    description: "Permasalahan yang dilaporkan tidak berada dalam ruang lingkup pengawasan Bappebti.",
    allowedNext: ["REFERRED_EXTERNAL", "REOPENED"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "stop",
    badgeTone: "muted",
    icon: "XCircle",
    isOpen: false,
  },
  WITHDRAWN_BY_REPORTER: {
    code: "WITHDRAWN_BY_REPORTER",
    publicLabel: "Ditutup Secara Administratif",
    internalLabel: "Dicabut oleh pelapor",
    description: "Pelapor menarik kembali pengaduan yang telah diajukan.",
    allowedNext: ["REOPENED"],
    rolesAllowed: REPORTER_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "stop",
    badgeTone: "muted",
    icon: "Undo2",
    isOpen: false,
  },
  REOPENED: {
    code: "REOPENED",
    publicLabel: "Sedang Diperiksa",
    internalLabel: "Dibuka kembali",
    description: "Kasus yang sebelumnya ditutup telah dibuka kembali untuk peninjauan lanjutan.",
    allowedNext: ["BAPPEBTI_OPERATIONAL_REVIEW", "MEMBER_INVESTIGATION"],
    rolesAllowed: BAPPEBTI_ROLES,
    reporterActionRequired: false,
    memberActionRequired: false,
    slaClockAction: "start",
    badgeTone: "amber",
    icon: "RotateCcw",
    isOpen: true,
  },
};

/** Fallback mapping so cases created before the richer model still resolve to a sensible workflow state. */
function legacyToWorkflowState(c: ComplaintCase): InternalWorkflowState {
  switch (c.status) {
    case "Baru":
      return "INTAKE_SUBMITTED";
    case "Verifikasi":
      return "COMPLETENESS_REVIEW";
    case "Menunggu Klarifikasi":
      return c.currentOwner === "Pelapor" ? "WAITING_REPORTER_INFORMATION" : "WAITING_MEMBER_INFORMATION";
    case "Resolusi Diajukan":
      return c.currentOwner === "Pelapor" ? "WAITING_REPORTER_DECISION" : "PROPOSED_RESOLUTION";
    case "Selesai":
      return "CLOSED_RESOLVED";
    case "Ditolak":
      return "OUTSIDE_JURISDICTION";
    case "Diproses":
    default:
      if (c.currentOwner === "Bappebti") return "BAPPEBTI_OPERATIONAL_REVIEW";
      if (c.currentOwner === "Pelapor") return "WAITING_REPORTER_INFORMATION";
      return "MEMBER_INVESTIGATION";
  }
}

export function deriveWorkflowState(c: ComplaintCase): InternalWorkflowState {
  return c.workflowState ?? legacyToWorkflowState(c);
}

export function getPublicStatus(c: ComplaintCase): PublicStatus {
  if (c.publicStatus) return c.publicStatus;
  return WORKFLOW_STATES[deriveWorkflowState(c)].publicLabel;
}

/** Derives the full institution/accountability structure for cases authored before the richer model existed. */
export function getInstitution(c: ComplaintCase): InstitutionStructure {
  if (c.institution) return c.institution;
  const supportingInstitutions: string[] = [];
  if (c.category.toLowerCase().includes("settlement") && c.currentOwner !== "Kliring") {
    supportingInstitutions.push(c.kliringEntity);
  }
  const escalationLevel: EscalationLevel =
    c.currentOwner === "Bappebti" ? (c.severity === "Kritis" ? 3 : 2) : c.slaStatus === "Lewat SLA" ? 1 : 0;
  return {
    regulatoryOwner: "Bappebti",
    leadInstitution: c.platform,
    currentActionOwner: c.currentOwner,
    supportingInstitutions,
    bursa: c.bursaEntity,
    clearing: c.kliringEntity,
    decisionAuthority: c.currentOwner === "Bappebti" ? "Bappebti Supervisor" : "Bappebti Case Officer",
    escalationLevel,
    escalationReason: c.escalationReason,
  };
}

/** Derives a minimal but real SLA clock set for cases authored before the multi-clock model existed. */
export function getSlaClocks(c: ComplaintCase): SlaClock[] {
  if (c.slaClocks) return c.slaClocks;
  const status: SlaClockStatus =
    c.slaStatus === "Aman" ? "Aman" : c.slaStatus === "Mendekati SLA" ? "Mendekati Batas Waktu" : "Lewat Batas Waktu";
  const primaryType = c.currentOwner === "Bappebti" ? "Review Bappebti" : c.currentOwner === "Pelapor" ? "Klarifikasi Pelapor" : "Respons Substantif Anggota";
  return [
    {
      type: primaryType,
      startTime: c.createdAt,
      deadline: c.slaDeadline,
      status,
      responsibleParty: c.currentOwner,
    },
    {
      type: "Usia Kasus Keseluruhan",
      startTime: c.createdAt,
      deadline: c.slaDeadline,
      status: status === "Lewat Batas Waktu" ? "Perlu Perhatian" : "Aman",
      responsibleParty: "Bappebti",
    },
  ];
}

export function getAllowedTransitions(c: ComplaintCase, userRole: Role): WorkflowStateConfig[] {
  const current = WORKFLOW_STATES[deriveWorkflowState(c)];
  return current.allowedNext
    .map((code) => WORKFLOW_STATES[code])
    .filter((cfg) => cfg.rolesAllowed.includes(userRole));
}

export function canTransition(c: ComplaintCase, targetState: InternalWorkflowState, userRole: Role): boolean {
  const current = WORKFLOW_STATES[deriveWorkflowState(c)];
  if (!current.allowedNext.includes(targetState)) return false;
  return WORKFLOW_STATES[targetState].rolesAllowed.includes(userRole);
}

/** Answers the four questions every case screen must address (Section 2.1). */
export interface StatusExplanation {
  what: string;
  who: string;
  action: string;
  deadline: string;
  actionRequiredFromViewer: boolean;
}

export function getStatusExplanation(c: ComplaintCase, viewer: "public" | "internal" = "public"): StatusExplanation {
  const state = WORKFLOW_STATES[deriveWorkflowState(c)];
  const ownerLabel = getActionOwnerLabel(c.currentOwner);
  const deadline = c.slaDeadline ? `Pembaruan berikutnya diharapkan paling lambat ${c.slaDeadline} WIB.` : "Belum ada batas waktu yang ditetapkan.";

  if (viewer === "public") {
    const what =
      c.currentOwner === "Bappebti"
        ? `Bappebti sedang menangani langsung pengaduan ini terkait ${c.title.toLowerCase()}.`
        : `${c.platform} sedang ${state.description.charAt(0).toLowerCase()}${state.description.slice(1)}`;
    const action = state.reporterActionRequired
      ? "Tindakan Anda diperlukan — mohon lengkapi data atau berikan tanggapan yang diminta."
      : "Tidak ada tindakan yang diperlukan dari Anda saat ini.";
    return {
      what,
      who: `Sedang ditangani oleh: ${ownerLabel}.`,
      action,
      deadline,
      actionRequiredFromViewer: state.reporterActionRequired,
    };
  }

  return {
    what: `${state.internalLabel}: ${state.description}`,
    who: `Current action owner: ${ownerLabel}${c.institution?.caseOfficer ? ` (${c.institution.caseOfficer})` : ""}.`,
    action: state.memberActionRequired
      ? "Anggota wajib menindaklanjuti sesuai SLA yang berlaku."
      : "Menunggu proses internal Bappebti/anggota.",
    deadline,
    actionRequiredFromViewer: state.memberActionRequired,
  };
}

export function getNextRequiredAction(c: ComplaintCase): { owner: string; action: string; dueDate: string } {
  const state = WORKFLOW_STATES[deriveWorkflowState(c)];
  return {
    owner: getActionOwnerLabel(c.currentOwner),
    action: state.description,
    dueDate: c.slaDeadline,
  };
}

// Six-stage public progress tracker (Section 10).
const PROGRESS_STAGES = [
  "Diterima",
  "Diperiksa",
  "Ditindaklanjuti",
  "Ditinjau Bappebti",
  "Solusi",
  "Selesai",
] as const;

const STATE_TO_STAGE_INDEX: Record<InternalWorkflowState, number> = {
  DRAFT: -1,
  INTAKE_SUBMITTED: 0,
  IDENTITY_VERIFICATION: 1,
  JURISDICTION_REVIEW: 1,
  COMPLETENESS_REVIEW: 1,
  WAITING_REPORTER_INFORMATION: 1,
  ROUTING_REVIEW: 1,
  ASSIGNED_TO_PLATFORM: 2,
  ASSIGNED_TO_BURSA: 2,
  ASSIGNED_TO_CLEARING: 2,
  MEMBER_ACKNOWLEDGED: 2,
  MEMBER_INVESTIGATION: 2,
  WAITING_MEMBER_INFORMATION: 2,
  WAITING_SUPPORTING_INSTITUTION: 2,
  BAPPEBTI_OPERATIONAL_REVIEW: 3,
  BAPPEBTI_SUPERVISOR_REVIEW: 3,
  ENFORCEMENT_REVIEW: 3,
  PROPOSED_RESOLUTION: 4,
  WAITING_REPORTER_DECISION: 4,
  RESOLUTION_IMPLEMENTATION: 4,
  IMPLEMENTATION_VERIFICATION: 4,
  CLOSED_RESOLVED: 5,
  CLOSED_ADMINISTRATIVE: 5,
  REFERRED_EXTERNAL: 5,
  OUTSIDE_JURISDICTION: 5,
  WITHDRAWN_BY_REPORTER: 5,
  REOPENED: 1,
};

export interface CaseProgress {
  stageIndex: number;
  stages: { label: string; status: "done" | "current" | "upcoming" }[];
}

export function getCaseProgress(c: ComplaintCase): CaseProgress {
  const state = deriveWorkflowState(c);
  const idx = STATE_TO_STAGE_INDEX[state];
  return {
    stageIndex: idx,
    stages: PROGRESS_STAGES.map((label, i) => ({
      label,
      status: i < idx ? "done" : i === idx ? "current" : "upcoming",
    })),
  };
}

export const ESCALATION_LEVEL_LABEL: Record<EscalationLevel, string> = {
  0: "Level 0 — Penanganan Normal",
  1: "Level 1 — Peringatan Operasional",
  2: "Level 2 — Perhatian Supervisor",
  3: "Level 3 — Intervensi Bappebti",
  4: "Level 4 — Penegakan / Manajemen Insiden",
};
