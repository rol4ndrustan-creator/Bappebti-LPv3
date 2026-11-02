"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { useToast } from "@/components/shared/toast-provider";
import { useLifecycleActor } from "@/components/shared/ticket-lifecycle";
import { CASES } from "@/lib/mock-data";
import { useLifecycleViews } from "@/lib/mock-service/lifecycle-store";
import { LifecycleView, TICKET_STATUS_TONE } from "@/lib/ticket-lifecycle";
import { baktiAddHearing, baktiVerdict, baktiVerify } from "@/lib/lifecycle-actions";
import { formatWIB } from "@/lib/case-pdf";
import { ArbitrationVerdict, ComplaintCase } from "@/lib/types";
import { FileText, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const VERDICTS: ArbitrationVerdict[] = ["Disetujui Sesuai Permintaan", "Disetujui Sebagian Permintaan", "Tidak Dipenuhi Semua Permintaan"];

type Stage = "pengajuan" | "sidang" | "putusan";

function stageOf(v: LifecycleView): Stage | "selesai" | null {
  const a = v.lc.arbitration;
  if (!a) return null;
  if (a.verdict || a.verification?.decision === "Ditolak") return "selesai";
  if (!a.verification) return "pengajuan";
  return a.hearings.length === 0 ? "sidang" : "putusan";
}

const fmt = (iso?: string) => (iso ? `${formatWIB(new Date(iso))} WIB` : "-");

/**
 * Modul "Proses Penyelesaian Khusus" portal BAKTI (List Revisi 12 #7):
 * Pengajuan → Proses Penanganan & Sidang → Putusan Akhir. readOnly untuk Bappebti.
 */
export function ArbitrationModule({ readOnly, detailHref }: { readOnly: boolean; detailHref: (ticket: string) => string }) {
  const get = useLifecycleViews();
  const [selected, setSelected] = React.useState<string | null>(null);
  const rows = CASES.map((c) => ({ c, v: get(c) })).filter((r): r is { c: ComplaintCase; v: LifecycleView } => !!r.v && !!r.v.lc.arbitration);
  const by = (s: Stage | "selesai") => rows.filter((r) => stageOf(r.v) === s);
  const sel = rows.find((r) => r.c.ticket === selected);

  const tabs: { key: string; label: string; list: typeof rows }[] = [
    { key: "pengajuan", label: "1. Pengajuan Penyelesaian Pengaduan", list: by("pengajuan") },
    { key: "sidang", label: "2. Proses Penanganan & Sidang", list: [...by("sidang"), ...by("putusan")] },
    { key: "putusan", label: "3. Putusan Akhir Kasus", list: [...by("putusan"), ...by("selesai")] },
  ];

  return (
    <div>
      <Tabs defaultValue="pengajuan">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label} ({t.list.length})
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Tiket</TableHead>
                  <TableHead>Pemohon / Termohon</TableHead>
                  <TableHead>Diajukan</TableHead>
                  <TableHead>Verifikasi</TableHead>
                  <TableHead>Sidang</TableHead>
                  <TableHead>Putusan</TableHead>
                  <TableHead>Status Tiket</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {t.list.map(({ c, v }) => {
                  const a = v.lc.arbitration!;
                  return (
                    <TableRow key={c.ticket}>
                      <TableCell className="whitespace-nowrap">
                        <Link href={detailHref(c.ticket)} className="font-medium text-navy hover:underline">
                          {c.ticket}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{a.submittedBy}</p>
                        <p className="text-[11px] text-muted">vs {c.platform}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{fmt(a.submittedAt)}</TableCell>
                      <TableCell>{a.verification?.decision ?? <span className="text-muted">Menunggu</span>}</TableCell>
                      <TableCell>{a.hearings.length}</TableCell>
                      <TableCell className="max-w-[180px]">{a.verdict?.decision ?? <span className="text-muted">-</span>}</TableCell>
                      <TableCell>
                        <Badge variant={TICKET_STATUS_TONE[v.status]}>{v.status.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant={readOnly ? "ghost" : "secondary"} onClick={() => setSelected(c.ticket)}>
                          {readOnly ? "Lihat" : "Kelola"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {t.list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted py-6">
                      Tidak ada perkara pada tahap ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>

      {sel && <ArbitrationCaseDialog c={sel.c} v={sel.v} readOnly={readOnly} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ArbitrationCaseDialog({ c, v, readOnly, onClose }: { c: ComplaintCase; v: LifecycleView; readOnly: boolean; onClose: () => void }) {
  const a = v.lc.arbitration!;
  const stage = stageOf(v);
  const actor = useLifecycleActor(c);
  const { showToast } = useToast();
  const [verifyNote, setVerifyNote] = React.useState("");
  const [hearing, setHearing] = React.useState({ date: "", number: "", notula: "" });
  const [baFiles, setBaFiles] = React.useState<string[]>([]);
  const [verdict, setVerdict] = React.useState<ArbitrationVerdict | "">("");
  const [verdictNotes, setVerdictNotes] = React.useState("");
  const [verdictFiles, setVerdictFiles] = React.useState<string[]>([]);
  const isPdf = (f: string[]) => f.length === 1 && f[0].toLowerCase().endsWith(".pdf");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="size-4" /> {c.ticket} — Arbitrase BAKTI
          </DialogTitle>
          <DialogDescription>
            {c.title} · Pemohon {a.submittedBy} vs {c.platform}
            {readOnly && " · Tampilan pemantauan Bappebti (read-only)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Tahap 1 */}
          <section className="rounded-md border border-border p-3 space-y-2">
            <p className="font-semibold text-navy">1. Pengajuan Penyelesaian Pengaduan</p>
            <p className="inline-flex items-center gap-1">
              <FileText className="size-3.5" /> Formulir registrasi: {a.formFile} · diajukan {fmt(a.submittedAt)}
            </p>
            {a.verification ? (
              <p className={cn("rounded px-2 py-1", a.verification.decision === "Disetujui" ? "bg-green-bg text-green" : "bg-red-bg text-red")}>
                {a.verification.decision} — {a.verification.note} ({a.verification.by}, {fmt(a.verification.at)})
              </p>
            ) : readOnly ? (
              <p className="text-muted">Menunggu verifikasi berkas oleh BAKTI.</p>
            ) : (
              <div className="space-y-2">
                <Textarea placeholder="Catatan verifikasi berkas permohonan..." value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} className="min-h-[60px] text-sm" />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      baktiVerify(c.ticket, actor, "Disetujui", verifyNote.trim());
                      showToast("Permohonan arbitrase disetujui; perkara masuk tahap sidang.");
                    }}
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!verifyNote.trim()}
                    onClick={() => {
                      baktiVerify(c.ticket, actor, "Ditolak", verifyNote.trim());
                      showToast("Permohonan arbitrase ditolak.");
                    }}
                  >
                    Tolak
                  </Button>
                </div>
                <p className="text-[11px] text-muted">Alasan wajib diisi untuk penolakan.</p>
              </div>
            )}
          </section>

          {/* Tahap 2 */}
          {a.verification?.decision === "Disetujui" && (
            <section className="rounded-md border border-border p-3 space-y-2">
              <p className="font-semibold text-navy">2. Proses Penanganan & Sidang</p>
              {a.hearings.length === 0 && <p className="text-muted">Belum ada sidang tercatat.</p>}
              {a.hearings.map((h, i) => (
                <div key={h.id} className="rounded-md bg-muted-bg/60 p-2">
                  <p className="font-medium">
                    Sidang ke-{i + 1} · {h.date} · No. {h.number}
                  </p>
                  <p className="mt-0.5">{h.notula}</p>
                  <p className="mt-0.5 text-muted inline-flex items-center gap-1">
                    <FileText className="size-3" /> {h.document}
                  </p>
                </div>
              ))}
              {!readOnly && !a.verdict && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <p className="font-medium">Catat Tahapan Sidang</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label>Tanggal sidang</Label>
                      <Input type="date" value={hearing.date} onChange={(e) => setHearing({ ...hearing, date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Nomor sidang</Label>
                      <Input value={hearing.number} placeholder="BAKTI/SDG/2026/..." onChange={(e) => setHearing({ ...hearing, number: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Notula ringkasan</Label>
                    <Textarea value={hearing.notula} onChange={(e) => setHearing({ ...hearing, notula: e.target.value })} className="min-h-[60px] text-sm" />
                  </div>
                  <FileUploader files={baFiles} onChange={setBaFiles} multiple={false} maxFiles={1} accept=".pdf" label="Unggah PDF Berita Acara Sidang" />
                  <Button
                    size="sm"
                    disabled={!hearing.date || !hearing.number.trim() || !hearing.notula.trim() || !isPdf(baFiles)}
                    onClick={() => {
                      baktiAddHearing(c.ticket, actor, { ...hearing, number: hearing.number.trim(), notula: hearing.notula.trim(), document: baFiles[0] });
                      showToast("Tahapan sidang tersimpan.");
                      setHearing({ date: "", number: "", notula: "" });
                      setBaFiles([]);
                    }}
                  >
                    Simpan Sidang
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Tahap 3 */}
          {a.verification?.decision === "Disetujui" && (
            <section className="rounded-md border border-border p-3 space-y-2">
              <p className="font-semibold text-navy">3. Putusan Akhir Kasus</p>
              {a.verdict ? (
                <div className="rounded-md bg-green-bg/60 p-2">
                  <p className="font-semibold">{a.verdict.decision}</p>
                  <p className="mt-0.5">{a.verdict.notes}</p>
                  <p className="mt-0.5 text-muted">
                    {a.verdict.document} · {a.verdict.by}, {fmt(a.verdict.at)} · Status: Close Arbitrase
                  </p>
                </div>
              ) : readOnly ? (
                <p className="text-muted">Belum ada putusan.</p>
              ) : stage !== "putusan" ? (
                <p className="text-muted">Catat minimal satu sidang sebelum menerbitkan putusan akhir.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-1.5">
                    {VERDICTS.map((d) => (
                      <label key={d} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer", verdict === d ? "border-navy bg-navy/5" : "border-border")}>
                        <input type="radio" name="verdict" checked={verdict === d} onChange={() => setVerdict(d)} /> {d}
                      </label>
                    ))}
                  </div>
                  <Textarea placeholder="Amar / ringkasan putusan..." value={verdictNotes} onChange={(e) => setVerdictNotes(e.target.value)} className="min-h-[60px] text-sm" />
                  <FileUploader files={verdictFiles} onChange={setVerdictFiles} multiple={false} maxFiles={1} accept=".pdf" label="Unggah salinan putusan (PDF)" />
                  <Button
                    size="sm"
                    variant="success"
                    disabled={!verdict || !verdictNotes.trim() || !isPdf(verdictFiles)}
                    onClick={() => {
                      baktiVerdict(c.ticket, actor, verdict as ArbitrationVerdict, verdictNotes.trim(), verdictFiles[0]);
                      showToast("Putusan akhir tersimpan. Status kasus: Close Arbitrase.");
                    }}
                  >
                    Simpan Putusan
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
