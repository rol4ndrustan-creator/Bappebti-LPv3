import { ClarificationRequest } from "@/lib/types";
import { ClarificationViewer, getViewerRelation } from "@/lib/clarification-workflow";
import { ClarificationResponseForm, ResponseDraftShape } from "./response-form";
import { ClarificationAttachmentList } from "./attachment-list";
import { ClarificationStatusBadge } from "./badges";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquareText } from "lucide-react";

const ANSWERABLE = ["SENT", "WAITING_RESPONSE", "PARTIALLY_RESPONDED", "REVISION_REQUESTED", "OVERDUE"];

/** Section 7 — routes to the response editor, the submitted-response view, or a waiting state, based on role and status. */
export function ClarificationResponsePanel({
  clarification,
  viewer,
  defaultOfficer,
  onSaveDraft,
  onSubmit,
}: {
  clarification: ClarificationRequest;
  viewer: ClarificationViewer;
  defaultOfficer: string;
  onSaveDraft: (raw: string) => void;
  onSubmit: (draft: ResponseDraftShape) => void;
}) {
  const relation = getViewerRelation(clarification, viewer);
  const isActor = relation === "actor";
  const answerable = ANSWERABLE.includes(clarification.status);

  if (isActor && answerable) {
    return (
      <ClarificationResponseForm
        clarification={clarification}
        defaultOfficer={defaultOfficer}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />
    );
  }

  if (clarification.formalResponse) {
    const r = clarification.formalResponse;
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-navy">{r.summary}</p>
            <ClarificationStatusBadge status={clarification.status} />
          </div>
          <p className="text-sm text-foreground/90">{r.detailedExplanation}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mt-3">
            <div>
              <dt className="text-muted">Dikirim Oleh</dt>
              <dd className="font-medium">{r.respondingOfficer}</dd>
            </div>
            <div>
              <dt className="text-muted">Waktu Pengiriman</dt>
              <dd className="font-medium">{r.submittedAt}</dd>
            </div>
            {r.referencedTransaction && (
              <div>
                <dt className="text-muted">Nomor Akun Transaksi</dt>
                <dd className="font-medium">{r.referencedTransaction}</dd>
              </div>
            )}
            {r.supervisorApproval && (
              <div>
                <dt className="text-muted">Disetujui Supervisor</dt>
                <dd className="font-medium">{r.supervisorApproval}</dd>
              </div>
            )}
          </dl>
          {r.factsConfirmed && (
            <p className="text-xs text-foreground/80 mt-2">
              <span className="text-muted">Dikonfirmasi: </span>
              {r.factsConfirmed}
            </p>
          )}
          {r.factsNotConfirmed && (
            <p className="text-xs text-foreground/80 mt-1">
              <span className="text-muted">Belum dikonfirmasi: </span>
              {r.factsNotConfirmed}
            </p>
          )}
        </div>
        {clarification.reviewerComments && (
          <div className="rounded-md border border-border bg-muted-bg/50 px-3 py-2 text-xs">
            <p className="text-muted">Catatan peninjau</p>
            <p className="text-foreground/80 mt-0.5">{clarification.reviewerComments}</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">Lampiran Respons</p>
          <ClarificationAttachmentList attachments={clarification.responseAttachments} />
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      icon={MessageSquareText}
      title="Belum ada respons"
      description={
        isActor
          ? "Klarifikasi ini menunggu tindakan Anda."
          : "Menunggu respons dari pihak yang diminta memberikan klarifikasi."
      }
    />
  );
}
