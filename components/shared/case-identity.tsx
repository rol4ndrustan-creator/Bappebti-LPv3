"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ComplaintCase } from "@/lib/types";
import { useLifecycleView } from "@/lib/mock-service/lifecycle-store";
import { Download, Eye, FileText } from "lucide-react";

/** "Pihak yang Dilaporkan: Nama — Jabatan" (List Revisi 13 #2). */
export function ReportedPartyValue({ complaintCase: c }: { complaintCase: ComplaintCase }) {
  const v = useLifecycleView(c);
  const r = v?.lc.respondent;
  if (!v) return <span className="text-muted">-</span>;
  if (!c.platform) return <span className="text-muted">Belum diketahui (menunggu triase Bappebti)</span>;
  if (!r) return <span>Tidak spesifik — lembaga {c.platform}</span>;
  return (
    <span>
      {r.name} — {r.position.replace(" (WPB)", "")}
    </span>
  );
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function downloadChronologyPdf(c: ComplaintCase, name: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`KRONOLOGI KASUS ${c.ticket}`, 18, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Pelapor: ${c.reporterName} · Pialang: ${c.platform || "-"}`, 18, 30);
  doc.text(doc.splitTextToSize(c.chronology, 174) as string[], 18, 40);
  doc.save(name);
}

/**
 * Kronologi perkara: narasi teks, atau kartu dokumen bila kronologi diunggah
 * sebagai berkas (List Revisi 13 #4) — teks manual disembunyikan.
 */
export function ChronologyBlock({ complaintCase: c, textClassName = "text-foreground/90" }: { complaintCase: ComplaintCase; textClassName?: string }) {
  const [preview, setPreview] = React.useState(false);
  const docInfo = c.chronologyDocument;
  if (!docInfo) return <p className={textClassName}>{c.chronology}</p>;
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted-bg/40 p-3">
        <span className="flex size-10 items-center justify-center rounded-md bg-red-bg text-red shrink-0">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{docInfo.name}</p>
          <p className="text-[11px] text-muted">PDF · {formatSize(docInfo.sizeBytes)} · kronologi diunggah sebagai berkas oleh pelapor</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPreview(true)}>
            <Eye className="size-3.5" /> Lihat Pratinjau
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadChronologyPdf(c, docInfo.name)}>
            <Download className="size-3.5" /> Unduh Berkas
          </Button>
        </div>
      </div>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pratinjau — {docInfo.name}</DialogTitle>
            <DialogDescription>{formatSize(docInfo.sizeBytes)} · Halaman 1</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-white p-6 shadow-inner max-h-[60vh] overflow-y-auto text-black">
            <p className="text-sm font-bold">KRONOLOGI KASUS {c.ticket}</p>
            <p className="text-[11px] text-gray-600 mb-3">
              Pelapor: {c.reporterName} · Pialang: {c.platform || "-"}
            </p>
            <p className="text-xs leading-relaxed whitespace-pre-line">{c.chronology}</p>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setPreview(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
