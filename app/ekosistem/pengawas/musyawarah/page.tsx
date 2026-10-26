"use client";

import { PageHeader } from "@/components/shared/page-header";
import { MusyawarahModule } from "@/components/shared/musyawarah";

export default function MusyawarahPage() {
  return (
    <div>
      <PageHeader
        title="Musyawarah"
        description="Pemantauan (read-only) jadwal, kehadiran, dan hasil seluruh pertemuan musyawarah."
      />
      <MusyawarahModule detailHref={(t) => `/ekosistem/pengawas/kasus/${t}`} readOnly={true} />
    </div>
  );
}
