"use client";

import { PageHeader } from "@/components/shared/page-header";
import { FilterableCaseList } from "@/components/shared/filterable-case-list";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";

export default function PengaduanTanpaPlatformPage() {
  const cases = useCasesData(CASES).filter((c) => !c.platformUserId);

  return (
    <div>
      <PageHeader
        title="Pengaduan Tanpa Pialang User ID"
        description="Pengaduan yang masuk tanpa ID pengguna pialang terverifikasi — perlu diperiksa kelengkapan datanya sebelum diteruskan ke pelaku usaha terkait."
      />
      <FilterableCaseList cases={cases} />
    </div>
  );
}
