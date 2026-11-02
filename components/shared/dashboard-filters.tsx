"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/shared/toast-provider";
import { ComplaintCase } from "@/lib/types";
import { AGE_GROUPS, ageGroupOf, regionOf } from "@/lib/demographics";
import { useLifecycleViews } from "@/lib/mock-service/lifecycle-store";
import { logAudit } from "@/lib/mock-service/audit-store";
import { buildXlsx, downloadBytes } from "@/lib/xlsx-export";
import { formatWIB } from "@/lib/case-pdf";
import { FileDown, FileSpreadsheet } from "lucide-react";

/** Filter demografi pengadu (Kelompok Usia, Wilayah Domisili) — List Revisi 12 #8. */
export function useDashboardFilters(all: ComplaintCase[]) {
  const [age, setAge] = React.useState("");
  const [region, setRegion] = React.useState("");
  const regions = React.useMemo(() => Array.from(new Set(all.map(regionOf))).sort(), [all]);
  const cases = all.filter((c) => (!age || ageGroupOf(c.reporterAge) === age) && (!region || regionOf(c) === region));
  return { all, cases, age, setAge, region, setRegion, regions };
}

const HEADER = ["No. Tiket", "Judul", "Pialang", "Kategori", "Pelapor", "Usia", "Kelompok Usia", "Wilayah Domisili", "Status Tiket", "Sumber", "Nilai Transaksi (Rp)", "Tanggal Pengaduan"];

export function DashboardFilterBar({
  cases,
  all,
  age,
  setAge,
  region,
  setRegion,
  regions,
}: ReturnType<typeof useDashboardFilters>) {
  const { showToast } = useToast();
  const get = useLifecycleViews();
  const filterLabel = `Kelompok Usia: ${age || "Semua"} · Wilayah: ${region || "Semua"}`;

  function rows(): (string | number)[][] {
    return cases.map((c) => [
      c.ticket,
      c.title,
      c.platform,
      c.category,
      c.reporterName,
      c.reporterAge ?? "-",
      ageGroupOf(c.reporterAge),
      regionOf(c),
      get(c)?.status ?? "-",
      c.source ?? "Bappebti",
      c.amount ?? 0,
      c.createdAt,
    ]);
  }

  function exportXlsx() {
    downloadBytes(buildXlsx("Data Sengketa", HEADER, rows()), "Data-Sengketa-Bappebti.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    logAudit({ activity: "Ekspor Data Dashboard (XLSX)", detail: `${cases.length} kasus diekspor. Filter: ${filterLabel}.` });
    showToast(`${cases.length} data sengketa diekspor ke XLSX.`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Data Sengketa — Dashboard Eksekutif Bappebti", 14, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`${filterLabel} · ${cases.length} kasus · Diekspor ${formatWIB(new Date())} WIB`, 14, 21);
    const cols = [0, 1, 2, 4, 6, 7, 8, 10];
    const widths = [30, 62, 44, 34, 24, 34, 36, 24];
    let y = 29;
    const drawRow = (vals: (string | number)[], bold: boolean) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      let x = 14;
      cols.forEach((ci, i) => {
        const v = ci === 10 && typeof vals[ci] === "number" ? Number(vals[ci]).toLocaleString("id-ID") : String(vals[ci]);
        doc.text((doc.splitTextToSize(v.replace(/[^\x00-\xFF]/g, "-"), widths[i] - 2) as string[])[0], x, y);
        x += widths[i];
      });
      y += 6;
      if (y > 195) {
        doc.addPage();
        y = 15;
      }
    };
    drawRow(HEADER, true);
    rows().forEach((r) => drawRow(r, false));
    doc.save("Data-Sengketa-Bappebti.pdf");
    logAudit({ activity: "Ekspor Data Dashboard (PDF)", detail: `${cases.length} kasus diekspor. Filter: ${filterLabel}.` });
    showToast(`${cases.length} data sengketa diekspor ke PDF.`);
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-3 flex flex-wrap items-end gap-3">
      <div className="w-48">
        <Label>Kelompok Usia Pengadu</Label>
        <Select value={age} onChange={(e) => setAge(e.target.value)}>
          <option value="">Semua usia</option>
          {AGE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-56">
        <Label>Wilayah / Lokasi Domisili</Label>
        <Select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Semua wilayah</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-muted self-center">
        Menampilkan <span className="font-semibold text-foreground">{cases.length}</span> dari {all.length} kasus
      </p>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="secondary" onClick={exportXlsx}>
          <FileSpreadsheet className="size-3.5" /> Export XLSX
        </Button>
        <Button size="sm" variant="secondary" onClick={exportPdf}>
          <FileDown className="size-3.5" /> Export PDF
        </Button>
      </div>
    </div>
  );
}
