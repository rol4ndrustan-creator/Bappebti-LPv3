import * as React from "react";
import { ComplaintCase } from "@/lib/types";
import { getStatusExplanation } from "@/lib/workflow-config";
import { CaseStatusBadge } from "./case-status-badge";
import { SourceBadge } from "./source-badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Answers the four questions every case screen must address (Section 2.1):
 * what is happening, who must act, what action is required, and by when.
 */
export function CaseStatusExplanation({
  complaintCase,
  viewer = "public",
  actions,
}: {
  complaintCase: ComplaintCase;
  viewer?: "public" | "internal";
  /** Optional standalone action buttons, right-aligned in the banner's header row (internal viewers only). */
  actions?: React.ReactNode;
}) {
  const ex = getStatusExplanation(complaintCase, viewer);

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        ex.actionRequiredFromViewer ? "border-amber/40 bg-amber-bg/40" : "border-border bg-card"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CaseStatusBadge complaintCase={complaintCase} />
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
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{ex.what}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <dl className="space-y-2">
          <div>
            <dt className="text-muted">Siapa yang menangani</dt>
            <dd className="font-medium text-foreground">{ex.who}</dd>
          </div>
          <div>
            <dt className="text-muted">Batas waktu</dt>
            <dd className="font-medium text-foreground">{ex.deadline}</dd>
          </div>
        </dl>
        <dl className="space-y-2">
          <div>
            <dt className="text-muted">Tindakan yang diperlukan</dt>
            <dd className="font-medium text-foreground">{ex.action}</dd>
          </div>
          <div>
            <dt className="text-muted">Sumber Pengaduan</dt>
            <dd className="mt-0.5">
              <SourceBadge source={complaintCase.source} withDescription />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
