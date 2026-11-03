"use client";

import * as React from "react";
import { ComplaintCase, ClarificationPartyType, ClarificationPriority } from "@/lib/types";
import {
  ClarificationViewer,
  CLARIFICATION_PARTY_LABEL,
  CLARIFICATION_PRIORITY_LABEL,
  formatMockDateTime,
  MOCK_NOW,
  roleToClarificationPartyType,
} from "@/lib/clarification-workflow";
import { createClarification } from "@/lib/mock-service/clarification-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

const TARGET_OPTIONS_BY_VIEWER: Record<string, ClarificationPartyType[]> = {
  PLATFORM: ["REPORTER", "BAPPEBTI", "BURSA", "CLEARING"],
  BURSA: ["REPORTER", "BAPPEBTI", "PLATFORM", "CLEARING"],
  CLEARING: ["REPORTER", "BAPPEBTI", "PLATFORM", "BURSA"],
};

const PRIORITIES: ClarificationPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Section 8 — create a new outgoing clarification request from the member portal. */
export function ClarificationCreateDialog({
  open,
  onOpenChange,
  viewer,
  viewerName,
  viewerRoleLabel,
  cases,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  viewer: ClarificationViewer;
  viewerName: string;
  viewerRoleLabel: string;
  cases: ComplaintCase[];
  onCreated: (newId: string) => void;
}) {
  const viewerPartyType = roleToClarificationPartyType(viewer.role) ?? "PLATFORM";
  const targetOptions = TARGET_OPTIONS_BY_VIEWER[viewerPartyType] ?? [];

  const [ticket, setTicket] = React.useState("");
  const [target, setTarget] = React.useState<ClarificationPartyType | "">("");
  const [subject, setSubject] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [requiredFields, setRequiredFields] = React.useState("");
  const [requiredDocs, setRequiredDocs] = React.useState("");
  const [priority, setPriority] = React.useState<ClarificationPriority>("MEDIUM");
  const [dueAtLocal, setDueAtLocal] = React.useState("");
  const [internalNote, setInternalNote] = React.useState("");
  const [error, setError] = React.useState("");

  const selectedCase = cases.find((c) => c.ticket === ticket);
  const isIllegalEntityCase = !!selectedCase?.illegalEntitySuspected;
  const availableTargets = targetOptions.filter((t) => !(isIllegalEntityCase && t === "PLATFORM"));

  function reset() {
    setTicket("");
    setTarget("");
    setSubject("");
    setQuestion("");
    setReason("");
    setRequiredFields("");
    setRequiredDocs("");
    setPriority("MEDIUM");
    setDueAtLocal("");
    setInternalNote("");
    setError("");
  }

  function handleSubmit() {
    if (!ticket || !selectedCase) return setError("Kasus terkait wajib dipilih.");
    if (!target) return setError("Pihak yang diminta klarifikasi wajib dipilih.");
    if (!subject.trim()) return setError("Subjek klarifikasi wajib diisi.");
    if (!question.trim()) return setError("Pertanyaan wajib diisi.");
    if (!reason.trim()) return setError("Alasan diperlukannya klarifikasi wajib diisi.");
    if (!dueAtLocal) return setError("Batas waktu wajib diisi.");
    if (new Date(dueAtLocal).getTime() <= MOCK_NOW.getTime()) return setError("Batas waktu harus di masa mendatang.");
    if (isIllegalEntityCase && target === "PLATFORM") {
      return setError("Kasus ini terindikasi entitas tidak berizin — klarifikasi tidak dapat dikirim ke pihak yang dilaporkan.");
    }

    const requestedBy = {
      partyType: viewerPartyType,
      institutionName: viewer.institution,
      userName: viewerName,
      roleLabel: viewerRoleLabel,
    };

    const requestedFrom = buildTargetParty(target, selectedCase);

    const involvesReporter = viewerPartyType === "REPORTER" || target === "REPORTER";
    const id = createClarification({
      caseTicket: ticket,
      requestDirection: "OUTGOING",
      requestedBy,
      requestedFrom,
      subject: subject.trim(),
      question: question.trim(),
      reason: reason.trim(),
      requestedFields: requiredFields.trim() ? requiredFields.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      requestedEvidenceTypes: requiredDocs.trim() ? requiredDocs.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      priority,
      dueAt: formatMockDateTime(new Date(dueAtLocal)),
      internalNote: internalNote.trim() || undefined,
      visibility: {
        publicReporter: involvesReporter,
        platform: viewerPartyType === "PLATFORM" || target === "PLATFORM",
        bursa: viewerPartyType === "BURSA" || target === "BURSA",
        clearing: viewerPartyType === "CLEARING" || target === "CLEARING",
        bappebti: true,
      },
    });

    reset();
    onOpenChange(false);
    onCreated(id);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Buat Permintaan Klarifikasi</DialogTitle>
          <DialogDescription>Kirim permintaan informasi tambahan terkait kasus yang ditangani institusi Anda.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="cd-ticket">Kasus Terkait</Label>
            <Select id="cd-ticket" value={ticket} onChange={(e) => { setTicket(e.target.value); setTarget(""); }}>
              <option value="">Pilih kasus...</option>
              {cases.map((c) => (
                <option key={c.ticket} value={c.ticket}>
                  {c.ticket} — {c.title}
                </option>
              ))}
            </Select>
          </div>

          {isIllegalEntityCase && (
            <div className="flex items-start gap-2 rounded-md border border-amber/40 bg-amber-bg px-2 py-1.5 text-[11px] text-amber">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <p>Kasus ini terindikasi entitas tidak berizin. Klarifikasi tidak dapat dikirim ke pihak yang dilaporkan.</p>
            </div>
          )}

          <div>
            <Label htmlFor="cd-target">Pihak yang Diminta Klarifikasi</Label>
            <Select id="cd-target" value={target} onChange={(e) => setTarget(e.target.value as ClarificationPartyType)} disabled={!ticket}>
              <option value="">Pilih pihak...</option>
              {availableTargets.map((t) => (
                <option key={t} value={t}>
                  {CLARIFICATION_PARTY_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="cd-subject">Subjek</Label>
            <Input id="cd-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ringkasan singkat topik klarifikasi" />
          </div>
          <div>
            <Label htmlFor="cd-question">Pertanyaan</Label>
            <Textarea id="cd-question" value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-[80px]" placeholder="Tuliskan pertanyaan secara lengkap dan spesifik..." />
          </div>
          <div>
            <Label htmlFor="cd-reason">Alasan Diperlukan</Label>
            <Textarea id="cd-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cd-fields">Data yang Diperlukan (pisahkan dengan koma)</Label>
              <Input id="cd-fields" value={requiredFields} onChange={(e) => setRequiredFields(e.target.value)} placeholder="Nomor rekening, tanggal transaksi" />
            </div>
            <div>
              <Label htmlFor="cd-docs">Kategori Dokumen (pisahkan dengan koma)</Label>
              <Input id="cd-docs" value={requiredDocs} onChange={(e) => setRequiredDocs(e.target.value)} placeholder="Bukti transaksi, Identitas" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cd-priority">Prioritas</Label>
              <Select id="cd-priority" value={priority} onChange={(e) => setPriority(e.target.value as ClarificationPriority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {CLARIFICATION_PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="cd-due">Batas Waktu</Label>
              <Input id="cd-due" type="datetime-local" value={dueAtLocal} onChange={(e) => setDueAtLocal(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="cd-note">Catatan Internal (opsional, tidak terlihat pihak lain)</Label>
            <Textarea id="cd-note" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="min-h-[50px]" />
          </div>

          {error && <p className="text-xs text-red">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Kirim Permintaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildTargetParty(target: ClarificationPartyType, selectedCase: ComplaintCase) {
  switch (target) {
    case "REPORTER":
      return { partyType: "REPORTER" as const, institutionName: "Pelapor", userName: selectedCase.reporterName, roleLabel: "Pelapor" };
    case "BAPPEBTI":
      return { partyType: "BAPPEBTI" as const, institutionName: "Bappebti", roleLabel: "Petugas Kasus Bappebti" };
    case "PLATFORM":
      return { partyType: "PLATFORM" as const, institutionName: selectedCase.platform, roleLabel: "Tim Operasional Pialang" };
    case "BURSA":
      return { partyType: "BURSA" as const, institutionName: selectedCase.bursaEntity, roleLabel: "Petugas Kasus Bursa" };
    case "CLEARING":
      return { partyType: "CLEARING" as const, institutionName: selectedCase.kliringEntity, roleLabel: "Tim Rekonsiliasi Kliring" };
  }
}
