"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DisputeQueue } from "@/components/shared/dispute-queue";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";

export default function MusyawarahPlatformPage() {
  const cases = useCasesData(CASES);

  return (
    <div>
      <PageHeader
        title="Klarifikasi & Musyawarah Nasabah"
        description="Klarifikasi pengaduan baru (maks. 1 hari kerja — lewat tanpa klarifikasi berarti Pialang dianggap menyetujui), musyawarah 21 hari kerja (perpanjangan maks. 14 hari), dan penyampaian dokumen kesepakatan/akta perdamaian ke Bappebti."
      />
      <DisputeQueue
        cases={cases}
        stages={["VERIFIKASI", "MUSYAWARAH", "PENYAMPAIAN_KESEPAKATAN"]}
        detailHref={(t) => `/platform/kasus/${t}`}
        highlightActor="Pialang"
      />
    </div>
  );
}
