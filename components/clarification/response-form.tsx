"use client";

import * as React from "react";
import { ClarificationRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export interface ResponseDraftShape {
  summary: string;
  detailedExplanation: string;
  referencedTransaction: string;
  factsConfirmed: string;
  factsNotConfirmed: string;
  respondingOfficer: string;
  supervisorApproval: string;
}

function emptyDraft(defaultOfficer: string): ResponseDraftShape {
  return {
    summary: "",
    detailedExplanation: "",
    referencedTransaction: "",
    factsConfirmed: "",
    factsNotConfirmed: "",
    respondingOfficer: defaultOfficer,
    supervisorApproval: "",
  };
}

export function parseResponseDraft(raw: string | undefined, defaultOfficer: string): ResponseDraftShape {
  if (!raw) return emptyDraft(defaultOfficer);
  try {
    return { ...emptyDraft(defaultOfficer), ...(JSON.parse(raw) as Partial<ResponseDraftShape>) };
  } catch {
    return emptyDraft(defaultOfficer);
  }
}

/**
 * Section 7 — the structured formal-response editor used when the current
 * institution must answer. Never submits without an explicit confirmation.
 */
export function ClarificationResponseForm({
  clarification,
  defaultOfficer,
  onSaveDraft,
  onSubmit,
}: {
  clarification: ClarificationRequest;
  defaultOfficer: string;
  onSaveDraft: (raw: string) => void;
  onSubmit: (draft: ResponseDraftShape) => void;
}) {
  const [form, setForm] = React.useState<ResponseDraftShape>(() => parseResponseDraft(clarification.responseDraft, defaultOfficer));
  const [showPreview, setShowPreview] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [savedNote, setSavedNote] = React.useState(false);

  function update<K extends keyof ResponseDraftShape>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedNote(false);
  }

  const canSubmit = form.summary.trim() && form.detailedExplanation.trim() && form.respondingOfficer.trim();

  return (
    <div className="flex flex-col gap-3">
      {clarification.status === "REVISION_REQUESTED" && (
        <div className="rounded-md border border-red/30 bg-red-bg px-3 py-2 text-xs">
          <p className="font-semibold text-red">Respons perlu diperbaiki</p>
          {clarification.reviewerComments && <p className="text-foreground/80 mt-1">Alasan: {clarification.reviewerComments}</p>}
          {clarification.requiredCorrections && <p className="text-foreground/80 mt-0.5">Perbaikan diperlukan: {clarification.requiredCorrections}</p>}
        </div>
      )}

      <p className="text-[11px] text-muted rounded-md bg-muted-bg px-2 py-1.5">Draf disimpan secara lokal dan bersifat privat — tidak terlihat oleh pelapor atau pihak lain hingga dikirim.</p>

      <div>
        <Label htmlFor="resp-summary">Ringkasan Respons</Label>
        <Textarea id="resp-summary" value={form.summary} onChange={(e) => update("summary", e.target.value)} className="min-h-[60px]" placeholder="Ringkasan singkat jawaban Anda..." />
      </div>
      <div>
        <Label htmlFor="resp-detail">Penjelasan Rinci</Label>
        <Textarea id="resp-detail" value={form.detailedExplanation} onChange={(e) => update("detailedExplanation", e.target.value)} className="min-h-[100px]" placeholder="Jelaskan secara rinci..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="resp-ref">Nomor Akun Transaksi</Label>
          <Input id="resp-ref" value={form.referencedTransaction} onChange={(e) => update("referencedTransaction", e.target.value)} placeholder="Contoh: WD-88213471" />
        </div>
        <div>
          <Label htmlFor="resp-officer">Petugas yang Merespons</Label>
          <Input id="resp-officer" value={form.respondingOfficer} onChange={(e) => update("respondingOfficer", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="resp-confirmed">Fakta yang Dikonfirmasi</Label>
          <Textarea id="resp-confirmed" value={form.factsConfirmed} onChange={(e) => update("factsConfirmed", e.target.value)} className="min-h-[70px]" />
        </div>
        <div>
          <Label htmlFor="resp-unconfirmed">Fakta yang Belum Dikonfirmasi</Label>
          <Textarea id="resp-unconfirmed" value={form.factsNotConfirmed} onChange={(e) => update("factsNotConfirmed", e.target.value)} className="min-h-[70px]" />
        </div>
      </div>
      <div>
        <Label htmlFor="resp-supervisor">Persetujuan Supervisor (opsional)</Label>
        <Input id="resp-supervisor" value={form.supervisorApproval} onChange={(e) => update("supervisorApproval", e.target.value)} placeholder="Nama supervisor yang menyetujui, bila diperlukan" />
      </div>
      <div className="rounded-md border border-dashed border-border p-3 text-center">
        <p className="text-xs text-muted">Prototipe: lampiran dokumen respons disimulasikan, tidak ada berkas yang benar-benar diunggah.</p>
      </div>

      {showPreview && (
        <Card>
          <CardContent className="py-3 text-xs space-y-1.5">
            <p className="font-semibold text-navy text-sm">{form.summary || "(ringkasan belum diisi)"}</p>
            <p className="text-foreground/80">{form.detailedExplanation || "(penjelasan belum diisi)"}</p>
            {form.referencedTransaction && <p>Referensi: {form.referencedTransaction}</p>}
            {form.factsConfirmed && <p>Dikonfirmasi: {form.factsConfirmed}</p>}
            {form.factsNotConfirmed && <p>Belum dikonfirmasi: {form.factsNotConfirmed}</p>}
            <p className="text-muted">Oleh {form.respondingOfficer || "-"}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onSaveDraft(JSON.stringify(form));
            setSavedNote(true);
          }}
        >
          Simpan Draf
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? "Sembunyikan Pratinjau" : "Pratinjau Respons"}
        </Button>
        <Button size="sm" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
          Kirim Respons
        </Button>
        {savedNote && <span className="text-[11px] text-green">Draf tersimpan.</span>}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Respons Klarifikasi</DialogTitle>
            <DialogDescription>
              Respons akan dikirim sebagai jawaban resmi dan tidak dapat ditarik kembali. Pastikan seluruh
              informasi sudah benar sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onSubmit(form);
                setConfirmOpen(false);
              }}
            >
              Konfirmasi Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
