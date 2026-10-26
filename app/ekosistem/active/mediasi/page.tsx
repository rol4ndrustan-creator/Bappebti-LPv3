"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DisputeQueue } from "@/components/shared/dispute-queue";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";

export default function MediasiBursaPage() {
  const cases = useCasesData(CASES);

  return (
    <div>
      <PageHeader
        title="Mediasi Perselisihan Nasabah"
        description="Mediasi Bursa 21 hari kerja (perpanjangan maks. 14 hari), laporan hasil ke Bappebti dalam 1 hari kerja, penyampaian dokumen kesepakatan/akta perdamaian, dan penjelasan pilihan Pengadilan/BAKTI."
      />
      <DisputeQueue
        cases={cases}
        stages={["MEDIASI_BURSA", "LAPOR_HASIL_MEDIASI", "PENYAMPAIAN_KESEPAKATAN", "PILIHAN_PENYELESAIAN"]}
        detailHref={(t) => `/ekosistem/active/kasus/${t}`}
        highlightActor="Bursa"
      />
    </div>
  );
}
