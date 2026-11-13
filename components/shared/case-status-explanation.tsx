"use client";

import * as React from "react";
import { ComplaintCase } from "@/lib/types";
import { getStatusExplanation } from "@/lib/workflow-config";
import { CaseStatusBadge } from "./case-status-badge";
import { SourceBadge } from "./source-badge";
import { SlaCountdown } from "./ticket-lifecycle";
import { useLifecycleView } from "@/lib/mock-service/lifecycle-store";
import { TICKET_STATUS_TONE, lifecycleExplanation } from "@/lib/ticket-lifecycle";
import { formatWIB } from "@/lib/case-pdf";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Answers the four questions every case screen must address (Section 2.1):
 * what is happening, who must act, what action is required, and by when.
 */
export function CaseStatusExplanation({
  complaintCase,
  viewer = "public",
  facts,
  notes,
  primary,
  secondary,
}: {
  complaintCase: ComplaintCase;
  viewer?: "public" | "internal";
  /** Butir fakta tambahan (<div><dt/><dd/></div>) yang ikut grid ringkasan. */
  facts?: React.ReactNode;
  /** Catatan kontekstual siklus tiket, tampil di bawah grid. */
  notes?: React.ReactNode;
  /** Aksi utama (kiri) pada area aksi di bawah banner. */
  primary?: React.ReactNode;
  /** Aksi sekunder (kanan, lebih tenang) pada area aksi di bawah banner. */
  secondary?: React.ReactNode;
}) {
  const lifecycle = useLifecycleView(complaintCase);
  // Setelah siklus tiket termuat, kartu status mengikuti siklus tiket (List Revisi 12).
  const ex = lifecycle ? lifecycleExplanation(lifecycle, complaintCase, viewer, formatWIB) : getStatusExplanation(complaintCase, viewer);
  const hasActions = !!(primary || secondary);

  return (
    <section
      aria-label="Status dan tindakan tiket"
      className={cn(
        "rounded-lg border p-4 sm:p-5",
        ex.actionRequiredFromViewer ? "border-amber/40 bg-amber-bg/40" : "border-border bg-card"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {lifecycle ? <Badge variant={TICKET_STATUS_TONE[lifecycle.status]}>{lifecycle.status.toUpperCase()}</Badge> : <CaseStatusBadge complaintCase={complaintCase} />}
        {lifecycle && <SlaCountdown view={lifecycle} />}
        {ex.actionRequiredFromViewer ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber">
            <AlertCircle className="size-3.5" /> Tindakan diperlukan
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green">
            <CheckCircle2 className="size-3.5" /> Tidak ada tindakan yang diperlukan saat ini
          </span>
        )}
      </div>
      <p className="mt-3 max-w-[75ch] text-sm text-foreground leading-relaxed">{ex.what}</p>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs">
        <div>
          <dt className="text-muted">Penanggung jawab</dt>
          <dd className="font-medium text-foreground">{ex.who}</dd>
        </div>
        <div>
          <dt className="text-muted">Tindakan yang diperlukan</dt>
          <dd className="font-medium text-foreground">{ex.action}</dd>
        </div>
        <div>
          <dt className="text-muted">Batas waktu</dt>
          <dd className="font-medium text-foreground tabular-nums">{ex.deadline}</dd>
        </div>
        <div>
          <dt className="text-muted">Sumber pengaduan</dt>
          <dd className="mt-0.5">
            <SourceBadge source={complaintCase.source} withDescription />
          </dd>
        </div>
        {facts}
      </dl>
      {notes && <div className="mt-4 space-y-2 text-xs empty:hidden">{notes}</div>}
      {hasActions && (
        <div className="mt-4 flex flex-col gap-x-6 gap-y-3 border-t border-amber/25 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Mobile: tombol utama dua kolom selebar kartu; ≥sm: satu baris yang membungkus. */}
          <div className="grid grid-cols-2 gap-2 empty:hidden sm:flex sm:flex-wrap sm:items-center">{primary}</div>
          <div className="-ml-3 flex flex-wrap items-center gap-1 empty:hidden sm:ml-auto sm:-mr-3">{secondary}</div>
        </div>
      )}
    </section>
  );
}
