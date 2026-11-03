"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LifecycleQueue } from "@/components/shared/lifecycle-queue";

export default function TriasePengaduanPage() {
  return (
    <div>
      <PageHeader
        title="Triase Pengaduan"
        description="Pengaduan yang pelapornya belum mengetahui nama Pialang. Analisis lalu teruskan (assign) ke Pialang terkait, minta perbaikan berkas, atau tolak pengaduan."
      />
      <LifecycleQueue statuses={["Triase Bappebti"]} detailHref={(t) => `/bappebti/kasus/${t}`} mode="triage" />
    </div>
  );
}
