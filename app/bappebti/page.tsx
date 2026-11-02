"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SeverityBadge, SlaBadge, RiskBadge } from "@/components/shared/badges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CASES, MEMBERS } from "@/lib/mock-data";
import { DashboardFilterBar, useDashboardFilters } from "@/components/shared/dashboard-filters";
import { deriveWorkflowState, WORKFLOW_STATES } from "@/lib/workflow-config";
import { ComplaintCase } from "@/lib/types";
import {
  AlertCircle,
  Building2,
  Clock,
  ShieldAlert,
  Gauge,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

function isOpenCase(c: ComplaintCase): boolean {
  return WORKFLOW_STATES[deriveWorkflowState(c)].isOpen;
}

function DashboardContent({ cases: CASES, toolbar }: { cases: ComplaintCase[]; toolbar: React.ReactNode }) {
  const open = CASES.filter(isOpenCase);
  const bappebtiOwned = CASES.filter((c) => c.responsibility === "BAPPEBTI OWNED");
  const memberAssigned = CASES.filter((c) => c.responsibility === "MEMBER ASSIGNED");
  const waitingPublic = CASES.filter((c) => c.responsibility === "WAITING PUBLIC");
  const nearSla = CASES.filter((c) => c.slaStatus === "Mendekati SLA");
  const overSla = CASES.filter((c) => c.slaStatus === "Lewat SLA");
  const critical = CASES.filter((c) => c.severity === "Kritis");

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  for (const c of CASES) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  }
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(...categoryEntries.map(([, v]) => v), 1);

  // Per-platform breakdown of still-active/in-process complaints
  const platformCounts: Record<string, number> = {};
  for (const c of open) {
    platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1;
  }
  const platformEntries = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  const maxPlatform = Math.max(...platformEntries.map(([, v]) => v), 1);

  // SLA compliance
  const safeCount = CASES.filter((c) => c.slaStatus === "Aman").length;
  const nearCount = nearSla.length;
  const overCount = overSla.length;
  const total = CASES.length;
  const slaCompliance = "84%";

  // Responsibility split
  const respTotal = bappebtiOwned.length + memberAssigned.length + waitingPublic.length;

  const criticalQueue = critical.slice(0, 4);
  const overdueQueue = overSla.slice(0, 4);
  const topRiskMembers = [...MEMBERS]
    .sort((a, b) => {
      const order = { Tinggi: 0, Sedang: 1, Rendah: 2 };
      return order[a.risk] - order[b.risk];
    })
    .slice(0, 3);

  const alerts = [
    "Lonjakan pengaduan penarikan dana",
    "Sengketa kepemilikan dana meningkat",
    "Kategori privasi data dalam tinjauan",
    "Pengaduan nilai tinggi terdeteksi",
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard Eksekutif"
        description="Ringkasan kondisi penanganan pengaduan lintas platform, bursa, dan kliring untuk pengawasan Bappebti."
      />
      {toolbar}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        <KpiCard label="Pengaduan Terbuka" value={open.length} icon={AlertCircle} tone="navy" />
        <KpiCard label="Bappebti-Owned" value={bappebtiOwned.length} icon={ShieldAlert} tone="red" />
        <KpiCard label="Member-Assigned" value={memberAssigned.length} icon={Building2} tone="default" />
        <KpiCard label="Menunggu Publik" value={waitingPublic.length} icon={Clock} tone="amber" />
        <KpiCard label="Mendekati SLA" value={nearSla.length} icon={Clock} tone="amber" />
        <KpiCard label="Melewati SLA" value={overSla.length} icon={AlertTriangle} tone="red" />
        <KpiCard label="Kasus Kritis" value={critical.length} icon={ShieldAlert} tone="red" />
        <KpiCard label="Kepatuhan SLA" value={slaCompliance} icon={Gauge} tone="green" />
      </div>

      {/* Two column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Tren Pengaduan per Kategori</CardTitle>
            <CardDescription>Distribusi jumlah pengaduan berdasarkan kategori.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {categoryEntries.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{cat}</span>
                  <span className="text-muted">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-navy"
                    style={{ width: `${(count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kepatuhan SLA</CardTitle>
            <CardDescription>Status kasus berdasarkan kepatuhan batas waktu SLA.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-3 w-full overflow-hidden rounded-full mb-3">
              <div className="bg-green" style={{ width: `${(safeCount / Math.max(total, 1)) * 100}%` }} />
              <div className="bg-amber" style={{ width: `${(nearCount / Math.max(total, 1)) * 100}%` }} />
              <div className="bg-red" style={{ width: `${(overCount / Math.max(total, 1)) * 100}%` }} />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-green inline-block" /> Aman
                </span>
                <span className="text-muted">
                  {safeCount} kasus ({Math.round((safeCount / Math.max(total, 1)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber inline-block" /> Mendekati SLA
                </span>
                <span className="text-muted">
                  {nearCount} kasus ({Math.round((nearCount / Math.max(total, 1)) * 100)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red inline-block" /> Lewat SLA
                </span>
                <span className="text-muted">
                  {overCount} kasus ({Math.round((overCount / Math.max(total, 1)) * 100)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-platform bar chart */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Pengaduan Aktif per Platform</CardTitle>
          <CardDescription>Jumlah pengaduan yang masih aktif/dalam proses, dikelompokkan per platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: 180 }}>
            {platformEntries.map(([platform, count]) => (
              <div key={platform} className="flex flex-col items-center gap-1.5 shrink-0 w-20">
                <span className="text-xs font-semibold text-navy">{count}</span>
                <div
                  className="w-10 rounded-t-md bg-navy"
                  style={{ height: `${Math.max((count / maxPlatform) * 130, 6)}px` }}
                  title={`${platform}: ${count} pengaduan aktif`}
                />
                <span className="text-[10px] text-muted text-center leading-tight" title={platform}>
                  {platform.replace(/^PT\.?\s*/i, "")}
                </span>
              </div>
            ))}
            {platformEntries.length === 0 && (
              <p className="text-xs text-muted">Tidak ada pengaduan aktif saat ini.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Responsibility split + risk alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Pemisahan Tanggung Jawab Kasus</CardTitle>
            <CardDescription>Proporsi kasus berdasarkan pihak yang bertanggung jawab saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-3 w-full overflow-hidden rounded-full mb-3">
              <div className="bg-red" style={{ width: `${(bappebtiOwned.length / Math.max(respTotal, 1)) * 100}%` }} />
              <div className="bg-navy" style={{ width: `${(memberAssigned.length / Math.max(respTotal, 1)) * 100}%` }} />
              <div className="bg-amber" style={{ width: `${(waitingPublic.length / Math.max(respTotal, 1)) * 100}%` }} />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red inline-block" /> Bappebti Owned
                </span>
                <span className="text-muted">{bappebtiOwned.length} kasus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-navy inline-block" /> Member Assigned
                </span>
                <span className="text-muted">{memberAssigned.length} kasus</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-amber inline-block" /> Waiting Public
                </span>
                <span className="text-muted">{waitingPublic.length} kasus</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peringatan Risiko Sistemik</CardTitle>
            <CardDescription>Indikasi pola risiko yang memerlukan perhatian regulator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert}
                className="flex items-start gap-2 rounded-md border border-amber/30 bg-amber-bg px-3 py-2 text-xs"
              >
                <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
                <span>{alert}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Preview tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Pratinjau Antrean Kritis</CardTitle>
            <CardDescription>Kasus dengan tingkat keparahan kritis yang memerlukan perhatian segera.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalQueue.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{c.title}</TableCell>
                    <TableCell className="text-muted">{c.platform}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={c.severity} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/bappebti/kasus/${c.ticket}`} className="text-navy inline-flex items-center gap-1 hover:underline">
                        Tinjau <ArrowRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pratinjau Pelanggaran SLA</CardTitle>
            <CardDescription>Kasus yang telah melewati batas waktu SLA.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueQueue.map((c) => (
                  <TableRow key={c.ticket}>
                    <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{c.title}</TableCell>
                    <TableCell className="text-muted">{c.platform}</TableCell>
                    <TableCell>
                      <SlaBadge sla={c.slaStatus} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/bappebti/kasus/${c.ticket}`} className="text-navy inline-flex items-center gap-1 hover:underline">
                        Tinjau <ArrowRight className="size-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {overdueQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted py-4">
                      Tidak ada kasus yang melewati SLA.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Member risk ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Peringkat Risiko Anggota</CardTitle>
          <CardDescription>Anggota dengan tingkat risiko tertinggi berdasarkan kinerja penanganan pengaduan.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Total Kasus</TableHead>
                <TableHead>SLA Breach</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topRiskMembers.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted">{m.type}</TableCell>
                  <TableCell>{m.totalCases}</TableCell>
                  <TableCell>{m.slaBreach}</TableCell>
                  <TableCell>
                    <RiskBadge risk={m.risk} />
                  </TableCell>
                  <TableCell>
                    <Link href="/bappebti/kinerja-anggota" className="text-navy inline-flex items-center gap-1 hover:underline">
                      Lihat <ArrowRight className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardEksekutifPage() {
  const filters = useDashboardFilters(CASES);
  return <DashboardContent cases={filters.cases} toolbar={<DashboardFilterBar {...filters} />} />;
}
