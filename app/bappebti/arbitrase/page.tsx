"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ArbitrationModule } from "@/components/shared/arbitration-module";

export default function ArbitrasePemantauanPage() {
  return (
    <div>
      <PageHeader
        title="Pemantauan Arbitrase BAKTI"
        description="Pemantauan (read-only) seluruh tahapan Proses Penyelesaian Khusus BAKTI: pengajuan, sidang, dan putusan akhir."
      />
      <ArbitrationModule readOnly detailHref={(t) => `/bappebti/kasus/${t}`} />
    </div>
  );
}
