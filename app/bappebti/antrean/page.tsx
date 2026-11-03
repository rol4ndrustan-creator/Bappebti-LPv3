"use client";

import { PageHeader } from "@/components/shared/page-header";
import { FilterableCaseList } from "@/components/shared/filterable-case-list";
import { CASES } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";

export default function SemuaPengaduanPage() {
  const cases = useCasesData(CASES);

  return (
    <div>
      <PageHeader
        title="Semua Pengaduan"
        description="Daftar seluruh kasus pengaduan yang dapat difilter berdasarkan pialang, kategori, prioritas, dan pelapor."
      />
      <FilterableCaseList cases={cases} />
    </div>
  );
}
