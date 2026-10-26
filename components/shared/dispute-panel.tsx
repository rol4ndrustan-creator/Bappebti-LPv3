"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { useToast } from "@/components/shared/toast-provider";
import { ComplaintCase, DisputeRecord, RequirementResult } from "@/lib/types";
import { formatCurrencyIDR, getSlaTone } from "@/lib/format";
import { formatMockDateTime } from "@/lib/clarification-workflow";
import {
  DISPUTE_ACTIONS,
  DISPUTE_RULES,
  DISPUTE_STAGES,
  DisputeActionId,
  DisputeActionInput,
  DisputeActor,
  agreementDocumentTypeFor,
  deadlineStatus,
  describeRemaining,
  getAvailableDisputeActions,
  getDisputeActionOwner,
  getDisputeDeadlines,
  getDisputeProgress,
  getPialangClarificationStatus,
  pialangClarificationDeadline,
} from "@/lib/dispute-workflow";
import { addEvidence, runDisputeAction } from "@/lib/mock-service/store";
import { Check, ChevronRight, Gavel, Handshake, Info, Scale, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTOR_ROLE_LABEL: Record<DisputeActor, string> = {
  Nasabah: "Pelapor",
  Bappebti: "Bappebti",
  Pialang: "Platform",
  Bursa: "Bursa",
};

/**
 * Tab "Penyelesaian Perselisihan" — menampilkan dan menjalankan Mekanisme
 * Penanganan Perselisihan Nasabah PBK untuk satu kasus, sesuai peran pengguna.
 */
export function DisputePanel({
  complaintCase,
  actor,
  actorName,
}: {
  complaintCase: ComplaintCase;
  /** Pihak yang sedang melihat (null = hanya baca, mis. auditor/pengawas). */
  actor: DisputeActor | null;
  actorName: string;
}) {
  const d = complaintCase.dispute;
  const [activeAction, setActiveAction] = React.useState<DisputeActionId | null>(null);

  if (!d) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted text-center">
          Pengaduan ini tidak diproses melalui Mekanisme Penanganan Perselisihan Nasabah PBK.
        </CardContent>
      </Card>
    );
  }

  const stage = DISPUTE_STAGES[d.stage];
  const owner = getDisputeActionOwner(d);
  const actions = getAvailableDisputeActions(d, actor);
  const deadlines = getDisputeDeadlines(d);
  const bursaName = complaintCase.institution?.bursa ?? complaintCase.bursaEntity;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Alur Penanganan Perselisihan Nasabah PBK</CardTitle>
          <p className="text-[11px] text-muted mt-1">
            Sesuai Rancangan Mekanisme Penanganan Perselisihan Nasabah PBK — Bappebti.
          </p>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <DisputeStepper dispute={d} />

          <div className={cn("rounded-md border p-3", owner && owner === actor ? "border-amber/40 bg-amber-bg/40" : "border-border")}>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={stage.badgeTone}>{stage.label.toUpperCase()}</Badge>
              {owner && (
                <span className="text-xs text-muted">
                  Wajib bertindak:{" "}
                  <span className="font-medium text-foreground">
                    {owner === "Pialang" ? `Pialang Berjangka — ${complaintCase.platform}` : owner === "Bursa" ? `Bursa Berjangka — ${bursaName}` : owner}
                  </span>
                </span>
              )}
            </div>
            <p className="text-sm">{stage.description}</p>
            {actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((id, i) => (
                  <Button key={id} size="sm" variant={i === 0 ? "default" : "secondary"} onClick={() => setActiveAction(id)}>
                    {DISPUTE_ACTIONS[id].label}
                  </Button>
                ))}
              </div>
            )}
            {actions.length === 0 && stage.isOpen && owner && owner !== actor && (
              <p className="mt-2 text-[11px] text-muted">
                Tidak ada tindakan untuk peran Anda pada tahap ini. Gunakan Mode Demonstrasi untuk beralih ke peran {owner}.
              </p>
            )}
          </div>

          {deadlines.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Tenggat Berjalan (hari kerja)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deadlines.map((dl) => {
                  const status = deadlineStatus(dl.deadline, dl.done);
                  return (
                    <div key={dl.type} className="rounded-md border border-border px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{dl.type}</p>
                        <Badge variant={getSlaTone(status)}>{status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-muted mt-0.5">{dl.ruleLabel}</p>
                      <p className="mt-1">
                        Batas: <span className="font-medium">{formatMockDateTime(dl.deadline)} WIB</span>
                        {!dl.done && <span className="text-muted"> · {describeRemaining(dl.deadline)}</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VerificationCard dispute={d} platform={complaintCase.platform} />
        <ForumCard dispute={d} platform={complaintCase.platform} bursa={bursaName} />
      </div>

      <RulesCard />

      {activeAction && (
        <DisputeActionDialog
          actionId={activeAction}
          dispute={d}
          ticket={complaintCase.ticket}
          actor={actor!}
          actorName={actorName}
          onClose={() => setActiveAction(null)}
        />
      )}
    </div>
  );
}

function DisputeStepper({ dispute }: { dispute: DisputeRecord }) {
  const steps = getDisputeProgress(dispute);
  return (
    <ol className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.label} className="flex sm:flex-1 sm:flex-col items-center gap-2 sm:gap-1">
          <div className="flex items-center sm:w-full">
            {i > 0 && <span className={cn("hidden sm:block h-0.5 flex-1", s.status === "upcoming" ? "bg-border" : "bg-navy")} />}
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                s.status === "done" && "bg-navy text-white",
                s.status === "current" && "bg-amber text-white",
                s.status === "upcoming" && "bg-muted-bg text-muted border border-border",
                s.status === "skipped" && "bg-muted-bg text-muted border border-dashed border-border"
              )}
            >
              {s.status === "done" ? <Check className="size-3.5" /> : s.status === "skipped" ? <ChevronRight className="size-3" /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className={cn("hidden sm:block h-0.5 flex-1", s.status === "done" || s.status === "skipped" ? "bg-navy" : "bg-border")} />}
          </div>
          <span className={cn("text-[11px] sm:text-center font-medium", s.status === "upcoming" || s.status === "skipped" ? "text-muted" : "text-foreground")}>
            {s.label}
            {s.status === "skipped" && <span className="block text-[10px] font-normal">(tidak dilalui)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ResultBadge({ value }: { value?: RequirementResult }) {
  if (!value) return <Badge variant="muted">BELUM DIVERIFIKASI</Badge>;
  return <Badge variant={value === "Terpenuhi" ? "green" : "red"}>{value.toUpperCase()}</Badge>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-right">{children}</dd>
    </div>
  );
}

function VerificationCard({ dispute: d, platform }: { dispute: DisputeRecord; platform: string }) {
  const pialangStatus = getPialangClarificationStatus(d);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ShieldCheck className="size-4" /> Verifikasi Paralel
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 text-xs space-y-3">
        <div>
          <p className="font-semibold text-navy mb-1">Bappebti — Verifikasi Materiil & Formil (maks. 2 hari kerja)</p>
          <dl>
            <Row label="Pengaduan online diterima">{d.submittedAt}</Row>
            <Row label="Syarat Materiil"><ResultBadge value={d.bappebtiVerification.materiil} /></Row>
            <Row label="Syarat Formil"><ResultBadge value={d.bappebtiVerification.formil} /></Row>
            {d.bappebtiVerification.verifiedAt && (
              <Row label="Diverifikasi">{`${d.bappebtiVerification.verifiedAt} · ${d.bappebtiVerification.verifiedBy ?? "-"}`}</Row>
            )}
            {d.formilReturnedAt && <Row label="Dikembalikan ke nasabah">{d.formilReturnedAt}</Row>}
            {d.formilCorrectedAt && <Row label="Perbaikan diterima">{d.formilCorrectedAt}</Row>}
          </dl>
          {d.bappebtiVerification.note && <p className="mt-1 text-muted">Catatan: {d.bappebtiVerification.note}</p>}
        </div>
        <div>
          <p className="font-semibold text-navy mb-1">Pialang Berjangka — Klarifikasi (maks. 1 hari kerja)</p>
          <dl>
            <Row label="Pialang">{platform}</Row>
            <Row label="Batas klarifikasi">{formatMockDateTime(pialangClarificationDeadline(d))}</Row>
            <Row label="Status">
              <Badge variant={pialangStatus === "Sudah Diklarifikasi" ? "green" : pialangStatus === "Menunggu Klarifikasi" ? "amber" : "red"}>
                {pialangStatus.toUpperCase()}
              </Badge>
            </Row>
          </dl>
          {d.pialangClarification.note && <p className="mt-1 text-muted">Klarifikasi: {d.pialangClarification.note}</p>}
          {pialangStatus === "Dianggap Menyetujui Pengaduan" && (
            <p className="mt-1 rounded-md bg-red-bg text-red px-2 py-1.5">
              Pialang tidak melakukan verifikasi dalam 1 hari kerja sehingga dianggap menyetujui pengaduan yang disampaikan nasabah.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ForumCard({ dispute: d, platform, bursa }: { dispute: DisputeRecord; platform: string; bursa: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Handshake className="size-4" /> Musyawarah, Mediasi & Kesepakatan
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 text-xs space-y-3">
        <div>
          <p className="font-semibold text-navy mb-1">Musyawarah Pialang — {platform}</p>
          {d.musyawarah ? (
            <dl>
              <Row label="Disposisi / mulai">{d.musyawarah.startedAt}</Row>
              <Row label="Perpanjangan">{d.musyawarah.extendedDays ? `${d.musyawarah.extendedDays} hari` : "Tidak ada"}</Row>
              <Row label="Hasil">{d.musyawarah.outcome ?? "Berlangsung"}</Row>
            </dl>
          ) : (
            <p className="text-muted">Belum dimulai.</p>
          )}
        </div>
        <div>
          <p className="font-semibold text-navy mb-1">Mediasi Bursa — {bursa}</p>
          {d.mediasi ? (
            <dl>
              <Row label="Mulai">{d.mediasi.startedAt}</Row>
              <Row label="Perpanjangan">{d.mediasi.extendedDays ? `${d.mediasi.extendedDays} hari` : "Tidak ada"}</Row>
              <Row label="Hasil">{d.mediasi.outcome ?? "Berlangsung"}</Row>
              <Row label="Lapor ke Bappebti">{d.mediasi.reportedAt ?? (d.mediasi.endedAt ? "Belum dilaporkan" : "-")}</Row>
            </dl>
          ) : (
            <p className="text-muted">{d.musyawarah?.outcome === "Tercapai" ? "Tidak diperlukan — musyawarah tercapai." : "Belum dimulai."}</p>
          )}
        </div>
        {d.agreement && (
          <div className="rounded-md border border-green/30 bg-green-bg/40 p-2">
            <p className="font-semibold text-green mb-1">Nilai Kesepakatan ({d.agreement.forum})</p>
            <dl>
              <Row label="Nilai">{formatCurrencyIDR(d.agreement.value)}</Row>
              <Row label="Dokumen wajib">{d.agreement.documentType}</Row>
              <Row label="Disampaikan oleh">{d.agreement.submitter}</Row>
              <Row label="Dokumen">{d.agreement.documentName ?? "Belum disampaikan"}</Row>
            </dl>
          </div>
        )}
        {d.forumChoice && (
          <div className="rounded-md border border-border p-2">
            <p className="font-semibold text-navy mb-1 flex items-center gap-1">
              <Gavel className="size-3.5" /> Pengadilan / BAKTI
            </p>
            <dl>
              <Row label="Penjelasan pilihan oleh Bursa">{d.forumChoice.explainedAt}</Row>
              <Row label="Pilihan nasabah">{d.forumChoice.choice ? `${d.forumChoice.choice} (${d.forumChoice.chosenAt})` : "Belum memilih"}</Row>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RulesCard() {
  const rules = [
    "Verifikasi materiil & formil oleh Bappebti maks. 2 hari kerja; klarifikasi Pialang maks. 1 hari kerja (paralel).",
    "Pialang yang tidak melakukan verifikasi dalam 1 hari kerja dianggap menyetujui pengaduan nasabah.",
    "Syarat materiil tidak terpenuhi → ditolak & ditutup. Syarat formil tidak terpenuhi → dikembalikan, perbaikan maks. 2 hari kerja.",
    "Musyawarah Pialang dan Mediasi Bursa masing-masing 21 hari kerja, dapat diperpanjang maks. 14 hari.",
    "Hasil mediasi dilaporkan Bursa ke Bappebti maks. 1 hari kerja.",
    `Nilai kesepakatan < ${formatCurrencyIDR(DISPUTE_RULES.agreementValueThreshold)} → dokumen kesepakatan; ≥ ${formatCurrencyIDR(DISPUTE_RULES.agreementValueThreshold)} → akta perdamaian.`,
    "Mediasi tidak sepakat → Bursa menjelaskan pilihan sarana penyelesaian; nasabah dapat memilih BAKTI paling lambat 20 hari kerja, atau Pengadilan.",
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Scale className="size-4" /> Ketentuan Mekanisme
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3">
        <ul className="list-disc pl-5 space-y-1 text-xs text-foreground/90">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted flex items-start gap-1">
          <Info className="size-3 mt-0.5 shrink-0" /> Hari kerja: Senin–Jumat di luar hari libur nasional dan cuti bersama yang ditetapkan pemerintah.
        </p>
      </CardContent>
    </Card>
  );
}

function DisputeActionDialog({
  actionId,
  dispute,
  ticket,
  actor,
  actorName,
  onClose,
}: {
  actionId: DisputeActionId;
  dispute: DisputeRecord;
  ticket: string;
  actor: DisputeActor;
  actorName: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const meta = DISPUTE_ACTIONS[actionId];
  const [note, setNote] = React.useState("");
  const [materiil, setMateriil] = React.useState<RequirementResult>("Terpenuhi");
  const [formil, setFormil] = React.useState<RequirementResult>("Terpenuhi");
  const [days, setDays] = React.useState("14");
  const [outcomeOk, setOutcomeOk] = React.useState(true);
  const [value, setValue] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [choice, setChoice] = React.useState<"BAKTI" | "Pengadilan">("BAKTI");

  const numericValue = Number(value.replace(/\D/g, ""));
  const needsValue = (actionId === "musyawarah-result" || actionId === "mediasi-result") && outcomeOk;
  const daysNum = Number(days);

  const noteRequired = actionId !== "nasabah-choose-forum";
  const invalid =
    (noteRequired && !note.trim()) ||
    (needsValue && !(numericValue > 0)) ||
    ((actionId === "musyawarah-extend" || actionId === "mediasi-extend") &&
      !(daysNum >= 1 && daysNum <= DISPUTE_RULES.maxExtensionCalendarDays)) ||
    (actionId === "submit-agreement" && files.length === 0) ||
    (actionId === "nasabah-correct-formil" && files.length === 0);

  function submit() {
    const base = { note, actor: actorName };
    let input: DisputeActionInput;
    switch (actionId) {
      case "bappebti-verify":
        input = { id: actionId, materiil, formil, ...base };
        break;
      case "musyawarah-extend":
      case "mediasi-extend":
        input = { id: actionId, days: daysNum, ...base };
        break;
      case "musyawarah-result":
        input = { id: actionId, outcome: outcomeOk ? "Tercapai" : "Tidak Tercapai", value: outcomeOk ? numericValue : undefined, ...base };
        break;
      case "mediasi-result":
        input = { id: actionId, outcome: outcomeOk ? "Sepakat" : "Tidak Sepakat", value: outcomeOk ? numericValue : undefined, ...base };
        break;
      case "submit-agreement":
        input = { id: actionId, documentName: files[0], ...base };
        break;
      case "nasabah-choose-forum":
        input = { id: actionId, choice, ...base };
        break;
      default:
        input = { id: actionId, ...base };
    }
    if ((actionId === "submit-agreement" || actionId === "nasabah-correct-formil") && files.length > 0) addEvidence(ticket, files);
    runDisputeAction(ticket, input, ACTOR_ROLE_LABEL[actor]);
    showToast(`${meta.label} berhasil dicatat.`);
    onClose();
  }

  const okLabel = actionId === "musyawarah-result" ? "Tercapai" : "Sepakat";
  const notOkLabel = actionId === "musyawarah-result" ? "Tidak Tercapai" : "Tidak Sepakat";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta.label}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {actionId === "bappebti-verify" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Syarat Materiil</Label>
                <Select value={materiil} onChange={(e) => setMateriil(e.target.value as RequirementResult)}>
                  <option value="Terpenuhi">Terpenuhi</option>
                  <option value="Tidak Terpenuhi">Tidak Terpenuhi</option>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Syarat Formil</Label>
                <Select value={formil} onChange={(e) => setFormil(e.target.value as RequirementResult)} disabled={materiil === "Tidak Terpenuhi"}>
                  <option value="Terpenuhi">Terpenuhi</option>
                  <option value="Tidak Terpenuhi">Tidak Terpenuhi</option>
                </Select>
              </div>
              <p className="col-span-2 text-[11px] rounded-md bg-muted-bg px-2 py-1.5">
                Hasil:{" "}
                <span className="font-semibold">
                  {materiil === "Tidak Terpenuhi"
                    ? "Ditolak & ditutup"
                    : formil === "Tidak Terpenuhi"
                      ? "Dikembalikan ke nasabah (perbaikan maks. 2 hari kerja)"
                      : "Disposisi ke Pialang — Musyawarah 21 hari kerja"}
                </span>
              </p>
            </div>
          )}

          {(actionId === "musyawarah-extend" || actionId === "mediasi-extend") && (
            <div>
              <Label className="text-[11px]">Lama perpanjangan (hari, maks. {DISPUTE_RULES.maxExtensionCalendarDays})</Label>
              <Input type="number" min={1} max={DISPUTE_RULES.maxExtensionCalendarDays} value={days} onChange={(e) => setDays(e.target.value)} />
              <p className="text-[11px] text-muted mt-1">Perpanjangan hanya dapat dilakukan satu kali.</p>
            </div>
          )}

          {(actionId === "musyawarah-result" || actionId === "mediasi-result") && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={outcomeOk ? "success" : "outline"} onClick={() => setOutcomeOk(true)}>
                  <Check className="size-3.5" /> {okLabel}
                </Button>
                <Button type="button" size="sm" variant={!outcomeOk ? "destructive" : "outline"} onClick={() => setOutcomeOk(false)}>
                  <X className="size-3.5" /> {notOkLabel}
                </Button>
              </div>
              {outcomeOk ? (
                <div>
                  <Label className="text-[11px]">Nilai kesepakatan (Rp)</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="contoh: 75000000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  {numericValue > 0 && (
                    <p className="text-[11px] mt-1 rounded-md bg-green-bg text-green px-2 py-1.5">
                      {formatCurrencyIDR(numericValue)} → wajib disampaikan sebagai{" "}
                      <span className="font-semibold">{agreementDocumentTypeFor(numericValue)}</span> ke Bappebti.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] rounded-md bg-amber-bg text-amber px-2 py-1.5">
                  {actionId === "musyawarah-result"
                    ? "Perselisihan akan diteruskan ke Mediasi Bursa (21 hari kerja)."
                    : "Bursa wajib melaporkan hasil ke Bappebti dalam 1 hari kerja dan menjelaskan pilihan Pengadilan/BAKTI kepada nasabah."}
                </p>
              )}
            </div>
          )}

          {actionId === "mediasi-report" && (
            <p className="text-[11px] rounded-md bg-muted-bg px-2 py-1.5">
              Hasil mediasi: <span className="font-semibold">{dispute.mediasi?.outcome ?? "-"}</span>
              {dispute.mediasi?.outcome === "Sepakat" && dispute.agreement
                ? ` — ${formatCurrencyIDR(dispute.agreement.value)}, dokumen wajib: ${dispute.agreement.documentType}.`
                : " — sertakan penjelasan pilihan sarana penyelesaian (Pengadilan/BAKTI) untuk nasabah."}
            </p>
          )}

          {actionId === "submit-agreement" && dispute.agreement && (
            <div className="space-y-2">
              <p className="text-[11px] rounded-md bg-green-bg text-green px-2 py-1.5">
                Nilai {formatCurrencyIDR(dispute.agreement.value)} → dokumen wajib:{" "}
                <span className="font-semibold">{dispute.agreement.documentType}</span>
              </p>
              <FileUploader
                files={files}
                onChange={setFiles}
                multiple={false}
                maxFiles={1}
                label={`Unggah ${dispute.agreement.documentType.toLowerCase()}`}
              />
            </div>
          )}

          {actionId === "nasabah-correct-formil" && (
            <FileUploader files={files} onChange={setFiles} label="Unggah berkas perbaikan" />
          )}

          {actionId === "nasabah-choose-forum" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["BAKTI", "Pengadilan"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setChoice(opt)}
                  className={cn(
                    "rounded-md border p-3 text-left text-xs",
                    choice === opt ? "border-navy bg-navy/5" : "border-border hover:bg-muted-bg"
                  )}
                >
                  <p className="font-semibold">{opt === "BAKTI" ? "BAKTI" : "Pengadilan"}</p>
                  <p className="text-muted mt-0.5">
                    {opt === "BAKTI"
                      ? "Badan Arbitrase Perdagangan Berjangka Komoditi — dipilih paling lambat 20 hari kerja."
                      : "Penyelesaian melalui pengadilan negeri."}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div>
            <Label className="text-[11px]">
              {actionId === "pialang-clarify" ? "Hasil klarifikasi (daluarsa, informasi kontrak, dll)" : "Catatan"}{" "}
              {noteRequired ? "(wajib)" : "(opsional)"}
            </Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px] text-sm" />
          </div>
          <p className="text-[11px] text-muted">Tindakan ini tercatat pada kronologi kasus dan dapat dilihat oleh nasabah.</p>
        </div>

        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" disabled={invalid} onClick={submit}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
