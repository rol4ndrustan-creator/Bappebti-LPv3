"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, SlaBadge } from "@/components/shared/badges";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CASES, formatCurrency } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { useEkosistemActiveRole } from "@/lib/ekosistem-active-role";
import { useQueryParamState, useCurrentPathWithQuery } from "@/lib/use-query-param";
import { SourceBadge } from "@/components/shared/source-badge";

function EkosistemActivePengaduanContent() {
  const { roleType } = useEkosistemActiveRole();
  const baseCases = useMemo(() => CASES.filter((c) => c.currentOwner === roleType), [roleType]);
  const allCases = useCasesData(baseCases).filter((c) => c.currentOwner === roleType);
  const [search, setSearch] = useQueryParamState("q");
  const from = encodeURIComponent(useCurrentPathWithQuery());

  const cases = allCases.filter(
    (c) => !search || c.ticket.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Manajemen Pengaduan"
        description={`Kasus sengketa aktif yang dialihkan untuk dikoordinasikan — konteks saat ini: ${roleType}.`}
      />

      <div className="mb-3 w-full max-w-xs">
        <Label>Cari</Label>
        <Input placeholder="Nomor tiket atau judul..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiket</TableHead>
            <TableHead>Sumber Pengaduan</TableHead>
            <TableHead>Pengaduan</TableHead>
            <TableHead>Entitas Pengoordinasi</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Nilai Transaksi</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow key={c.ticket}>
              <TableCell className="font-medium text-navy">{c.ticket}</TableCell>
              <TableCell>
                <SourceBadge source={c.source} />
              </TableCell>
              <TableCell className="max-w-[220px] truncate">{c.title}</TableCell>
              <TableCell className="text-muted whitespace-nowrap">{c.currentOwner}</TableCell>
              <TableCell className="text-muted">{c.category}</TableCell>
              <TableCell><StatusBadge status={c.status} /></TableCell>
              <TableCell><SlaBadge sla={c.slaStatus} /></TableCell>
              <TableCell className="text-muted whitespace-nowrap">{formatCurrency(c.amount)}</TableCell>
              <TableCell>
                <Link href={`/ekosistem/active/kasus/${c.ticket}?from=${from}`}>
                  <Button variant="outline" size="sm">Kelola</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted py-6">
                Tidak ada kasus yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function EkosistemActivePengaduanPage() {
  return (
    <Suspense fallback={null}>
      <EkosistemActivePengaduanContent />
    </Suspense>
  );
}
