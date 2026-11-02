import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, OwnerBadge } from "@/components/shared/badges";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CASES, NOTIFICATIONS } from "@/lib/mock-data";
import { FileText, Clock, UserCheck, FileCheck2, CheckCircle2, Bell, ArrowRight } from "lucide-react";
import { TicketStatusBadge } from "@/components/shared/ticket-lifecycle";

export default function PublikDashboardPage() {
  const total = CASES.length;
  const sedangDiproses = CASES.filter((c) => c.status === "Diproses").length;
  const menungguTindakan = CASES.filter((c) => c.currentOwner === "Pelapor").length;
  const resolusiDiajukan = CASES.filter((c) => c.status === "Resolusi Diajukan").length;
  const selesai = CASES.filter((c) => c.status === "Selesai").length;

  const terbaru = [...CASES]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 6);

  const tindakanPerlu = CASES.filter((c) => c.currentOwner === "Pelapor");

  const notifTerbaru = NOTIFICATIONS.slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Dashboard Pengaduan"
        description="Ringkasan status pengaduan yang Anda ajukan ke Bappebti."
      />

      {/* KPI widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Total Pengaduan" value={total} icon={FileText} tone="navy" />
        <KpiCard label="Sedang Diproses" value={sedangDiproses} icon={Clock} tone="amber" />
        <KpiCard label="Menunggu Tindakan Saya" value={menungguTindakan} icon={UserCheck} tone="red" />
        <KpiCard label="Resolusi Diajukan" value={resolusiDiajukan} icon={FileCheck2} tone="amber" />
        <KpiCard label="Selesai" value={selesai} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pengaduan terbaru */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-navy mb-2">Pengaduan Terbaru</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiket</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Status Tiket</TableHead>
                <TableHead>Current Owner</TableHead>
                <TableHead>Update Terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terbaru.map((c) => (
                <TableRow key={c.ticket}>
                  <TableCell>
                    <Link
                      href={`/publik/pengaduan/${c.ticket}`}
                      className="font-medium text-navy hover:underline whitespace-nowrap"
                    >
                      {c.ticket}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate" title={c.title}>
                    <Link href={`/publik/pengaduan/${c.ticket}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge complaintCase={c} />
                  </TableCell>
                  <TableCell>
                    <OwnerBadge owner={c.currentOwner} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted">{c.updatedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Sidebar: tindakan + notifikasi */}
        <div className="flex flex-col gap-4">
          {/* Tindakan yang diperlukan */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2 border-b border-border">
              <h2 className="text-sm font-semibold text-navy">Tindakan yang Diperlukan</h2>
            </div>
            <div className="divide-y divide-border">
              {tindakanPerlu.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted">Tidak ada tindakan yang diperlukan saat ini.</p>
              )}
              {tindakanPerlu.map((c) => (
                <Link
                  key={c.ticket}
                  href={`/publik/pengaduan/${c.ticket}`}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-muted-bg/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-navy">{c.ticket}</p>
                    <p className="text-xs text-foreground truncate">{c.title}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {c.status === "Resolusi Diajukan"
                        ? "Mohon konfirmasi resolusi yang diajukan."
                        : "Menunggu kelengkapan data dari Anda."}
                    </p>
                  </div>
                  <ArrowRight className="size-3.5 text-muted shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Notifikasi terbaru */}
          <div className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Notifikasi Terbaru</h2>
              <Link href="/publik/notifikasi" className="text-[11px] text-navy hover:underline flex items-center gap-1">
                Lihat semua <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {notifTerbaru.map((n, i) => (
                <Link
                  key={i}
                  href={`/publik/pengaduan/${n.ticket}`}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-muted-bg/60 transition-colors"
                >
                  <Bell className={`size-3.5 shrink-0 mt-0.5 ${n.status === "Belum Dibaca" ? "text-amber" : "text-muted"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{n.type}</p>
                    <p className="text-[11px] text-muted truncate">{n.message}</p>
                    <p className="text-[11px] text-muted mt-0.5">{n.time} · {n.ticket}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
