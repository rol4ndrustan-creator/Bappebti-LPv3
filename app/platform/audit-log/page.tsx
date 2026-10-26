"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AuditLogView } from "@/components/shared/audit-log-view";

const PORTALS = ["Platform"] as const;

export default function AuditLogPage() {
  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Rekam jejak aktivitas operasional pengguna portal Platform untuk kepentingan kepatuhan (security & compliance)."
      />
      <AuditLogView portals={[...PORTALS]} detailHref={(t) => `/platform/kasus/${t}`} />
    </div>
  );
}
