import { Badge } from "@/components/ui/badge";
import { ComplaintCase } from "@/lib/types";
import { WORKFLOW_STATES, deriveWorkflowState, getPublicStatus } from "@/lib/workflow-config";

export function CaseStatusBadge({ complaintCase }: { complaintCase: ComplaintCase }) {
  const tone = WORKFLOW_STATES[deriveWorkflowState(complaintCase)].badgeTone;
  return <Badge variant={tone}>{getPublicStatus(complaintCase).toUpperCase()}</Badge>;
}
