import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, SlaBadge } from "@/components/shared/badges";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CASES } from "@/lib/mock-data";
import {
  ClipboardList,
  Clock,
  MessageCircle,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

const platformCases = CASES.filter((c) => c.currentOwner === "Pialang");

function actionNote(status: string): string {
  switch (status) {
    case "Baru":
      return "Lakukan verifikasi awal dan mulai investigasi.";
    case "Verifikasi":
      return "Selesaikan verifikasi dan tetapkan rencana penanganan.";
    case "Diproses":
      return "Lanjutkan investigasi dan perbarui catatan penanganan.";
    case "Menunggu Klarifikasi":
      return "Tunggu/tindak lanjuti respon klarifikasi dari pelapor.";
    case "Resolusi Diajukan":
      return "Pantau konfirmasi penerimaan resolusi dari pelapor.";
    default:
      return "Tinjau kasus dan tentukan langkah selanjutnya.";
  }
}

export default function PlatformDashboardPage() {
  const assignedOpen = platformCases.filter((c) => c.status !== "Selesai");
  const dueSoon = platformCases.filter((c) => c.slaStatus === "Mendekati SLA");
  const waitingClarification = CASES.filter((c) => c.status === "Menunggu Klarifikasi");
  const resolutionDraft = CASES.filter((c) => c.status === "Resolusi Diajukan");
  const escalationRisk = platformCases.filter((c) => c.slaStatus === "Lewat SLA");

  const actionQueue = platformCases.slice(0, 4);
  const evidenceCases = platformCases.filter((c) => c.evidences.length <= 1 || c.clarifications.some((cl) => cl.role === "Pialang"));
  const dueSoonCases = platformCases.filter((c) => c.slaStatus === "Mendekati SLA");
  const resolutionSummary = CASES.filter((c) => c.status === "Resolusi Diajukan" && !!c.resolutionProposal);

  return (
    <div>
      <PageHeader
        title="Dashboard Pialang"
        description="Ringkasan operasional harian untuk kasus pengaduan yang menjadi tanggung jawab Pialang."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Kasus Aktif Ditugaskan" value={assignedOpen.length} icon={ClipboardList} tone="navy" hint="Status belum selesai" />
        <KpiCard label="Due < 24 Jam" value={dueSoon.length} icon={Clock} tone="amber" hint="Mendekati batas SLA" />
        <KpiCard label="Menunggu Klarifikasi" value={waitingClarification.length} icon={MessageCircle} tone="amber" hint="Menunggu respon pelapor" />
        <KpiCard label="Draf Resolusi" value={resolutionDraft.length} icon={FileCheck2} tone="green" hint="Resolusi diajukan" />
        <KpiCard label="Risiko Eskalasi" value={escalationRisk.length} icon={AlertTriangle} tone="red" hint="Lewat batas SLA" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Antrean Aksi Hari Ini</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/platform/case-queue">Lihat Manajemen Pengaduan</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tindakan Diperlukan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionQueue.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{c.title}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-muted">{actionNote(c.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kasus Membutuhkan Bukti</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Bukti Saat Ini</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidenceCases.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{c.title}</TableCell>
                    <TableCell className="text-muted">{c.evidences.length} berkas</TableCell>
                    <TableCell className="text-muted">
                      {c.clarifications.some((cl) => cl.role === "Pialang")
                        ? "Menunggu unggahan bukti tambahan dari pelapor"
                        : "Lengkapi bukti penanganan kasus"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Kasus Mendekati Jatuh Tempo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Batas Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dueSoonCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      Tidak ada kasus yang mendekati jatuh tempo.
                    </TableCell>
                  </TableRow>
                )}
                {dueSoonCases.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{c.title}</TableCell>
                    <TableCell><SlaBadge sla={c.slaStatus} /></TableCell>
                    <TableCell className="text-muted">{c.slaDeadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Usulan Resolusi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Usulan Resolusi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolutionSummary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted py-4">
                      Belum ada usulan resolusi yang diajukan.
                    </TableCell>
                  </TableRow>
                )}
                {resolutionSummary.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[140px] truncate">{c.title}</TableCell>
                    <TableCell className="text-muted max-w-[260px]">{c.resolutionProposal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
