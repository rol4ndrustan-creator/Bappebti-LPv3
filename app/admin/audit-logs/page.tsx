"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AuditLogView } from "@/components/shared/audit-log-view";

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Rekam jejak seluruh aktivitas operasional lintas portal (Bappebti, Platform, Ekosistem Active, Ekosistem Pengawas) untuk kepentingan kepatuhan."
      />
      <AuditLogView detailHref={(t) => `/bappebti/kasus/${t}`} />
    </div>
  );
}
