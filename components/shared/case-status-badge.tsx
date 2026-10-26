import { Badge } from "@/components/ui/badge";
import { ComplaintCase } from "@/lib/types";
import { WORKFLOW_STATES, deriveWorkflowState, getPublicStatus } from "@/lib/workflow-config";
import { DISPUTE_STAGES } from "@/lib/dispute-workflow";

export function CaseStatusBadge({ complaintCase }: { complaintCase: ComplaintCase }) {
  const tone = complaintCase.dispute
    ? DISPUTE_STAGES[complaintCase.dispute.stage].badgeTone
    : WORKFLOW_STATES[deriveWorkflowState(complaintCase)].badgeTone;
  return <Badge variant={tone}>{getPublicStatus(complaintCase).toUpperCase()}</Badge>;
}
