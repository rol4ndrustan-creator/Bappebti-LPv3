// Central clarification workflow configuration.
// Every clarification status label, transition rule, deadline computation,
// and permission check lives here instead of being scattered across pages.

import {
  ClarificationParty,
  ClarificationPartyType,
  ClarificationPriority,
  ClarificationRequest,
  ClarificationStatus,
} from "./types";
import { Role, ROLE_GROUP, can } from "./permissions";
import { formatDuration } from "./format";
import type { BadgeTone } from "./workflow-config";

/**
 * Fixed "current moment" for this prototype's SLA/deadline math. The mock
 * dataset's internal calendar sits in mid-June 2026 regardless of the real
 * system clock, so remaining-time/overdue calculations are computed against
 * this reference instead of `new Date()`.
 */
export const MOCK_NOW = new Date(2026, 5, 15, 15, 30);

const ID_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5, jul: 6, agu: 7, ags: 7, aug: 7,
  sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Formats a Date back into the "DD Mon YYYY, HH:mm" shape so round-tripping through parseMockDateTime stays exact. */
export function formatMockDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_LABELS[date.getMonth()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${date.getFullYear()}, ${hh}:${mm}`;
}

/** Parses the "DD Mon YYYY, HH:mm" Indonesian-formatted strings used throughout mock-data.ts. */
export function parseMockDateTime(input: string): Date {
  const match = input.match(/^(\d{1,2})\s+([A-Za-z]{3,4})\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2}))?/);
  if (!match) {
    const fallback = new Date(input);
    return Number.isNaN(fallback.getTime()) ? new Date(MOCK_NOW) : fallback;
  }
  const [, day, monthStr, year, hour, minute] = match;
  const month = ID_MONTHS[monthStr.toLowerCase()] ?? 0;
  return new Date(Number(year), month, Number(day), hour ? Number(hour) : 0, minute ? Number(minute) : 0);
}

// ---------------------------------------------------------------------------
// Status labels, tone, and transitions
// ---------------------------------------------------------------------------

export const CLARIFICATION_STATUS_LABEL: Record<ClarificationStatus, string> = {
  DRAFT: "Draf",
  SENT: "Terkirim",
  WAITING_RESPONSE: "Menunggu Respons",
  PARTIALLY_RESPONDED: "Respons Belum Lengkap",
  RESPONDED: "Respons Diterima",
  UNDER_REVIEW: "Sedang Ditinjau",
  REVISION_REQUESTED: "Perlu Perbaikan",
  COMPLETED: "Selesai",
  OVERDUE: "Lewat Batas Waktu",
  CANCELLED: "Dibatalkan",
};

export const CLARIFICATION_STATUS_TONE: Record<ClarificationStatus, BadgeTone> = {
  DRAFT: "muted",
  SENT: "navy",
  WAITING_RESPONSE: "amber",
  PARTIALLY_RESPONDED: "amber",
  RESPONDED: "navy",
  UNDER_REVIEW: "navy",
  REVISION_REQUESTED: "red",
  COMPLETED: "green",
  OVERDUE: "red",
  CANCELLED: "muted",
};

export const CLARIFICATION_PRIORITY_LABEL: Record<ClarificationPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

export const CLARIFICATION_PARTY_LABEL: Record<ClarificationPartyType, string> = {
  REPORTER: "Pelapor",
  PLATFORM: "Pialang",
  BURSA: "Bursa",
  CLEARING: "Kliring",
  BAPPEBTI: "Bappebti",
};

/** Section 10 transition diagram. OVERDUE is authored explicitly rather than derived live, consistent with the rest of the app's pre-set SLA fields. */
export const CLARIFICATION_TRANSITIONS: Record<ClarificationStatus, ClarificationStatus[]> = {
  DRAFT: ["SENT"],
  SENT: ["WAITING_RESPONSE"],
  WAITING_RESPONSE: ["RESPONDED", "PARTIALLY_RESPONDED", "OVERDUE", "CANCELLED"],
  RESPONDED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["COMPLETED", "REVISION_REQUESTED"],
  REVISION_REQUESTED: ["WAITING_RESPONSE", "RESPONDED", "OVERDUE"],
  PARTIALLY_RESPONDED: ["WAITING_RESPONSE", "RESPONDED"],
  OVERDUE: ["RESPONDED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function getAllowedClarificationTransitions(status: ClarificationStatus): ClarificationStatus[] {
  return CLARIFICATION_TRANSITIONS[status];
}

const ANSWERABLE_STATUSES: ClarificationStatus[] = [
  "SENT",
  "WAITING_RESPONSE",
  "PARTIALLY_RESPONDED",
  "REVISION_REQUESTED",
  "OVERDUE",
];

const REVIEWABLE_STATUSES: ClarificationStatus[] = ["RESPONDED", "PARTIALLY_RESPONDED", "UNDER_REVIEW"];

// ---------------------------------------------------------------------------
// Deadline / remaining-time display
// ---------------------------------------------------------------------------

export type ClarificationDeadlineStatus =
  | "Aman"
  | "Mendekati Batas Waktu"
  | "Jatuh Tempo Hari Ini"
  | "Lewat Batas Waktu"
  | "Selesai";

export const DEADLINE_STATUS_TONE: Record<ClarificationDeadlineStatus, BadgeTone> = {
  Aman: "green",
  "Mendekati Batas Waktu": "amber",
  "Jatuh Tempo Hari Ini": "amber",
  "Lewat Batas Waktu": "red",
  Selesai: "muted",
};

export function getClarificationDeadlineStatus(cl: ClarificationRequest): ClarificationDeadlineStatus {
  if (cl.status === "COMPLETED" || cl.status === "CANCELLED") return "Selesai";
  if (cl.status === "OVERDUE") return "Lewat Batas Waktu";
  const due = parseMockDateTime(cl.dueAt);
  const diffMs = due.getTime() - MOCK_NOW.getTime();
  if (diffMs < 0) return "Lewat Batas Waktu";
  if (due.toDateString() === MOCK_NOW.toDateString()) return "Jatuh Tempo Hari Ini";
  const diffHours = diffMs / 3_600_000;
  return diffHours <= 48 ? "Mendekati Batas Waktu" : "Aman";
}

/** e.g. "2 hari 4 jam tersisa" / "Jatuh tempo hari ini pukul 17.00" / "Terlambat 1 hari 3 jam". */
export function formatClarificationRemaining(cl: ClarificationRequest): string {
  if (cl.status === "COMPLETED") return `Selesai pada ${cl.completedAt ?? cl.respondedAt ?? "-"}`;
  if (cl.status === "CANCELLED") return "Permintaan dibatalkan";
  const due = parseMockDateTime(cl.dueAt);
  const diffMs = due.getTime() - MOCK_NOW.getTime();
  const diffHours = diffMs / 3_600_000;
  if (diffHours < 0 || cl.status === "OVERDUE") {
    return `Terlambat ${formatDuration(Math.abs(diffHours))}`;
  }
  if (due.toDateString() === MOCK_NOW.toDateString()) {
    const hh = String(due.getHours()).padStart(2, "0");
    const mm = String(due.getMinutes()).padStart(2, "0");
    return `Jatuh tempo hari ini pukul ${hh}.${mm}`;
  }
  return `${formatDuration(diffHours)} tersisa`;
}

// ---------------------------------------------------------------------------
// Action ownership — who must act, and what the viewer should be told
// ---------------------------------------------------------------------------

/** Returns the party that must currently act, or null once completed/cancelled. */
export function getClarificationActionOwnerParty(cl: ClarificationRequest): ClarificationParty | null {
  switch (cl.status) {
    case "DRAFT":
      return cl.requestedBy;
    case "SENT":
    case "WAITING_RESPONSE":
    case "PARTIALLY_RESPONDED":
    case "REVISION_REQUESTED":
    case "OVERDUE":
      return cl.requestedFrom;
    case "RESPONDED":
    case "UNDER_REVIEW":
      return cl.requestedBy;
    case "COMPLETED":
    case "CANCELLED":
      return null;
  }
}

/** Section 13/17 — how much of the history/notes a viewer's role group is allowed to see. */
export function getMaxHistoryVisibility(role: Role): "public" | "member" | "internal" {
  const group = ROLE_GROUP[role];
  if (group === "Bappebti" || group === "Administrasi") return "internal";
  if (group === "Pialang" || group === "Ekosistem") return "member";
  return "public";
}

export function roleToClarificationPartyType(role: Role): ClarificationPartyType | null {
  if (role === "PUBLIC_REPORTER" || role === "PUBLIC_REPRESENTATIVE") return "REPORTER";
  if (role === "PLATFORM_CASE_OFFICER" || role === "PLATFORM_SUPERVISOR") return "PLATFORM";
  if (role === "BURSA_CASE_OFFICER" || role === "BURSA_SUPERVISOR") return "BURSA";
  if (role === "CLEARING_CASE_OFFICER" || role === "CLEARING_SUPERVISOR") return "CLEARING";
  if (role.startsWith("BAPPEBTI_")) return "BAPPEBTI";
  return null;
}

export interface ClarificationViewer {
  role: Role;
  institution: string;
}

function partyMatchesViewer(party: ClarificationParty, viewer: ClarificationViewer): boolean {
  const partyType = roleToClarificationPartyType(viewer.role);
  if (!partyType) return false;
  if (partyType === "BAPPEBTI") return party.partyType === "BAPPEBTI";
  return party.partyType === partyType && party.institutionName === viewer.institution;
}

export type ClarificationViewerRelation = "actor" | "counterparty" | "observer";

export function getViewerRelation(cl: ClarificationRequest, viewer: ClarificationViewer): ClarificationViewerRelation {
  const actionParty = getClarificationActionOwnerParty(cl);
  if (!actionParty) return "observer";
  return partyMatchesViewer(actionParty, viewer) ? "actor" : "counterparty";
}

/** Section 16 — one distinct label per action-ownership situation, never a generic "Menunggu Respon". */
export function getClarificationActionLabel(cl: ClarificationRequest, viewer: ClarificationViewer): string {
  if (cl.status === "COMPLETED") return "Selesai";
  if (cl.status === "CANCELLED") return "Dibatalkan";
  const actionParty = getClarificationActionOwnerParty(cl);
  if (!actionParty) return "Selesai";
  const relation = getViewerRelation(cl, viewer);
  if (relation === "actor") {
    if (cl.status === "REVISION_REQUESTED") return "Perlu Perbaikan";
    if (cl.status === "RESPONDED" || cl.status === "UNDER_REVIEW") return "Tinjau Respons";
    return "Tindakan Anda Diperlukan";
  }
  return `Menunggu ${CLARIFICATION_PARTY_LABEL[actionParty.partyType]}`;
}

export function getClarificationActionButtonLabel(cl: ClarificationRequest, viewer: ClarificationViewer): string {
  if (cl.status === "COMPLETED" || cl.status === "CANCELLED") return "Lihat Detail";
  const relation = getViewerRelation(cl, viewer);
  if (relation !== "actor") return "Lihat Detail";
  switch (cl.status) {
    case "DRAFT":
      return "Lanjutkan Draf";
    case "REVISION_REQUESTED":
      return "Perbaiki Respons";
    case "RESPONDED":
    case "UNDER_REVIEW":
      return "Tinjau Respons";
    case "SENT":
    case "WAITING_RESPONSE":
    case "PARTIALLY_RESPONDED":
    case "OVERDUE":
      return "Jawab Sekarang";
    default:
      return "Lihat Detail";
  }
}

// ---------------------------------------------------------------------------
// Permission helpers (Section 9) — scoped by the viewer's own institution.
// These shape the UI only; there is no real backend enforcing them.
// ---------------------------------------------------------------------------

export function canViewClarification(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  const group = ROLE_GROUP[viewer.role];
  if (group === "Administrasi" || group === "Bappebti") return true;
  if (group === "Publik") {
    if (!cl.visibility.publicReporter) return false;
    return cl.requestedBy.partyType === "REPORTER" || cl.requestedFrom.partyType === "REPORTER";
  }
  return partyMatchesViewer(cl.requestedBy, viewer) || partyMatchesViewer(cl.requestedFrom, viewer);
}

export function canRespondToClarification(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  if (!canViewClarification(viewer, cl)) return false;
  if (!ANSWERABLE_STATUSES.includes(cl.status)) return false;
  return partyMatchesViewer(cl.requestedFrom, viewer);
}

export function canCreateClarification(viewer: ClarificationViewer): boolean {
  return can(viewer.role, "request_clarification");
}

export function canReviewClarification(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  if (!canViewClarification(viewer, cl)) return false;
  if (!REVIEWABLE_STATUSES.includes(cl.status)) return false;
  if (ROLE_GROUP[viewer.role] === "Bappebti") return true;
  return partyMatchesViewer(cl.requestedBy, viewer);
}

export function canCompleteClarification(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  return canReviewClarification(viewer, cl);
}

export function canRequestRevision(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  return canReviewClarification(viewer, cl);
}

function partyDisplayName(party: ClarificationParty): string {
  if (party.partyType === "REPORTER") return "Pelapor";
  if (party.partyType === "BAPPEBTI") return "Bappebti";
  return party.institutionName;
}

/** Section 17.C — a useful preview instead of an aggressively truncated raw string. */
export function getLastResponseSummary(
  cl: ClarificationRequest
): { text: string; timestamp: string; responder: string } | null {
  if (cl.formalResponse) {
    return {
      text: cl.formalResponse.summary,
      timestamp: cl.formalResponse.submittedAt,
      responder: cl.formalResponse.respondingOfficer,
    };
  }
  const lastEvent = [...cl.history].reverse().find((h) => h.note);
  if (lastEvent?.note) {
    return { text: lastEvent.note, timestamp: lastEvent.timestamp, responder: lastEvent.actor };
  }
  return null;
}

/**
 * Section 3 — makes the request unambiguous instead of a bare "Diminta dari: Pelapor",
 * e.g. "Bappebti meminta PT Bursa Digital Nusantara konfirmasi rekening tujuan penarikan."
 */
export function describeClarificationRelation(cl: ClarificationRequest): string {
  const subject = cl.subject.charAt(0).toLowerCase() + cl.subject.slice(1);
  return `${partyDisplayName(cl.requestedBy)} meminta ${partyDisplayName(cl.requestedFrom)} ${subject}.`;
}

export function canExtendClarificationDeadline(viewer: ClarificationViewer, cl: ClarificationRequest): boolean {
  if (!canViewClarification(viewer, cl)) return false;
  if (ROLE_GROUP[viewer.role] === "Bappebti") return true;
  const isSupervisor = viewer.role.endsWith("_SUPERVISOR");
  return isSupervisor && partyMatchesViewer(cl.requestedBy, viewer);
}

// ---------------------------------------------------------------------------
// List/summary aggregation shared by the Platform/Bursa/Kliring Klarifikasi pages
// ---------------------------------------------------------------------------

export interface ClarificationSummaryCounts {
  needsMyAction: number;
  waitingOtherParty: number;
  dueSoon: number;
  overdue: number;
  completed: number;
}

/** Which member portal's Klarifikasi route a case-workspace link should point at (Bappebti has full oversight access to all of them). Platform is its own top-level portal; Bursa and Kliring live under the Akun Ekosistem portal. */
export function getClarificationPortalBasePath(cl: ClarificationRequest): string {
  if (cl.requestedBy.partyType === "BURSA" || cl.requestedFrom.partyType === "BURSA") return "/ekosistem/bursa";
  if (cl.requestedBy.partyType === "CLEARING" || cl.requestedFrom.partyType === "CLEARING") return "/ekosistem/kliring";
  return "/platform";
}

export function getClarificationSummaryCounts(
  clarifications: ClarificationRequest[],
  viewer: ClarificationViewer
): ClarificationSummaryCounts {
  let needsMyAction = 0;
  let waitingOtherParty = 0;
  let dueSoon = 0;
  let overdue = 0;
  let completed = 0;

  for (const cl of clarifications) {
    const relation = getViewerRelation(cl, viewer);
    if (cl.status === "COMPLETED" || cl.status === "CANCELLED") {
      completed += cl.status === "COMPLETED" ? 1 : 0;
      continue;
    }
    if (relation === "actor") needsMyAction += 1;
    else waitingOtherParty += 1;

    const deadlineStatus = getClarificationDeadlineStatus(cl);
    if (deadlineStatus === "Lewat Batas Waktu") overdue += 1;
    else if (deadlineStatus === "Mendekati Batas Waktu" || deadlineStatus === "Jatuh Tempo Hari Ini") dueSoon += 1;
  }

  return { needsMyAction, waitingOtherParty, dueSoon, overdue, completed };
}
