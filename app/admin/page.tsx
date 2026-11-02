"use client";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { deriveWorkflowState, WORKFLOW_STATES } from "@/lib/workflow-config";
import { ComplaintCase } from "@/lib/types";
import { FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface PlatformBreakdown {
  platform: string;
  total: number;
  selesai: number;
  lewatSla: number;
  dalamSla: number;
}

function isClosed(c: ComplaintCase): boolean {
  return !WORKFLOW_STATES[deriveWorkflowState(c)].isOpen;
}

function buildBreakdown(cases: ComplaintCase[]): PlatformBreakdown[] {
  const map = new Map<string, PlatformBreakdown>();
  for (const c of cases) {
    const key = c.platformUserId ? c.platform : "Tanpa Pialang User ID";
    const row = map.get(key) ?? { platform: key, total: 0, selesai: 0, lewatSla: 0, dalamSla: 0 };
    row.total += 1;
    if (isClosed(c)) {
      row.selesai += 1;
    } else if (c.slaStatus === "Lewat SLA") {
      row.lewatSla += 1;
    } else {
      row.dalamSla += 1;
    }
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function StackedBar({ row, max }: { row: PlatformBreakdown; max: number }) {
  const pct = (n: number) => (max === 0 ? 0 : Math.max((n / max) * 100, n > 0 ? 2 : 0));
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted-bg">
      {row.selesai > 0 && (
        <div
          className="h-full bg-green first:rounded-l-full"
          style={{ width: `${pct(row.selesai)}%` }}
          title={`Selesai: ${row.selesai}`}
        />
      )}
      {row.dalamSla > 0 && (
        <div
          className="h-full bg-amber"
          style={{ width: `${pct(row.dalamSla)}%` }}
          title={`Belum Selesai & Dalam SLA: ${row.dalamSla}`}
        />
      )}
      {row.lewatSla > 0 && (
        <div
          className="h-full bg-red last:rounded-r-full"
          style={{ width: `${pct(row.lewatSla)}%` }}
          title={`Belum Selesai & Lewat SLA: ${row.lewatSla}`}
        />
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const cases = useCasesData(CASES);
  const total = cases.length;
  const selesai = cases.filter(isClosed).length;
  const lewatSla = cases.filter((c) => !isClosed(c) && c.slaStatus === "Lewat SLA").length;
  const dalamSla = total - selesai - lewatSla;

  const breakdown = buildBreakdown(cases);
  const maxTotal = Math.max(...breakdown.map((r) => r.total), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard Admin"
        description="Jumlah pengaduan dibandingkan dengan platform (termasuk pengaduan tanpa ID platform), beserta status penyelesaian dan kepatuhan SLA."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Jumlah Pengaduan" value={total} icon={FileText} tone="navy" />
        <KpiCard label="Pengaduan Selesai" value={selesai} icon={CheckCircle2} tone="green" />
        <KpiCard label="Belum Selesai & Lewat SLA" value={lewatSla} icon={AlertTriangle} tone="red" />
        <KpiCard label="Belum Selesai & Dalam SLA" value={dalamSla} icon={Clock} tone="amber" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-navy">Pengaduan per Platform</h2>
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-green inline-block" /> Selesai</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-amber inline-block" /> Dalam SLA</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-red inline-block" /> Lewat SLA</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {breakdown.map((row) => (
            <div key={row.platform} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-medium text-foreground truncate">{row.platform}</span>
                <span className="text-[11px] text-muted shrink-0">
                  {row.total} pengaduan &middot; {row.selesai} selesai &middot; {row.dalamSla} dalam SLA &middot; {row.lewatSla} lewat SLA
                </span>
              </div>
              <StackedBar row={row} max={maxTotal} />
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted">Belum ada data pengaduan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
