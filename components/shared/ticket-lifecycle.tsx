"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { useToast } from "@/components/shared/toast-provider";
import { ComplaintCase, PialangRejectReason } from "@/lib/types";
import { ViewerGroup, getViewerGroup } from "@/lib/permissions";
import { useDemoSession } from "@/lib/demo-session";
import { useLifecycleView } from "@/lib/mock-service/lifecycle-store";
import { useBusinessParams } from "@/lib/mock-service/params-store";
import { LifecycleView, TICKET_STATUS_TONE } from "@/lib/ticket-lifecycle";
import {
  Actor,
  bappebtiApproveRejection,
  bappebtiReturnToPialang,
  editIncidentDate,
  assignPialangFromTriage,
  bappebtiReject,
  pialangApprove,
  pialangReject,
  recordMediationOutcome,
  requestRevision,
  submitRevision,
  proposeResolutionOffer,
  respondResolutionOffer,
  setLegalProceeding,
  submitArbitration,
} from "@/lib/lifecycle-actions";
import { formatWIB } from "@/lib/case-pdf";
import { formatCurrencyIDR } from "@/lib/format";
import { PLATFORM_LIST } from "@/lib/mock-data";
import { Select } from "@/components/ui/select";
import { downloadBaktiRegistrationForm, downloadCourtCoverLetter } from "@/lib/lifecycle-pdf";
import { CalendarClock, Check, Download, FileText, Gavel, Handshake, Pencil, Scale, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const REJECT_REASONS: PialangRejectReason[] = ["Isu sudah selesai", "Isu sedang aktif (sedang diproses)", "Isu sudah masuk ke proses pengadilan / arbitrase"];

/** Pihak yang sedang bertindak, untuk kronologi & audit. */
export function useLifecycleActor(c?: ComplaintCase): Actor {
  const { user } = useDemoSession();
  const group = getViewerGroup(user.role);
  if (group === "User") return { name: c?.reporterName ?? user.name, institution: "Pelapor", role: "Pelapor" };
  if (group === "Bappebti") return { name: user.name, institution: "Bappebti", role: "Bappebti" };
  if (group === "Pialang") return { name: user.name, institution: user.institution, role: "Pialang" };
  if (group === "EkosistemPengawas") return { name: user.name, institution: "BAKTI", role: "BAKTI" };
  return { name: user.name, institution: user.institution, role: "Ekosistem" };
}

const fmt = (iso?: string) => (iso ? `${formatWIB(new Date(iso))} WIB` : "-");

// ---------------------------------------------------------------------------

export function TicketStatusBadge({ complaintCase }: { complaintCase: ComplaintCase }) {
  const v = useLifecycleView(complaintCase);
  if (!v) return <span className="inline-block h-5 w-24 rounded bg-muted-bg animate-pulse" aria-label="Memuat status" />;
  return <Badge variant={TICKET_STATUS_TONE[v.status]}>{v.status.toUpperCase()}</Badge>;
}

/** Hitung mundur SLA Penyelesaian Kasus (List Revisi 12 #8). */
export function SlaCountdown({ view }: { view: LifecycleView }) {
  if (view.isClosed) return <span className="text-[11px] text-muted">SLA penyelesaian: selesai</span>;
  const d = view.slaRemainingDays;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        d < 0 ? "bg-red-bg text-red border-red/30" : d <= 7 ? "bg-amber-bg text-amber border-amber/30" : "bg-green-bg text-green border-green/30"
      )}
      title={`Batas SLA penyelesaian: ${formatWIB(view.slaDeadline)} WIB`}
    >
      <CalendarClock className="size-3" />
      {d < 0 ? `SLA terlewati ${Math.abs(d)} hari` : `Sisa ${d} hari (SLA Penyelesaian)`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Panel "Siklus Tiket" pada detail pengaduan internal
// ---------------------------------------------------------------------------

export function TicketLifecyclePanel({ complaintCase: c, viewerGroup }: { complaintCase: ComplaintCase; viewerGroup: ViewerGroup }) {
  const v = useLifecycleView(c);
  const params = useBusinessParams();
  const actor = useLifecycleActor(c);
  const { showToast } = useToast();
  const [dialog, setDialog] = React.useState<null | "reject" | "bappebti-reject" | "edit-date" | "return" | "approve-reject" | "revision" | "mediation">(null);
  const [assignTo, setAssignTo] = React.useState("");

  if (!v) return <div className="h-24 rounded-lg border border-border bg-card animate-pulse" />;
  const { lc, status } = v;
  const isPlatform = viewerGroup === "Pialang";
  const isBappebti = viewerGroup === "Bappebti";
  const canEditDate = (isPlatform || isBappebti) && !v.isClosed;
  const isBursa = viewerGroup === "EkosistemActive";
  const canPreReview = status === "Triase Bappebti" || status === "Menunggu Verifikasi Pialang";

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Scale className="size-4" /> Siklus Tiket
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TICKET_STATUS_TONE[status]}>{status.toUpperCase()}</Badge>
          <SlaCountdown view={v} />
        </div>
      </CardHeader>
      <CardContent className="py-3 space-y-3 text-xs">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <dt className="text-muted">Tiket terbit</dt>
            <dd className="font-medium">{fmt(lc.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Pihak terlapor</dt>
            <dd className="font-medium">
              {c.platform || "Belum diketahui (triase Bappebti)"}
              {lc.respondent && c.platform && (
                <span className="block text-muted font-normal">
                  {lc.respondent.name} — {lc.respondent.position}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tanggal Kejadian</dt>
            <dd className="font-medium flex items-center gap-1.5">
              {lc.incidentDate ?? "-"}
              {canEditDate && (
                <button title="Koreksi tanggal kejadian" onClick={() => setDialog("edit-date")} className="rounded p-0.5 text-muted hover:bg-muted-bg hover:text-navy">
                  <Pencil className="size-3.5" />
                </button>
              )}
            </dd>
            {v.expired && <dd className="text-red mt-0.5">Melewati batas kedaluwarsa perkara ({params.kedaluwarsaDays} hari).</dd>}
          </div>
        </dl>

        {lc.incidentDateLog.length > 0 && (
          <div className="rounded-md border border-border p-2">
            <p className="font-semibold mb-1">Riwayat Koreksi Tanggal Kejadian</p>
            <ul className="space-y-0.5">
              {lc.incidentDateLog.map((l, i) => (
                <li key={i}>
                  {fmt(l.at)} — <span className="font-medium">{l.by}</span> ({l.institution}): {l.before || "-"} → {l.after}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Revisi 13 #6: triase Bappebti bila pelapor belum mengetahui nama Pialang */}
        {status === "Triase Bappebti" && (
          <div className="rounded-md border border-navy/30 bg-navy/5 p-3 space-y-2">
            <p className="font-semibold text-navy">Triase Bappebti — Pialang belum diketahui pelapor</p>
            {isBappebti ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-72">
                  <Label className="text-[11px]">Teruskan ke Pialang</Label>
                  <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                    <option value="">Pilih Pialang hasil analisis...</option>
                    {PLATFORM_LIST.filter((p) => p !== "Tidak tahu / belum terdaftar").map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="sm"
                  disabled={!assignTo}
                  onClick={() => {
                    assignPialangFromTriage(c.ticket, actor, assignTo);
                    showToast(`Pengaduan diteruskan ke ${assignTo} untuk verifikasi.`);
                    setAssignTo("");
                  }}
                >
                  Assign ke Pialang
                </Button>
              </div>
            ) : (
              <p className="text-muted">Menunggu analisis dan penugasan oleh Bappebti.</p>
            )}
          </div>
        )}
        {lc.triage?.assignedPialang && (
          <p className="text-muted">
            Hasil triase: diteruskan ke {lc.triage.assignedPialang} oleh {lc.triage.by} pada {fmt(lc.triage.at)}.
          </p>
        )}

        {/* Revisi 13 #8: perbaikan berkas (Need Revision) */}
        {lc.revisionRequest && (
          <div className={cn("rounded-md border p-3 space-y-1", status === "Perlu Perbaikan Berkas" ? "border-amber/40 bg-amber-bg/40" : "border-border")}>
            <p className="font-semibold">Permintaan Perbaikan Berkas</p>
            <p>{lc.revisionRequest.note}</p>
            <p className="text-muted">
              Diminta {lc.revisionRequest.by} ({lc.revisionRequest.institution}), {fmt(lc.revisionRequest.at)}
              {lc.revisionRequest.resolvedAt ? ` · Perbaikan diterima ${fmt(lc.revisionRequest.resolvedAt)}: ${lc.revisionRequest.response ?? ""}` : " · Menunggu perbaikan nasabah"}
            </p>
          </div>
        )}
        {(isPlatform || isBappebti) && canPreReview && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialog("revision")}>
              Minta Perbaikan Berkas
            </Button>
            {isBappebti && (
              <Button size="sm" variant="destructive" onClick={() => setDialog("bappebti-reject")}>
                <X className="size-3.5" /> Tolak Pengaduan
              </Button>
            )}
          </div>
        )}
        {lc.bappebtiRejection && (
          <p className="rounded px-2 py-1.5 bg-red-bg text-red">
            Ditolak Bappebti — {lc.bappebtiRejection.reason}. Bukti: {lc.bappebtiRejection.document}
            {lc.bappebtiRejection.note && `. ${lc.bappebtiRejection.note}`} ({lc.bappebtiRejection.by}, {fmt(lc.bappebtiRejection.at)})
          </p>
        )}

        {/* Revisi 13 #8: mediasi Bursa */}
        {lc.mediation && (
          <div className={cn("rounded-md border p-3 space-y-1.5", status === "Proses Mediasi Bursa" ? "border-amber/40 bg-amber-bg/40" : "border-border")}>
            <p className="font-semibold">Mediasi Bursa — {lc.mediation.bursa}</p>
            <p className="text-muted">Dimulai {fmt(lc.mediation.at)} oleh {lc.mediation.by}.</p>
            {lc.mediation.outcome ? (
              <p>
                Hasil: <span className="font-semibold">{lc.mediation.outcome}</span>
                {lc.mediation.note && ` — ${lc.mediation.note}`} ({fmt(lc.mediation.endedAt)})
              </p>
            ) : isBursa || isBappebti ? (
              <Button size="sm" onClick={() => setDialog("mediation")}>
                Catat Hasil Mediasi
              </Button>
            ) : (
              <p className="text-muted">Menunggu hasil mediasi dari Bursa.</p>
            )}
          </div>
        )}

        {/* #3 Verifikasi komplain baru oleh Pialang */}
        {status === "Menunggu Verifikasi Pialang" && (
          <div className="rounded-md border border-navy/30 bg-navy/5 p-3 space-y-2">
            <p className="font-semibold text-navy">Verifikasi Komplain Baru oleh Pialang</p>
            <p>
              Batas review Pialang: <span className="font-medium">{fmt(v.pialangDeadline.toISOString())}</span> ({params.slaReviewPialangBusinessDays} hari kerja). Jika
              terlewati, komplain otomatis disetujui dan lanjut ke musyawarah.
            </p>
            {isPlatform ? (
              <PialangVerification complaintCase={c} view={v} actor={actor} onReject={() => setDialog("reject")} />
            ) : (
              <p className="text-muted">Menunggu keputusan Pialang ({c.platform}).</p>
            )}
          </div>
        )}
        {v.autoApproved && (
          <p className="rounded-md bg-green-bg/60 px-2 py-1.5">
            Komplain <span className="font-semibold">disetujui otomatis</span> karena SLA Review Pialang ({params.slaReviewPialangBusinessDays} hari kerja) terlewati.
          </p>
        )}
        {lc.pialangReview?.decision === "Disetujui" && (
          <p className="text-muted">
            Disetujui Pialang oleh {lc.pialangReview.by} pada {fmt(lc.pialangReview.at)}.
          </p>
        )}
        {lc.legalProceeding && (
          <p className="text-muted">
            Diproses di pengadilan/kepolisian: <span className="font-medium text-foreground">{lc.legalProceeding.answer}</span>
            {lc.legalProceeding.document && ` — ${lc.legalProceeding.document}`}
          </p>
        )}

        {/* #3-4 Penolakan Pialang & review Bappebti */}
        {lc.pialangReview?.decision === "Ditolak" && (
          <div className={cn("rounded-md border p-3 space-y-1.5", status === "Pengajuan Reject" ? "border-amber/40 bg-amber-bg/40" : "border-border")}>
            <p className="font-semibold">Pengajuan Reject oleh Pialang</p>
            <p>
              Alasan: <span className="font-medium">{lc.pialangReview.reason}</span>
            </p>
            {lc.pialangReview.note && <p>Keterangan: {lc.pialangReview.note}</p>}
            {lc.pialangReview.document && (
              <p className="inline-flex items-center gap-1">
                <FileText className="size-3.5" /> Bukti penolakan: {lc.pialangReview.document}
              </p>
            )}
            <p className="text-muted">
              Diajukan oleh {lc.pialangReview.by} ({lc.pialangReview.institution}) pada {fmt(lc.pialangReview.at)}.
            </p>
            {lc.bappebtiReview ? (
              <p className={cn("rounded px-2 py-1", lc.bappebtiReview.decision === "Setujui Penolakan" ? "bg-red-bg text-red" : "bg-green-bg text-green")}>
                Keputusan Bappebti: <span className="font-semibold">{lc.bappebtiReview.decision}</span> — {lc.bappebtiReview.note} ({lc.bappebtiReview.by},{" "}
                {fmt(lc.bappebtiReview.at)})
              </p>
            ) : isBappebti ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => setDialog("return")}>
                  Kembalikan ke Pialang
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDialog("approve-reject")}>
                  Setujui Penolakan
                </Button>
              </div>
            ) : (
              <p className="text-muted">Menunggu review Bappebti.</p>
            )}
          </div>
        )}

        {/* Ringkasan arbitrase / pengadilan */}
        {v.arbitrationWindow && !lc.arbitration && (
          <p className="rounded-md bg-amber-bg/50 px-2 py-1.5">
            Musyawarah berakhir Tidak Sepakat ({fmt(lc.musyawarahFailedAt)}). Jendela arbitrase nasabah:{" "}
            {formatWIB(v.arbitrationWindow.start).slice(0, 10)} s/d {formatWIB(new Date(v.arbitrationWindow.end.getTime() - 1)).slice(0, 10)} (
            {params.arbitrationWindowBusinessDays} hari kerja).
          </p>
        )}
        {lc.arbitration && (
          <p className="rounded-md bg-navy/5 px-2 py-1.5">
            <Gavel className="inline size-3.5 mr-1" />
            Arbitrase BAKTI diajukan {fmt(lc.arbitration.submittedAt)} · Verifikasi: {lc.arbitration.verification?.decision ?? "menunggu"} · Sidang:{" "}
            {lc.arbitration.hearings.length} · Putusan: {lc.arbitration.verdict?.decision ?? "belum ada"}
          </p>
        )}
        {status === "Selesai Non-Arbitrase" && (
          <CourtLetterButton complaintCase={c} failedAt={lc.musyawarahFailedAt ?? lc.submittedAt} />
        )}
      </CardContent>

      {dialog === "reject" && <RejectDialog complaintCase={c} actor={actor} mode="pialang" onClose={() => setDialog(null)} />}
      {dialog === "bappebti-reject" && <RejectDialog complaintCase={c} actor={actor} mode="bappebti" onClose={() => setDialog(null)} />}
      {dialog === "revision" && (
        <NoteDialog
          title="Minta Perbaikan Berkas"
          description="Status tiket menjadi Perlu Perbaikan Berkas. Nasabah diminta melengkapi/memperbaiki berkas; SLA review Pialang dihitung ulang setelah perbaikan diterima."
          confirmLabel="Kirim Permintaan"
          onClose={() => setDialog(null)}
          onConfirm={(note) => {
            requestRevision(c.ticket, actor, note);
            showToast("Permintaan perbaikan berkas dikirim ke nasabah.");
            setDialog(null);
          }}
        />
      )}
      {dialog === "mediation" && <MediationOutcomeDialog ticket={c.ticket} actor={actor} onClose={() => setDialog(null)} />}
      {dialog === "edit-date" && (
        <EditIncidentDateDialog
          current={lc.incidentDate ?? ""}
          onClose={() => setDialog(null)}
          onSave={(d) => {
            editIncidentDate(c.ticket, actor, lc.incidentDate ?? "", d);
            showToast("Tanggal kejadian diperbarui dan tercatat di riwayat koreksi.");
            setDialog(null);
          }}
        />
      )}
      {(dialog === "return" || dialog === "approve-reject") && (
        <NoteDialog
          title={dialog === "return" ? "Kembalikan ke Pialang" : "Setujui Penolakan Pialang"}
          description={
            dialog === "return"
              ? "Keputusan Pialang ditolak. Tiket dikembalikan ke antrean Pialang dan wajib dilanjutkan ke tahap musyawarah."
              : "Status tiket menjadi Rejected (ditolak permanen). Sistem mengirim notifikasi resmi ke nasabah beserta rekomendasi pengajuan komplain baru."
          }
          confirmLabel={dialog === "return" ? "Kembalikan ke Pialang" : "Setujui Penolakan"}
          destructive={dialog === "approve-reject"}
          onClose={() => setDialog(null)}
          onConfirm={(note) => {
            if (dialog === "return") {
              bappebtiReturnToPialang(c.ticket, actor, note);
              showToast("Tiket dikembalikan ke Pialang dan wajib lanjut ke musyawarah.");
            } else {
              bappebtiApproveRejection(c.ticket, actor, note);
              showToast("Penolakan disetujui. Notifikasi resmi telah dikirim ke nasabah.");
            }
            setDialog(null);
          }}
        />
      )}
    </Card>
  );
}

function PialangVerification({ complaintCase: c, view, actor, onReject }: { complaintCase: ComplaintCase; view: LifecycleView; actor: Actor; onReject: () => void }) {
  const { showToast } = useToast();
  const answered = view.lc.legalProceeding;
  const [answer, setAnswer] = React.useState<"Ya" | "Tidak" | "">(answered?.answer ?? "");
  const [files, setFiles] = React.useState<string[]>(answered?.document ? [answered.document] : []);
  const legalComplete = answer === "Tidak" || (answer === "Ya" && files.length > 0);

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-card p-2.5 space-y-1.5">
        <p className="font-medium">Apakah sengketa telah diproses di pengadilan atau kepolisian?</p>
        <div className="flex gap-3">
          {(["Ya", "Tidak"] as const).map((o) => (
            <label key={o} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name={`legal-${c.ticket}`} checked={answer === o} onChange={() => setAnswer(o)} /> {o}
            </label>
          ))}
        </div>
        {answer === "Ya" && (
          <div>
            <p className="text-muted mb-1">Wajib unggah salinan Laporan Polisi (LP) atau tanda bukti registrasi perkara pengadilan.</p>
            <FileUploader files={files} onChange={setFiles} multiple={false} maxFiles={1} accept=".pdf,.jpg,.jpeg,.png" label="Unggah salinan LP / registrasi perkara" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="success"
          disabled={!legalComplete}
          onClick={() => {
            if (answer && answer !== answered?.answer) setLegalProceeding(c.ticket, actor, answer, answer === "Ya" ? files[0] : undefined);
            pialangApprove(c.ticket, actor);
            showToast("Komplain disetujui dan dilanjutkan ke tahap musyawarah.");
          }}
        >
          <Check className="size-3.5" /> Setujui / Lanjutkan
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject}>
          <X className="size-3.5" /> Tolak Komplain
        </Button>
      </div>
      {!legalComplete && <p className="text-muted">Jawab pertanyaan verifikasi hukum sebelum menyetujui komplain.</p>}
    </div>
  );
}

function RejectDialog({
  complaintCase: c,
  actor,
  mode,
  onClose,
}: {
  complaintCase: ComplaintCase;
  actor: Actor;
  /** pialang → Pengajuan Reject (ditinjau Bappebti); bappebti → langsung Rejected. */
  mode: "pialang" | "bappebti";
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [reason, setReason] = React.useState<PialangRejectReason | "">("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  const pdfOk = files.length === 1 && files[0].toLowerCase().endsWith(".pdf");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "pialang" ? "Tolak Komplain" : "Tolak Pengaduan"}</DialogTitle>
          <DialogDescription>
            Pilih alasan penolakan sesuai verifikasi syarat materiil dan lampirkan bukti dalam format PDF.{" "}
            {mode === "pialang" ? "Status tiket menjadi Pengajuan Reject dan ditinjau Bappebti." : "Status tiket menjadi Rejected dan nasabah menerima pemberitahuan resmi."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <Label>Alasan penolakan (wajib)</Label>
            {REJECT_REASONS.map((r) => (
              <label key={r} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer", reason === r ? "border-navy bg-navy/5" : "border-border")}>
                <input type="radio" name="reject-reason" checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
          </div>
          <div>
            <Label>Berkas bukti penolakan (PDF, wajib)</Label>
            <FileUploader files={files} onChange={setFiles} multiple={false} maxFiles={1} accept=".pdf" label="Unggah dokumen bukti penolakan (PDF)" />
            {files.length > 0 && !pdfOk && <p className="text-[11px] text-red mt-1">Berkas harus berformat PDF.</p>}
          </div>
          <div>
            <Label>Keterangan (opsional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason || !pdfOk}
            onClick={() => {
              if (mode === "pialang") {
                pialangReject(c.ticket, actor, reason as PialangRejectReason, files[0], note.trim());
                showToast("Komplain ditolak. Status tiket: Pengajuan Reject (menunggu review Bappebti).");
              } else {
                bappebtiReject(c.ticket, actor, reason as PialangRejectReason, files[0], note.trim());
                showToast("Pengaduan ditolak. Pemberitahuan resmi telah dikirim ke nasabah.");
              }
              onClose();
            }}
          >
            {mode === "pialang" ? "Tolak Komplain" : "Tolak Pengaduan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediationOutcomeDialog({ ticket, actor, onClose }: { ticket: string; actor: Actor; onClose: () => void }) {
  const { showToast } = useToast();
  const [outcome, setOutcome] = React.useState<"Sepakat" | "Tidak Sepakat" | "">("");
  const [note, setNote] = React.useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Hasil Mediasi Bursa</DialogTitle>
          <DialogDescription>Sepakat → Pialang menyampaikan tawaran resolusi. Tidak Sepakat → nasabah dapat mengajukan arbitrase BAKTI mulai H+1.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {(["Sepakat", "Tidak Sepakat"] as const).map((o) => (
            <label key={o} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer", outcome === o ? "border-navy bg-navy/5" : "border-border")}>
              <input type="radio" name="mediation-outcome" checked={outcome === o} onChange={() => setOutcome(o)} /> {o}
            </label>
          ))}
          <Label>Ringkasan hasil mediasi (wajib)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px] text-sm" />
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={!outcome || !note.trim()}
            onClick={() => {
              recordMediationOutcome(ticket, actor, outcome as "Sepakat" | "Tidak Sepakat", note.trim());
              showToast(`Hasil mediasi (${outcome}) tersimpan.`);
              onClose();
            }}
          >
            Simpan Hasil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditIncidentDateDialog({ current, onSave, onClose }: { current: string; onSave: (d: string) => void; onClose: () => void }) {
  const [date, setDate] = React.useState(current);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Koreksi Tanggal Kejadian Perkara</DialogTitle>
          <DialogDescription>Setiap perubahan dicatat: nama pengubah, tanggal sebelum, dan tanggal sesudah diedit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label>Tanggal kejadian</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <p className="text-[11px] text-muted">Sebelumnya: {current || "-"}</p>
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" disabled={!date || date === current} onClick={() => onSave(date)}>
            Simpan Koreksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoteDialog({
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = React.useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Label>Catatan / alasan keputusan (wajib)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px] text-sm" />
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" variant={destructive ? "destructive" : "default"} disabled={!note.trim()} onClick={() => onConfirm(note.trim())}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CourtLetterButton({ complaintCase: c, failedAt }: { complaintCase: ComplaintCase; failedAt: string }) {
  const params = useBusinessParams();
  return (
    <div className="rounded-md border border-border p-2.5 space-y-1.5">
      <p>
        Status <span className="font-semibold">Selesai Non-Arbitrase</span>: jendela arbitrase {params.arbitrationWindowBusinessDays} hari kerja berakhir tanpa
        pendaftaran. Bappebti menerbitkan surat pengantar untuk pendaftaran gugatan ke Pengadilan Negeri.
      </p>
      <Button size="sm" variant="secondary" onClick={() => downloadCourtCoverLetter(c, failedAt, params.arbitrationWindowBusinessDays)}>
        <Download className="size-3.5" /> Unduh Surat Pengantar Pengadilan Negeri
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// #5 Resolusi damai (internal & publik)
// ---------------------------------------------------------------------------

export function ResolutionOffersSection({
  complaintCase: c,
  mode,
  canPropose,
}: {
  complaintCase: ComplaintCase;
  mode: "internal" | "public";
  /** Hanya Pialang (Platform) yang dapat mengajukan resolusi. */
  canPropose: boolean;
}) {
  const v = useLifecycleView(c);
  const params = useBusinessParams();
  const actor = useLifecycleActor(c);
  const { showToast } = useToast();
  const [text, setText] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectNote, setRejectNote] = React.useState("");

  if (!v) return <div className="h-24 rounded-lg border border-border bg-card animate-pulse" />;
  const offers = v.lc.resolutionOffers;
  const canSubmitNew =
    canPropose &&
    (v.status === "Proses Musyawarah" ||
      v.status === "Masa Pengajuan Arbitrase" ||
      (v.status === "Proses Mediasi Bursa" && v.lc.mediation?.outcome === "Sepakat"));

  return (
    <div className="space-y-4">
      {mode === "public" && v.pendingOffer && v.status === "Diajukan Penyelesaian" && (
        <Card className="border-green/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="size-4" /> Tawaran Resolusi dari {v.pendingOffer.institution}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 space-y-2 text-sm">
            <p>{v.pendingOffer.text}</p>
            {v.pendingOffer.amount !== undefined && <p className="text-xs">Nilai penyelesaian: <span className="font-semibold">{formatCurrencyIDR(v.pendingOffer.amount)}</span></p>}
            <p className="text-xs rounded-md bg-amber-bg/60 px-2 py-1.5">
              Mohon tanggapi paling lambat <span className="font-semibold">{v.resolutionDeadline ? fmt(v.resolutionDeadline.toISOString()) : "-"}</span> (
              {params.resolutionResponseDays} hari). Tanpa tanggapan, tiket otomatis ditutup dengan status <span className="font-semibold">Close Auto</span>.
            </p>
            {!rejecting ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    respondResolutionOffer(c.ticket, actor, "Setuju");
                    showToast("Terima kasih. Resolusi disetujui — status tiket: Close Resolusi.");
                  }}
                >
                  <Check className="size-3.5" /> Setuju Resolusi
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRejecting(true)}>
                  Tolak Tawaran
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea placeholder="Alasan Anda menolak tawaran..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} className="text-sm min-h-[60px]" />
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setRejecting(false)}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!rejectNote.trim()}
                    onClick={() => {
                      respondResolutionOffer(c.ticket, actor, "Tolak", rejectNote.trim());
                      showToast("Tawaran resolusi ditolak. Penanganan kembali ke tahap musyawarah.");
                      setRejecting(false);
                    }}
                  >
                    Kirim Penolakan
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canSubmitNew && (
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Resolusi</CardTitle>
            <p className="text-[11px] text-muted mt-1">Tawaran penyelesaian/damai kepada nasabah. Status tiket menjadi Diajukan Penyelesaian.</p>
          </CardHeader>
          <CardContent className="py-3 space-y-2">
            <Textarea placeholder="Draf tawaran penyelesaian untuk nasabah..." value={text} onChange={(e) => setText(e.target.value)} className="text-sm min-h-[80px]" />
            <div className="max-w-xs">
              <Label>Nilai penyelesaian (Rp, opsional)</Label>
              <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
            </div>
            <Button
              size="sm"
              variant="success"
              disabled={!text.trim()}
              onClick={() => {
                proposeResolutionOffer(c.ticket, actor, text.trim(), amount ? Number(amount) : undefined);
                showToast("Tawaran resolusi diajukan. Status tiket: Diajukan Penyelesaian.");
                setText("");
                setAmount("");
              }}
            >
              Ajukan Resolusi
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Tawaran Resolusi</CardTitle>
          {mode === "internal" && !canPropose && (
            <p className="text-[11px] text-muted mt-1">Resolusi damai merupakan kesepakatan langsung Pialang dan Nasabah — tampilan baca-saja.</p>
          )}
        </CardHeader>
        <CardContent className="py-3 space-y-2 text-xs">
          {offers.length === 0 && <p className="text-muted">Belum ada tawaran resolusi.</p>}
          {offers.map((o, i) => {
            const isPending = !o.response && o === v.pendingOffer;
            const label = o.response === "Setuju" ? "Disetujui Nasabah" : o.response === "Tolak" ? "Ditolak Nasabah" : isPending && v.status === "Close Auto" ? "Close Auto (tanpa respons)" : "Menunggu Respons Nasabah";
            const tone = o.response === "Setuju" ? "green" : o.response === "Tolak" ? "red" : isPending && v.status === "Close Auto" ? "muted" : "amber";
            return (
              <div key={o.id} className="rounded-md border border-border p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <p className="font-semibold">Tawaran #{i + 1} — {o.institution}</p>
                  <Badge variant={tone}>{label.toUpperCase()}</Badge>
                </div>
                <p className="text-foreground/90">{o.text}</p>
                {o.amount !== undefined && <p className="mt-0.5">Nilai: {formatCurrencyIDR(o.amount)}</p>}
                <p className="text-muted mt-0.5">
                  Diajukan {o.by}, {fmt(o.at)}
                  {o.respondedAt && ` · Ditanggapi ${fmt(o.respondedAt)}`}
                  {o.responseNote && ` · Alasan: ${o.responseNote}`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// #6 Arbitrase mandiri oleh nasabah (portal publik)
// ---------------------------------------------------------------------------

export function ArbitrationPublicCard({ complaintCase: c }: { complaintCase: ComplaintCase }) {
  const v = useLifecycleView(c);
  const params = useBusinessParams();
  const actor = useLifecycleActor(c);
  const { showToast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [institution, setInstitution] = React.useState<"BAKTI" | "">("");
  const [files, setFiles] = React.useState<string[]>([]);

  if (!v || !v.lc.musyawarahFailedAt) return null;
  const w = v.arbitrationWindow!;
  const a = v.lc.arbitration;

  return (
    <Card className="mb-4 border-amber/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="size-4" /> Penyelesaian melalui Arbitrase
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-2 text-xs">
        {a ? (
          <>
            <p>
              Permohonan arbitrase ke <span className="font-semibold">BAKTI</span> diajukan {fmt(a.submittedAt)} ({a.formFile}).
            </p>
            <p>
              Verifikasi BAKTI: <span className="font-medium">{a.verification?.decision ?? "Menunggu verifikasi"}</span>
              {a.hearings.length > 0 && ` · ${a.hearings.length} sidang tercatat`}
              {a.verdict && (
                <>
                  {" "}
                  · Putusan: <span className="font-semibold">{a.verdict.decision}</span>
                </>
              )}
            </p>
            {v.status === "Selesai Non-Arbitrase" && <CourtLetterButton complaintCase={c} failedAt={v.lc.musyawarahFailedAt} />}
          </>
        ) : v.status === "Selesai Non-Arbitrase" ? (
          <CourtLetterButton complaintCase={c} failedAt={v.lc.musyawarahFailedAt} />
        ) : (
          <>
            <p>
              Musyawarah/mediasi berakhir <span className="font-semibold">Tidak Sepakat</span> ({fmt(v.lc.musyawarahFailedAt)}). Anda dapat mengajukan penyelesaian melalui
              arbitrase mulai H+1 selama {params.arbitrationWindowBusinessDays} hari kerja: {formatWIB(w.start).slice(0, 10)} s/d{" "}
              {formatWIB(new Date(w.end.getTime() - 1)).slice(0, 10)}.
            </p>
            {w.active ? (
              <p className="text-amber font-medium">Sisa {w.remainingBusinessDays} hari kerja. Tanpa pendaftaran, status menjadi Selesai Non-Arbitrase.</p>
            ) : (
              <p className="text-muted">Tombol arbitrase aktif mulai {formatWIB(w.start).slice(0, 10)}.</p>
            )}
            <Button size="sm" disabled={!w.active} onClick={() => setOpen(true)}>
              <Scale className="size-3.5" /> Ajukan Penyelesaian Masalah melalui Arbitrase
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan Penyelesaian melalui Arbitrase</DialogTitle>
            <DialogDescription>Pilih lembaga arbitrase, unduh formulir registrasi, lalu unggah formulir yang telah diisi dan ditandatangani.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <Label>1. Pilih lembaga</Label>
              <label className={cn("mt-1 flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer", institution === "BAKTI" ? "border-navy bg-navy/5" : "border-border")}>
                <input type="radio" name="arb-inst" checked={institution === "BAKTI"} onChange={() => setInstitution("BAKTI")} />
                BAKTI — Badan Arbitrase Perdagangan Berjangka Komoditi
              </label>
            </div>
            {institution === "BAKTI" && (
              <>
                <div>
                  <Label>2. Unduh formulir</Label>
                  <div className="mt-1">
                    <Button size="sm" variant="secondary" onClick={() => downloadBaktiRegistrationForm(c)}>
                      <Download className="size-3.5" /> Unduh Form Registrasi BAKTI
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>3. Upload form yang telah diisi & ditandatangani (PDF)</Label>
                  <FileUploader files={files} onChange={setFiles} multiple={false} maxFiles={1} accept=".pdf" label="📤 Upload Form yang Telah Diisi & Ditandatangani" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={institution !== "BAKTI" || files.length === 0}
              onClick={() => {
                submitArbitration(c.ticket, actor, files[0]);
                showToast("Permohonan arbitrase telah dikirim ke BAKTI.");
                setOpen(false);
              }}
            >
              <Upload className="size-3.5" /> Kirim Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


// ---------------------------------------------------------------------------
// Penanda kemajuan siklus tiket (portal publik)
// ---------------------------------------------------------------------------

const TRACK = ["Tiket Terbit", "Verifikasi Pialang", "Musyawarah / Mediasi", "Resolusi / Arbitrase", "Selesai"] as const;

function trackIndex(v: LifecycleView): number {
  switch (v.status) {
    case "Triase Bappebti":
    case "Perlu Perbaikan Berkas":
    case "Menunggu Verifikasi Pialang":
    case "Pengajuan Reject":
      return 1;
    case "Proses Musyawarah":
    case "Proses Mediasi Bursa":
      return 2;
    case "Diajukan Penyelesaian":
    case "Masa Pengajuan Arbitrase":
    case "Proses Arbitrase BAKTI":
      return 3;
    default:
      return 4;
  }
}

export function LifecycleTracker({ complaintCase }: { complaintCase: ComplaintCase }) {
  const v = useLifecycleView(complaintCase);
  const idx = v ? trackIndex(v) : -1;
  return (
    <div>
      <ol className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0">
        {TRACK.map((label, i) => {
          const state = !v ? "upcoming" : i < idx || (v.isClosed && i === idx) ? "done" : i === idx ? "current" : "upcoming";
          return (
            <li key={label} className="flex sm:flex-1 sm:flex-col items-center gap-2 sm:gap-1">
              <div className="flex items-center sm:w-full">
                {i > 0 && <span className={cn("hidden sm:block h-0.5 flex-1", state === "upcoming" ? "bg-border" : "bg-navy")} />}
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    state === "done" && "bg-navy text-white",
                    state === "current" && "bg-amber text-white",
                    state === "upcoming" && "bg-muted-bg text-muted border border-border"
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" /> : i + 1}
                </span>
                {i < TRACK.length - 1 && <span className={cn("hidden sm:block h-0.5 flex-1", state === "done" ? "bg-navy" : "bg-border")} />}
              </div>
              <span className={cn("text-[11px] sm:text-center font-medium", state === "upcoming" ? "text-muted" : "text-foreground")}>{label}</span>
            </li>
          );
        })}
      </ol>
      {v && (
        <p className="mt-2 text-[11px] text-muted text-center">
          Status tiket: <span className="font-semibold text-foreground">{v.status}</span>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revisi 13 #8: Perbaikan berkas oleh nasabah (portal publik)
// ---------------------------------------------------------------------------

export function RevisionPublicCard({ complaintCase: c }: { complaintCase: ComplaintCase }) {
  const v = useLifecycleView(c);
  const actor = useLifecycleActor(c);
  const { showToast } = useToast();
  const [response, setResponse] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  if (!v || v.status !== "Perlu Perbaikan Berkas" || !v.lc.revisionRequest) return null;
  return (
    <Card className="mb-4 border-amber/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="size-4" /> Perbaikan Berkas Diperlukan
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-2 text-xs">
        <p>
          <span className="font-semibold">{v.lc.revisionRequest.institution}</span> meminta perbaikan: {v.lc.revisionRequest.note}
        </p>
        <Textarea placeholder="Keterangan perbaikan / data yang dilengkapi..." value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-[60px] text-sm" />
        <FileUploader files={files} onChange={setFiles} label="Unggah berkas perbaikan (opsional)" />
        <Button
          size="sm"
          disabled={!response.trim()}
          onClick={() => {
            submitRevision(c.ticket, actor, response.trim(), files);
            showToast("Perbaikan berkas terkirim. Pengaduan kembali ke tahap verifikasi.");
            setResponse("");
            setFiles([]);
          }}
        >
          Kirim Perbaikan Berkas
        </Button>
      </CardContent>
    </Card>
  );
}
