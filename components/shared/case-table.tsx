import Link from "next/link";
import { TicketLink } from "@/components/shared/ticket-link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SeverityBadge, StatusBadge, OwnerBadge, SlaBadge } from "@/components/shared/badges";
import { ComplaintCase } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { SourceBadge } from "@/components/shared/source-badge";
import { TicketStatusBadge } from "@/components/shared/ticket-lifecycle";

/** Shared case list table used across every Manajemen Pengaduan view — every row always links to the full case detail page. */
export function CaseTable({ cases }: { cases: ComplaintCase[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tiket</TableHead>
            <TableHead>Sumber Pengaduan</TableHead>
          <TableHead>Pengaduan</TableHead>
          <TableHead>Nama Pelapor</TableHead>
          <TableHead>Email Pelapor</TableHead>
          <TableHead>Pialang</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Prioritas</TableHead>
          <TableHead>Status Tiket</TableHead>
          <TableHead>Penanggung Jawab</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.ticket}>
            <TableCell><TicketLink ticket={c.ticket} href={`/bappebti/kasus/${c.ticket}`} /></TableCell>
              <TableCell>
                <SourceBadge source={c.source} />
              </TableCell>
            <TableCell className="min-w-[200px] max-w-[280px]">
                <span className="line-clamp-2" title={c.title}>{c.title}</span>
              </TableCell>
            <TableCell className="whitespace-nowrap">{c.reporterName}</TableCell>
            <TableCell className="text-muted whitespace-nowrap">{c.reporter?.verifiedEmail ?? "-"}</TableCell>
            <TableCell className="text-muted whitespace-nowrap">{c.platform}</TableCell>
            <TableCell className="text-muted whitespace-nowrap">{c.category}</TableCell>
            <TableCell>
              <SeverityBadge severity={c.severity} />
            </TableCell>
            <TableCell>
              <TicketStatusBadge complaintCase={c} />
            </TableCell>
            <TableCell>
              <OwnerBadge owner={c.currentOwner} />
            </TableCell>
            <TableCell>
              <SlaBadge sla={c.slaStatus} />
            </TableCell>
            <TableCell>
              <Link
                href={`/bappebti/kasus/${c.ticket}`}
                className="text-navy inline-flex items-center gap-1 hover:underline whitespace-nowrap"
              >
                Detail <ArrowRight className="size-3" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {cases.length === 0 && (
          <TableRow>
            <TableCell colSpan={12} className="text-center text-muted py-6">
              Tidak ada kasus pada kategori ini.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
