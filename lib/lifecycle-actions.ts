"use client";

// Tindakan siklus tiket (List Revisi 12). Setiap tindakan memperbarui catatan
// siklus, menulis kronologi kasus, dan mencatat Audit Log.

import { ArbitrationVerdict, PialangRejectReason, TicketLifecycle } from "./types";
import { updateLifecycle } from "./mock-service/lifecycle-store";
import { addClarificationReply, addEvidence, addTimelineEvent } from "./mock-service/store";
import { logAudit } from "./mock-service/audit-store";

export interface Actor {
  name: string;
  institution: string;
  /** Label peran untuk kronologi, mis. "Platform", "Bappebti", "Pelapor", "BAKTI". */
  role: string;
}

const iso = () => new Date().toISOString();
const stamp = (a: Actor) => ({ by: a.name, institution: a.institution, at: iso() });

function record(ticket: string, a: Actor, action: string, note: string, status: "success" | "info" | "warning" | "danger", visibility: "public" | "internal" = "public") {
  addTimelineEvent(ticket, { actor: a.name, role: a.role, action, note, status, visibility });
  logAudit({ activity: action, ticket, detail: note });
}

// --- #3 Verifikasi Pialang ---------------------------------------------------

export function pialangApprove(ticket: string, a: Actor) {
  updateLifecycle(ticket, (lc) => ({ ...lc, pialangReview: { decision: "Disetujui", ...stamp(a) } }));
  record(ticket, a, "Komplain disetujui Pialang", "Komplain diverifikasi dan dilanjutkan ke tahap musyawarah.", "success");
}

export function pialangReject(ticket: string, a: Actor, reason: PialangRejectReason, document: string, note: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, pialangReview: { decision: "Ditolak", reason, document, note, ...stamp(a) } }));
  addEvidence(ticket, [document]);
  record(ticket, a, "Pengajuan Reject oleh Pialang", `Alasan: ${reason}. Bukti penolakan: ${document}.${note ? ` ${note}` : ""}`, "warning");
}

export function editIncidentDate(ticket: string, a: Actor, before: string, after: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, incidentDate: after, incidentDateLog: [...lc.incidentDateLog, { before, after, ...stamp(a) }] }));
  record(ticket, a, "Koreksi Tanggal Kejadian", `Tanggal kejadian diubah dari '${before || "-"}' menjadi '${after}'.`, "info", "internal");
}

export function setLegalProceeding(ticket: string, a: Actor, answer: "Ya" | "Tidak", document?: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, legalProceeding: { answer, document, ...stamp(a) } }));
  if (document) addEvidence(ticket, [document]);
  record(
    ticket,
    a,
    "Verifikasi hukum dicatat",
    answer === "Ya" ? `Sengketa telah diproses di pengadilan/kepolisian. Salinan: ${document}.` : "Sengketa belum pernah diproses di pengadilan/kepolisian.",
    "info",
    "internal"
  );
}

// --- #4 Review Bappebti atas penolakan Pialang -------------------------------

export function bappebtiReturnToPialang(ticket: string, a: Actor, note: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, bappebtiReview: { decision: "Kembalikan ke Pialang", note, ...stamp(a) } }));
  record(ticket, a, "Penolakan Pialang ditolak Bappebti", `Tiket dikembalikan ke Pialang dan wajib dilanjutkan ke tahap musyawarah. ${note}`, "warning");
}

export function bappebtiApproveRejection(ticket: string, a: Actor, note: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, bappebtiReview: { decision: "Setujui Penolakan", note, ...stamp(a) } }));
  addClarificationReply(
    ticket,
    a.name,
    "Bappebti",
    `Pemberitahuan resmi: pengaduan Anda tidak dapat dilanjutkan karena ${note || "penolakan Pialang telah diverifikasi Bappebti"}. ` +
      "Apabila terdapat fakta atau bukti baru, Anda direkomendasikan untuk mengajukan komplain baru melalui menu Buat Pengaduan.",
    { institution: "Bappebti", emailSent: true }
  );
  record(ticket, a, "Penolakan Pialang disetujui — Rejected", `Status tiket ditolak permanen. Notifikasi resmi & rekomendasi komplain baru dikirim ke nasabah. ${note}`, "danger");
}

// --- #5 Resolusi damai -------------------------------------------------------

export function proposeResolutionOffer(ticket: string, a: Actor, text: string, amount?: number) {
  updateLifecycle(ticket, (lc) => ({
    ...lc,
    resolutionOffers: [...lc.resolutionOffers, { id: `OFR-${Date.now().toString(36)}`, text, amount, ...stamp(a) }],
  }));
  record(ticket, a, "Tawaran resolusi diajukan", text, "info");
}

export function respondResolutionOffer(ticket: string, a: Actor, response: "Setuju" | "Tolak", note?: string) {
  updateLifecycle(ticket, (lc) => {
    const offers = [...lc.resolutionOffers];
    const last = offers[offers.length - 1];
    if (last && !last.response) offers[offers.length - 1] = { ...last, response, responseNote: note, respondedAt: iso() };
    return { ...lc, resolutionOffers: offers };
  });
  record(
    ticket,
    a,
    response === "Setuju" ? "Nasabah menyetujui resolusi — Close Resolusi" : "Nasabah menolak tawaran resolusi",
    note || (response === "Setuju" ? "Kesepakatan damai tercapai." : "Penanganan kembali ke tahap musyawarah."),
    response === "Setuju" ? "success" : "warning"
  );
}

// --- #6 Musyawarah gagal & arbitrase ----------------------------------------

export function markMusyawarahFailed(ticket: string, a: Actor, at: string) {
  updateLifecycle(ticket, (lc) => ({ ...lc, musyawarahFailedAt: at }));
  record(ticket, a, "Musyawarah berakhir Tidak Sepakat", "Nasabah dapat mengajukan penyelesaian melalui arbitrase (BAKTI) mulai H+1.", "warning");
}

export function submitArbitration(ticket: string, a: Actor, formFile: string) {
  updateLifecycle(ticket, (lc) => ({
    ...lc,
    arbitration: { institution: "BAKTI", formFile, submittedAt: iso(), submittedBy: a.name, hearings: [] },
  }));
  addEvidence(ticket, [formFile]);
  record(ticket, a, "Pendaftaran arbitrase BAKTI diajukan", `Formulir registrasi BAKTI: ${formFile}.`, "info");
}

// --- #7 BAKTI: Proses Penyelesaian Khusus -----------------------------------

export function baktiVerify(ticket: string, a: Actor, decision: "Disetujui" | "Ditolak", note: string) {
  updateLifecycle(ticket, (lc) => (lc.arbitration ? { ...lc, arbitration: { ...lc.arbitration, verification: { decision, note, ...stamp(a) } } } : lc));
  record(
    ticket,
    a,
    decision === "Disetujui" ? "Permohonan arbitrase disetujui BAKTI" : "Permohonan arbitrase ditolak BAKTI",
    note || (decision === "Disetujui" ? "Berkas permohonan lengkap; perkara masuk tahap sidang." : "Berkas permohonan tidak memenuhi syarat."),
    decision === "Disetujui" ? "success" : "danger"
  );
}

export function baktiAddHearing(ticket: string, a: Actor, h: { date: string; number: string; notula: string; document: string }) {
  updateLifecycle(ticket, (lc) =>
    lc.arbitration
      ? { ...lc, arbitration: { ...lc.arbitration, hearings: [...lc.arbitration.hearings, { id: `HRG-${Date.now().toString(36)}`, ...h, ...stamp(a) }] } }
      : lc
  );
  addEvidence(ticket, [h.document]);
  record(ticket, a, "Sidang arbitrase dicatat", `Sidang ${h.number} tanggal ${h.date}. ${h.notula}`, "info");
}

export function baktiVerdict(ticket: string, a: Actor, decision: ArbitrationVerdict, notes: string, document: string) {
  updateLifecycle(ticket, (lc) => (lc.arbitration ? { ...lc, arbitration: { ...lc.arbitration, verdict: { decision, notes, document, ...stamp(a) } } } : lc));
  addEvidence(ticket, [document]);
  record(ticket, a, "Putusan akhir arbitrase — Close Arbitrase", `${decision}. ${notes}`, "success");
}

export type { TicketLifecycle };
