"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, SlaBadge } from "@/components/shared/badges";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { useQueryParamState, useCurrentPathWithQuery } from "@/lib/use-query-param";
import { SourceBadge } from "@/components/shared/source-badge";

function EkosistemPengawasPengaduanContent() {
  const allCases = useCasesData(CASES);
  const [search, setSearch] = useQueryParamState("q");
  const from = encodeURIComponent(useCurrentPathWithQuery());

  const cases = allCases.filter(
    (c) =>
      !search ||
      c.ticket.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Manajemen Pengaduan"
        description="Pemantauan agregat pengaduan masyarakat secara nasional (read-only) untuk keperluan pengawasan kepatuhan industri."
      />

      <div className="mb-3 w-full max-w-xs">
        <Label>Cari</Label>
        <Input placeholder="Nomor tiket, judul, atau pelaku usaha..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiket</TableHead>
            <TableHead>Sumber Pengaduan</TableHead>
            <TableHead>Pengaduan</TableHead>
            <TableHead>Pelaku Usaha</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
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
              <TableCell className="text-muted max-w-[180px] truncate">{c.platform}</TableCell>
              <TableCell className="text-muted">{c.category}</TableCell>
              <TableCell><StatusBadge status={c.status} /></TableCell>
              <TableCell><SlaBadge sla={c.slaStatus} /></TableCell>
              <TableCell>
                <Link href={`/ekosistem/pengawas/kasus/${c.ticket}?from=${from}`}>
                  <Button variant="outline" size="sm">Lihat</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted py-6">
                Tidak ada kasus yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function EkosistemPengawasPengaduanPage() {
  return (
    <Suspense fallback={null}>
      <EkosistemPengawasPengaduanContent />
    </Suspense>
  );
}
