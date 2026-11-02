"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ArbitrationModule } from "@/components/shared/arbitration-module";

export default function ProsesPenyelesaianKhususPage() {
  return (
    <div>
      <PageHeader
        title="Proses Penyelesaian Khusus (BAKTI)"
        description="Portofolio arbitrase BAKTI: verifikasi permohonan nasabah, pencatatan sidang, dan putusan akhir (Close Arbitrase)."
      />
      <ArbitrationModule readOnly={false} detailHref={(t) => `/ekosistem/pengawas/kasus/${t}`} />
    </div>
  );
}
