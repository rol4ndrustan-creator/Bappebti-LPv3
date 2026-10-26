"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SLA_HISTORY, CONFIG_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useSlaHistory } from "@/lib/mock-service/sla-store";
import { requestConfigChange, useConfigChangeRequests } from "@/lib/mock-service/config-approval-store";
import { useToast } from "@/components/shared/toast-provider";
import { DISPUTE_RULES } from "@/lib/dispute-workflow";
import { formatCurrencyIDR } from "@/lib/format";
import { Clock3, Pencil } from "lucide-react";

const DISPUTE_SLA_ROWS: { tahap: string; pihak: string; tenggat: string; akibat: string }[] = [
  { tahap: "Verifikasi materiil & formil", pihak: "Bappebti", tenggat: `${DISPUTE_RULES.bappebtiVerificationBusinessDays} hari kerja`, akibat: "Materiil tidak terpenuhi → ditolak & ditutup; formil tidak terpenuhi → dikembalikan" },
  { tahap: "Klarifikasi pengaduan", pihak: "Pialang Berjangka", tenggat: `${DISPUTE_RULES.pialangClarificationBusinessDays} hari kerja`, akibat: "Lewat tanpa klarifikasi → Pialang dianggap menyetujui pengaduan" },
  { tahap: "Perbaikan berkas formil", pihak: "Nasabah", tenggat: `${DISPUTE_RULES.formilCorrectionBusinessDays} hari kerja sejak dikembalikan`, akibat: "Diverifikasi ulang oleh Bappebti" },
  { tahap: "Musyawarah", pihak: "Pialang Berjangka", tenggat: `${DISPUTE_RULES.musyawarahBusinessDays} hari kerja (+ maks. ${DISPUTE_RULES.maxExtensionCalendarDays} hari)`, akibat: "Tidak tercapai → Mediasi Bursa" },
  { tahap: "Mediasi", pihak: "Bursa Berjangka", tenggat: `${DISPUTE_RULES.mediasiBusinessDays} hari kerja (+ maks. ${DISPUTE_RULES.maxExtensionCalendarDays} hari)`, akibat: "Hasil dilaporkan ke Bappebti" },
  { tahap: "Lapor hasil mediasi", pihak: "Bursa Berjangka", tenggat: `${DISPUTE_RULES.mediasiReportBusinessDays} hari kerja`, akibat: "Sepakat → dokumen ke Bappebti; tidak sepakat → Pengadilan/BAKTI" },
  { tahap: "Pemilihan BAKTI", pihak: "Nasabah", tenggat: `${DISPUTE_RULES.forumChoiceBusinessDays} hari kerja`, akibat: "Penyelesaian melalui BAKTI atau Pengadilan" },
  { tahap: "Dokumen kesepakatan", pihak: "Pialang / Bursa", tenggat: "-", akibat: `< ${formatCurrencyIDR(DISPUTE_RULES.agreementValueThreshold)} dokumen kesepakatan; ≥ ${formatCurrencyIDR(DISPUTE_RULES.agreementValueThreshold)} akta perdamaian` },
];

export default function SlaManagementPage() {
  const history = useSlaHistory(SLA_HISTORY);
  const current = history[0];
  const { showToast } = useToast();
  const allRequests = useConfigChangeRequests(CONFIG_CHANGE_REQUESTS);
  const pendingSla = allRequests.find((r) => r.configType === "Manajemen SLA" && r.status === "Menunggu");

  const [open, setOpen] = React.useState(false);
  const [hours, setHours] = React.useState("");
  const [note, setNote] = React.useState("");

  function handleSubmit() {
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) return;
    requestConfigChange({
      configType: "Manajemen SLA",
      action: "Ubah",
      itemLabel: "SLA Respons Pengaduan",
      beforeValue: `${current?.hours ?? "-"} jam`,
      afterValue: `${value} jam`,
      payload: JSON.stringify({ hours: value, note: note.trim() || undefined }),
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast(`Permohonan perubahan SLA menjadi ${value} jam telah diajukan untuk persetujuan.`);
    setHours("");
    setNote("");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Manajemen SLA"
        description="SLA respons pengaduan berlaku secara global dalam hitungan jam. Setiap perubahan memerlukan persetujuan pada Approval Configuration dan dicatat pada riwayat di bawah."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Pencil className="size-3.5" /> Ubah SLA
          </Button>
        }
      />

      {pendingSla && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber-bg/40 p-3 flex items-start gap-2">
          <Clock3 className="size-4 text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            Perubahan SLA menjadi <strong>{pendingSla.afterValue}</strong> sedang menunggu persetujuan — diajukan
            oleh {pendingSla.requestedBy}.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="py-5 flex flex-col items-center justify-center text-center">
          <Clock3 className="size-6 text-navy mb-2" />
          <p className="text-[11px] uppercase tracking-wide text-muted font-medium">SLA Saat Ini</p>
          <p className="text-3xl font-semibold text-navy mt-1">{current?.hours ?? "-"} Jam</p>
          {current && (
            <p className="text-[11px] text-muted mt-1">
              Berlaku sejak {current.effectiveFrom} &middot; oleh {current.changedBy}
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="text-sm font-semibold text-navy mt-6 mb-1">Tenggat Mekanisme Penanganan Perselisihan Nasabah PBK</h2>
      <p className="text-[11px] text-muted mb-2">
        Ditetapkan oleh mekanisme Bappebti (bukan SLA global di atas) dan dihitung dalam hari kerja. Nilai dikelola di lib/dispute-workflow.ts.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tahap</TableHead>
            <TableHead>Pihak</TableHead>
            <TableHead>Tenggat</TableHead>
            <TableHead>Akibat / Lanjutan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DISPUTE_SLA_ROWS.map((r) => (
            <TableRow key={r.tahap}>
              <TableCell className="font-medium whitespace-nowrap">{r.tahap}</TableCell>
              <TableCell className="whitespace-nowrap">{r.pihak}</TableCell>
              <TableCell className="whitespace-nowrap">{r.tenggat}</TableCell>
              <TableCell className="text-muted">{r.akibat}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="text-sm font-semibold text-navy mt-6 mb-2">Riwayat Perubahan SLA</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Berlaku Sejak</TableHead>
            <TableHead>SLA (Jam)</TableHead>
            <TableHead>Diubah Oleh</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h, i) => (
            <TableRow key={h.id}>
              <TableCell className="whitespace-nowrap font-medium">{h.effectiveFrom}</TableCell>
              <TableCell>{h.hours} jam</TableCell>
              <TableCell className="whitespace-nowrap text-muted">{h.changedBy}</TableCell>
              <TableCell className="max-w-[320px] text-muted">{h.note || "-"}</TableCell>
              <TableCell>{i === 0 ? <Badge variant="green">AKTIF</Badge> : <Badge variant="muted">RIWAYAT</Badge>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah SLA</DialogTitle>
            <DialogDescription>SLA baru akan berlaku setelah disetujui pada Approval Configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <Label htmlFor="sla-hours">SLA Baru (Jam)</Label>
              <Input id="sla-hours" type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Contoh: 48" />
            </div>
            <div>
              <Label htmlFor="sla-note">Catatan Perubahan (opsional)</Label>
              <Textarea id="sla-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px] text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!hours.trim()} onClick={handleSubmit}>Ajukan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
