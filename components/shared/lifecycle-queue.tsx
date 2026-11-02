"use client";

import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { useLifecycleViews } from "@/lib/mock-service/lifecycle-store";
import { TICKET_STATUS_TONE } from "@/lib/ticket-lifecycle";
import { formatWIB } from "@/lib/case-pdf";
import { TicketStatus } from "@/lib/types";
import { SourceBadge } from "@/components/shared/source-badge";
import { ArrowRight } from "lucide-react";

/** Antrean tiket berdasarkan status siklus (Verifikasi Komplain Baru / Verifikasi Ditolak Pialang). */
export function LifecycleQueue({
  statuses,
  detailHref,
  mode,
}: {
  statuses: TicketStatus[];
  detailHref: (ticket: string) => string;
  mode: "pialang-review" | "bappebti-review";
}) {
  const cases = useCasesData(CASES);
  const get = useLifecycleViews();
  const loading = !get(CASES[0]);
  const rows = cases
    .map((c) => ({ c, v: get(c) }))
    .filter((r) => r.v && statuses.includes(r.v.status))
    .sort((a, b) => a.v!.lc.submittedAt.localeCompare(b.v!.lc.submittedAt));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tiket</TableHead>
          <TableHead>Pengaduan</TableHead>
          <TableHead>Pialang Terlapor</TableHead>
          <TableHead>Sumber</TableHead>
          <TableHead>Status Tiket</TableHead>
          <TableHead>{mode === "pialang-review" ? "Batas Review Pialang" : "Alasan Penolakan Pialang"}</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ c, v }) => (
          <TableRow key={c.ticket}>
            <TableCell className="font-medium text-navy whitespace-nowrap">{c.ticket}</TableCell>
            <TableCell className="max-w-[240px]">
              <p className="truncate">{c.title}</p>
              <p className="text-[11px] text-muted">
                {c.reporterName} · terbit {formatWIB(new Date(v!.lc.submittedAt))} WIB
              </p>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {c.platform}
              {v!.lc.respondent && <p className="text-[11px] text-muted">{v!.lc.respondent.position}: {v!.lc.respondent.name}</p>}
            </TableCell>
            <TableCell>
              <SourceBadge source={c.source} />
            </TableCell>
            <TableCell>
              <Badge variant={TICKET_STATUS_TONE[v!.status]}>{v!.status.toUpperCase()}</Badge>
            </TableCell>
            <TableCell className="text-xs">
              {mode === "pialang-review" ? (
                <span className="whitespace-nowrap">{formatWIB(v!.pialangDeadline)} WIB</span>
              ) : (
                <>
                  <p className="font-medium">{v!.lc.pialangReview?.reason}</p>
                  <p className="text-[11px] text-muted">{v!.lc.pialangReview?.document}</p>
                </>
              )}
            </TableCell>
            <TableCell>
              <Link href={detailHref(c.ticket)} className="text-navy inline-flex items-center gap-1 hover:underline whitespace-nowrap">
                {mode === "pialang-review" ? "Verifikasi" : "Review"} <ArrowRight className="size-3" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted py-6">
              {loading ? "Memuat..." : "Tidak ada tiket pada antrean ini."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
