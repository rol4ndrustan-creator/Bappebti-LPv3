"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LifecycleQueue } from "@/components/shared/lifecycle-queue";
import { useBusinessParams } from "@/lib/mock-service/params-store";

export default function VerifikasiKomplainBaruPage() {
  const params = useBusinessParams();
  return (
    <div>
      <PageHeader
        title="Verifikasi Komplain Baru"
        description={`Tiket masuk yang dialamatkan ke Pialang. Setujui untuk melanjutkan ke musyawarah atau tolak dengan alasan & bukti PDF. Tanpa keputusan dalam ${params.slaReviewPialangBusinessDays} hari kerja, komplain otomatis disetujui.`}
      />
      <LifecycleQueue statuses={["Menunggu Verifikasi Pialang"]} detailHref={(t) => `/platform/kasus/${t}`} mode="pialang-review" />
    </div>
  );
}
