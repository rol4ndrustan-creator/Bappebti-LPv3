"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DisputeQueue } from "@/components/shared/dispute-queue";
import { DisputeFlowDiagram } from "@/components/shared/dispute-flow-diagram";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { DisputeStage } from "@/lib/types";

const ALL_STAGES: DisputeStage[] = [
  "VERIFIKASI",
  "PERBAIKAN_FORMIL",
  "DITOLAK_MATERIIL",
  "MUSYAWARAH",
  "MEDIASI_BURSA",
  "LAPOR_HASIL_MEDIASI",
  "PENYAMPAIAN_KESEPAKATAN",
  "PILIHAN_PENYELESAIAN",
  "PENGADILAN_BAKTI",
  "SELESAI",
];

export default function PerselisihanBappebtiPage() {
  const cases = useCasesData(CASES);

  return (
    <div>
      <PageHeader
        title="Perselisihan Nasabah PBK"
        description="Pemantauan seluruh perselisihan sesuai Mekanisme Penanganan Perselisihan Nasabah PBK — verifikasi, musyawarah, mediasi, kesepakatan, hingga Pengadilan/BAKTI."
      />
      <div className="mb-4">
        <DisputeFlowDiagram />
      </div>
      <DisputeQueue cases={cases} stages={ALL_STAGES} detailHref={(t) => `/bappebti/kasus/${t}`} highlightActor="Bappebti" />
    </div>
  );
}
