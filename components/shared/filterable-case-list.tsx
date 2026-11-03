"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CaseTable } from "@/components/shared/case-table";
import { ComplaintCase, Severity } from "@/lib/types";

const SEVERITY_LIST: Severity[] = ["Rendah", "Sedang", "Tinggi", "Kritis"];

/** Filter bar + table used by every Manajemen Pengaduan submenu — scope the `cases` prop to the submenu's own rule, this adds search/platform/category/severity on top. */
export function FilterableCaseList({ cases }: { cases: ComplaintCase[] }) {
  const [search, setSearch] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [severity, setSeverity] = React.useState("");

  const platforms = React.useMemo(() => Array.from(new Set(cases.map((c) => c.platform))).sort(), [cases]);
  const categories = React.useMemo(() => Array.from(new Set(cases.map((c) => c.category))).sort(), [cases]);

  const filtered = React.useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.ticket.toLowerCase().includes(search.toLowerCase()) ||
        c.reporterName.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = !platform || c.platform === platform;
      const matchesCategory = !category || c.category === category;
      const matchesSeverity = !severity || c.severity === severity;
      return matchesSearch && matchesPlatform && matchesCategory && matchesSeverity;
    });
  }, [cases, search, platform, category, severity]);

  function resetFilters() {
    setSearch("");
    setPlatform("");
    setCategory("");
    setSeverity("");
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs">
            <Label>Cari</Label>
            <Input placeholder="Tiket, judul, atau pelapor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-56">
            <Label>Pialang</Label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Semua pialang</option>
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="w-56">
            <Label>Kategori</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Label>Prioritas</Label>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">Semua prioritas</option>
              {SEVERITY_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Reset Filter
          </Button>
        </div>
      </div>

      <CaseTable cases={filtered} />
    </div>
  );
}
