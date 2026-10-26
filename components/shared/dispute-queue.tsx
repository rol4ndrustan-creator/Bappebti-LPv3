"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ComplaintCase, DisputeStage } from "@/lib/types";
import { getSlaTone } from "@/lib/format";
import { formatMockDateTime } from "@/lib/clarification-workflow";
import {
  DISPUTE_STAGES,
  DisputeActor,
  deadlineStatus,
  describeRemaining,
  getDisputeActionOwner,
  getDisputeDeadlines,
  getPialangClarificationStatus,
} from "@/lib/dispute-workflow";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/**
 * Antrean kasus Mekanisme Penanganan Perselisihan Nasabah PBK, dengan filter
 * per tahap dan tenggat terdekat dalam hari kerja.
 */
export function DisputeQueue({
  cases,
  stages,
  detailHref,
  highlightActor,
}: {
  cases: ComplaintCase[];
  /** Tahap yang ditampilkan sebagai chip filter (urutannya mengikuti bagan). */
  stages: DisputeStage[];
  detailHref: (ticket: string) => string;
  /** Tandai baris yang menunggu tindakan pihak ini. */
  highlightActor?: DisputeActor;
}) {
  const [stage, setStage] = React.useState<DisputeStage | "">("");
  const disputes = cases.filter((c) => c.dispute && stages.includes(c.dispute.stage));
  const filtered = stage ? disputes.filter((c) => c.dispute!.stage === stage) : disputes;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip active={stage === ""} onClick={() => setStage("")} label="Semua" count={disputes.length} />
        {stages.map((s) => (
          <Chip
            key={s}
            active={stage === s}
            onClick={() => setStage(s)}
            label={DISPUTE_STAGES[s].label}
            count={disputes.filter((c) => c.dispute!.stage === s).length}
          />
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiket</TableHead>
            <TableHead>Pengaduan</TableHead>
            <TableHead>Pialang</TableHead>
            <TableHead>Tahap</TableHead>
            <TableHead>Wajib Bertindak</TableHead>
            <TableHead>Tenggat Terdekat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const d = c.dispute!;
            const cfg = DISPUTE_STAGES[d.stage];
            const owner = getDisputeActionOwner(d);
            const next = getDisputeDeadlines(d).find((x) => !x.done);
            const status = next ? deadlineStatus(next.deadline, false) : null;
            const deemed = d.stage === "VERIFIKASI" && getPialangClarificationStatus(d) === "Dianggap Menyetujui Pengaduan";
            return (
              <TableRow key={c.ticket} className={cn(highlightActor && owner === highlightActor && "bg-amber-bg/30")}>
                <TableCell className="font-medium text-navy whitespace-nowrap">{c.ticket}</TableCell>
                <TableCell className="max-w-[220px]">
                  <p className="truncate">{c.title}</p>
                  <p className="text-[11px] text-muted">{c.reporterName}</p>
                </TableCell>
                <TableCell className="text-muted whitespace-nowrap">{c.platform}</TableCell>
                <TableCell>
                  <Badge variant={cfg.badgeTone}>{cfg.label.toUpperCase()}</Badge>
                  {deemed && <p className="text-[10px] text-red mt-0.5">Pialang dianggap menyetujui</p>}
                </TableCell>
                <TableCell className="whitespace-nowrap">{owner ?? "-"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {next ? (
                    <>
                      <p>{formatMockDateTime(next.deadline)}</p>
                      <p className="text-[11px] text-muted">{describeRemaining(next.deadline)}</p>
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{status ? <Badge variant={getSlaTone(status)}>{status.toUpperCase()}</Badge> : <Badge variant="muted">-</Badge>}</TableCell>
                <TableCell>
                  <Link href={detailHref(c.ticket)} className="text-navy inline-flex items-center gap-1 hover:underline whitespace-nowrap">
                    Detail <ArrowRight className="size-3" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted py-6">
                Tidak ada perselisihan pada tahap ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "bg-navy text-white border-navy" : "bg-card text-foreground border-border hover:bg-muted-bg"
      )}
    >
      {label} <span className={cn("ml-1", active ? "text-white/80" : "text-muted")}>{count}</span>
    </button>
  );
}
