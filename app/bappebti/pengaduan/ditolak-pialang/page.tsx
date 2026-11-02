"use client";

import { PageHeader } from "@/components/shared/page-header";
import { LifecycleQueue } from "@/components/shared/lifecycle-queue";

export default function VerifikasiDitolakPialangPage() {
  return (
    <div>
      <PageHeader
        title="Verifikasi Ditolak Pialang"
        description="Review gate Bappebti atas komplain yang ditolak Pialang: Kembalikan ke Pialang (wajib musyawarah) atau Setujui Penolakan (Rejected + notifikasi resmi ke nasabah)."
      />
      <LifecycleQueue statuses={["Pengajuan Reject"]} detailHref={(t) => `/bappebti/kasus/${t}`} mode="bappebti-review" />
    </div>
  );
}
