"use client";

// Prototype interaction layer (Section 24 of the product spec).
//
// The mock CASES/NOTIFICATIONS arrays in lib/mock-data.ts are treated as
// read-only seed data. Every simulated user action is recorded here as an
// "override" keyed by ticket and persisted to localStorage, then merged
// on top of the seed data when a case is read. This keeps interactions
// real across a page reload without needing a backend, and gives us a
// single place ("Reset Demo Data") to wipe all simulated state.

import * as React from "react";
import {
  CaseStatus,
  ClarificationMessage,
  ComplaintCase,
  DisputeRecord,
  EscalationLevel,
  InternalNote,
  InternalWorkflowState,
  LinkedEcosystemEntity,
  OwnerType,
  PublicStatus,
  ReporterResolutionDecision,
  Responsibility,
  Severity,
  SlaStatus,
  TimelineEvent,
} from "../types";
import { nowDateTimeID } from "../format";
import { getInstitution } from "../workflow-config";
import { getCaseByTicket } from "../mock-data";
import { DISPUTE_STAGES, DisputeActionInput, applyDisputeAction, getDisputeOwner } from "../dispute-workflow";
import { logAudit } from "./audit-store";
import { subscribe, emitChange, getVersion } from "./event-bus";

const STORAGE_KEY = "bappebti-demo-overrides";
const NOTIF_STORAGE_KEY = "bappebti-demo-notifications-read";

interface CaseOverride {
  timelineAdditions: TimelineEvent[];
  clarificationAdditions: ClarificationMessage[];
  internalNoteAdditions: InternalNote[];
  workflowStateOverride?: InternalWorkflowState;
  publicStatusOverride?: PublicStatus;
  resolutionDecision?: ReporterResolutionDecision;
  resolutionDisagreementReason?: string;
  closed?: boolean;
  /** Priority/severity is no longer collected at submission — only Bappebti may assign it. */
  severityOverride?: Severity;
  currentOwnerOverride?: OwnerType;
  responsibilityOverride?: Responsibility;
  caseOfficerOverride?: string;
  escalationLevelOverride?: EscalationLevel;
  statusOverride?: CaseStatus;
  resolutionProposalOverride?: string;
  platformPicOverride?: string;
  evidenceAdditions?: string[];
  linkedEcosystemEntitiesOverride?: LinkedEcosystemEntity[];
  disputeOverride?: DisputeRecord;
}

/** Same fallback formula as getInstitution() in workflow-config.ts, kept in sync so a live owner/severity change is reflected immediately even on cases whose institution structure was pre-authored in the seed data. */
function deriveEscalationLevel(owner: OwnerType, severity: Severity, slaStatus: SlaStatus): EscalationLevel {
  return owner === "Bappebti" ? (severity === "Kritis" ? 3 : 2) : slaStatus === "Lewat SLA" ? 1 : 0;
}

type OverrideMap = Record<string, CaseOverride>;

function emptyOverride(): CaseOverride {
  return { timelineAdditions: [], clarificationAdditions: [], internalNoteAdditions: [] };
}

function readOverrides(): OverrideMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

function writeOverrides(map: OverrideMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore persistence failures in the prototype
  }
  emitChange();
}

function mutate(ticket: string, fn: (o: CaseOverride) => void) {
  const map = readOverrides();
  const current = map[ticket] ?? emptyOverride();
  fn(current);
  map[ticket] = current;
  writeOverrides(map);
}

export function getMergedCase(base: ComplaintCase | undefined): ComplaintCase | undefined {
  if (!base) return undefined;
  const o = readOverrides()[base.ticket];
  if (!o) return base;
  return {
    ...base,
    timeline: [...base.timeline, ...o.timelineAdditions],
    clarifications: [...base.clarifications, ...o.clarificationAdditions],
    internalNotes: [...(base.internalNotes ?? []), ...o.internalNoteAdditions],
    workflowState: o.workflowStateOverride ?? base.workflowState,
    publicStatus: o.publicStatusOverride ?? base.publicStatus,
    status: o.closed ? "Selesai" : o.statusOverride ?? base.status,
    severity: o.severityOverride ?? base.severity,
    currentOwner: o.currentOwnerOverride ?? base.currentOwner,
    responsibility: o.responsibilityOverride ?? base.responsibility,
    resolutionProposal: o.resolutionProposalOverride ?? base.resolutionProposal,
    platformPic: o.platformPicOverride ?? base.platformPic,
    evidences: [...base.evidences, ...(o.evidenceAdditions ?? [])],
    linkedEcosystemEntities: o.linkedEcosystemEntitiesOverride ?? base.linkedEcosystemEntities ?? [],
    dispute: o.disputeOverride ?? base.dispute,
    institution:
      o.caseOfficerOverride || o.escalationLevelOverride !== undefined
        ? {
            ...getInstitution(base),
            caseOfficer: o.caseOfficerOverride ?? getInstitution(base).caseOfficer,
            escalationLevel: o.escalationLevelOverride ?? getInstitution(base).escalationLevel,
          }
        : base.institution,
    resolution: base.resolution
      ? {
          ...base.resolution,
          reporterDecision: o.resolutionDecision ?? base.resolution.reporterDecision,
          reporterDisagreementReason: o.resolutionDisagreementReason ?? base.resolution.reporterDisagreementReason,
        }
      : base.resolution,
  };
}

export function addClarificationReply(
  ticket: string,
  from: string,
  role: string,
  message: string,
  opts: { institution?: string; emailSent?: boolean } = {}
) {
  const isReporter = role === "Pelapor";
  mutate(ticket, (o) => {
    o.clarificationAdditions.push({
      from,
      role,
      datetime: nowDateTimeID(),
      message,
      kind: isReporter ? "reply" : "public-response",
      institution: opts.institution,
      emailSent: opts.emailSent,
    });
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor: from,
      role,
      action: isReporter
        ? "Jawaban klarifikasi dikirim"
        : opts.emailSent
          ? "Respon publik dipublikasikan & dikirim ke email pelapor"
          : "Respon publik dipublikasikan",
      note: message,
      status: "info",
      visibility: "public",
    });
  });
}

export function addInternalNote(ticket: string, note: Omit<InternalNote, "timestamp" | "visibility">) {
  mutate(ticket, (o) => {
    o.internalNoteAdditions.push({ ...note, timestamp: nowDateTimeID(), visibility: "internal" });
  });
}

export function addTimelineEvent(
  ticket: string,
  event: Omit<TimelineEvent, "datetime">
) {
  mutate(ticket, (o) => {
    o.timelineAdditions.push({ ...event, datetime: nowDateTimeID() });
  });
}

export function setWorkflowState(
  ticket: string,
  state: InternalWorkflowState,
  publicStatus: PublicStatus,
  auditEvent: Omit<TimelineEvent, "datetime">
) {
  mutate(ticket, (o) => {
    o.workflowStateOverride = state;
    o.publicStatusOverride = publicStatus;
    o.timelineAdditions.push({ ...auditEvent, datetime: nowDateTimeID() });
  });
}

/** Only Bappebti roles may call this — enforced at the UI layer, not here (prototype has no real backend). */
export function setSeverity(ticket: string, severity: Severity) {
  mutate(ticket, (o) => {
    o.severityOverride = severity;
    const base = getCaseByTicket(ticket);
    if (base) {
      const owner = o.currentOwnerOverride ?? base.currentOwner;
      o.escalationLevelOverride = deriveEscalationLevel(owner, severity, base.slaStatus);
    }
  });
}

export function setCurrentOwner(ticket: string, owner: OwnerType) {
  mutate(ticket, (o) => {
    o.currentOwnerOverride = owner;
    o.responsibilityOverride =
      owner === "Bappebti" ? "BAPPEBTI OWNED" : owner === "Pelapor" ? "WAITING PUBLIC" : "MEMBER ASSIGNED";
    const base = getCaseByTicket(ticket);
    if (base) {
      const severity = o.severityOverride ?? base.severity;
      o.escalationLevelOverride = deriveEscalationLevel(owner, severity, base.slaStatus);
    }
  });
}

export function setCaseOfficer(ticket: string, name: string) {
  mutate(ticket, (o) => {
    o.caseOfficerOverride = name;
  });
}

export function setPlatformPic(ticket: string, name: string) {
  mutate(ticket, (o) => {
    o.platformPicOverride = name;
  });
}

export function setLinkedEcosystemEntities(ticket: string, entities: LinkedEcosystemEntity[]) {
  mutate(ticket, (o) => {
    o.linkedEcosystemEntitiesOverride = entities;
  });
}

export function addEvidence(ticket: string, filenames: string[]) {
  mutate(ticket, (o) => {
    o.evidenceAdditions = [...(o.evidenceAdditions ?? []), ...filenames];
  });
}

export function proposeResolution(ticket: string, proposalText: string, actor: string, actorRole: string) {
  mutate(ticket, (o) => {
    o.resolutionProposalOverride = proposalText;
    o.statusOverride = "Resolusi Diajukan";
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor,
      role: actorRole,
      action: "Usulan resolusi diajukan",
      note: proposalText,
      status: "info",
      visibility: "public",
    });
  });
}

export function respondToResolution(ticket: string, decision: ReporterResolutionDecision, reason?: string) {
  mutate(ticket, (o) => {
    o.resolutionDecision = decision;
    o.resolutionDisagreementReason = reason;
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor: "Pelapor",
      role: "Pelapor",
      action: `Keputusan pelapor: ${decision}`,
      note: reason ?? "Pelapor memberikan tanggapan atas solusi yang diajukan.",
      status: decision === "Menerima Sepenuhnya" ? "success" : "warning",
      visibility: "public",
    });
  });
}

export function closeCase(ticket: string, reason: string, actor = "Bappebti") {
  mutate(ticket, (o) => {
    o.closed = true;
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor,
      role: "Bappebti",
      action: "Kasus ditutup",
      note: reason,
      status: "success",
      visibility: "public",
    });
  });
}

export function reopenCase(ticket: string, reason: string, actor = "Bappebti") {
  mutate(ticket, (o) => {
    o.closed = false;
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor,
      role: "Bappebti",
      action: "Kasus dibuka kembali",
      note: reason,
      status: "warning",
      visibility: "public",
    });
  });
}

/**
 * Menjalankan satu langkah Mekanisme Penanganan Perselisihan Nasabah PBK:
 * memperbarui catatan perselisihan, pemilik tindakan, status publik, dan
 * mencatat langkah tersebut pada kronologi kasus.
 */
export function runDisputeAction(ticket: string, input: DisputeActionInput, actorRole: string) {
  const base = getMergedCase(getCaseByTicket(ticket));
  if (!base?.dispute) return;
  const bursaName = base.institution?.bursa ?? base.bursaEntity;
  const result = applyDisputeAction(base.dispute, input, base.platform, bursaName);
  const stage = DISPUTE_STAGES[result.next.stage];
  logAudit({
    activity: "Tindakan Penyelesaian Perselisihan",
    ticket,
    detail: `${result.timelineAction}: tahap '${DISPUTE_STAGES[base.dispute.stage].label}' menjadi '${stage.label}'.`,
  });
  mutate(ticket, (o) => {
    o.disputeOverride = result.next;
    o.currentOwnerOverride = getDisputeOwner(result.next);
    o.publicStatusOverride = stage.publicLabel;
    if (result.next.stage === "SELESAI" || result.next.stage === "PENGADILAN_BAKTI") o.statusOverride = "Selesai";
    else if (result.next.stage === "DITOLAK_MATERIIL") o.statusOverride = "Ditolak";
    else if (result.next.stage === "PERBAIKAN_FORMIL" || result.next.stage === "PILIHAN_PENYELESAIAN") o.statusOverride = "Menunggu Klarifikasi";
    else o.statusOverride = "Diproses";
    o.timelineAdditions.push({
      datetime: nowDateTimeID(),
      actor: input.actor,
      role: actorRole,
      action: result.timelineAction,
      note: result.timelineNote,
      status: result.tone,
      visibility: "public",
    });
  });
}

export function resetDemoData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(NOTIF_STORAGE_KEY);
    window.localStorage.removeItem("bappebti-demo-supervisory-actions");
    window.localStorage.removeItem("bappebti-demo-added-members");
    window.localStorage.removeItem("bappebti-demo-audit-events");
    window.localStorage.removeItem("bappebti-demo-meetings");
    window.localStorage.removeItem("bappebti-demo-meeting-outcomes");
  } catch {
    // ignore
  }
  emitChange();
}

export function useCaseData(base: ComplaintCase | undefined): ComplaintCase | undefined {
  // useSyncExternalStore requires getSnapshot to return a stable reference
  // between actual changes. getMergedCase builds a new object every call, so
  // we subscribe to the (primitive, value-comparable) version counter and
  // recompute the derived object in useMemo instead of inside getSnapshot.
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version isn't read in the body, it only forces recomputation when the store changes
  return React.useMemo(() => getMergedCase(base), [base, version]);
}

/** Same as useCaseData but for a list of cases, e.g. the operational queue tables. */
export function useCasesData(base: ComplaintCase[]): ComplaintCase[] {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version isn't read in the body, it only forces recomputation when the store changes
  return React.useMemo(() => base.map((c) => getMergedCase(c)!), [base, version]);
}

// --- Notifications read state ---

function readNotifRead(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markNotificationRead(key: string) {
  const read = new Set(readNotifRead());
  read.add(key);
  try {
    window.localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(Array.from(read)));
  } catch {
    // ignore
  }
  emitChange();
}

export function useNotificationReadState(): { isRead: (key: string) => boolean; markRead: (key: string) => void } {
  const snapshot = React.useSyncExternalStore(
    subscribe,
    () => readNotifRead().join(","),
    () => ""
  );
  const readSet = React.useMemo(() => new Set(snapshot ? snapshot.split(",") : []), [snapshot]);
  return {
    isRead: (key: string) => readSet.has(key),
    markRead: markNotificationRead,
  };
}
