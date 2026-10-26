"use client";

import { PageHeader } from "@/components/shared/page-header";
import { MusyawarahModule } from "@/components/shared/musyawarah";

export default function MusyawarahPage() {
  return (
    <div>
      <PageHeader
        title="Musyawarah"
        description="Jadwal dan catatan hasil seluruh pertemuan musyawarah lintas tiket pengaduan."
      />
      <MusyawarahModule detailHref={(t) => `/platform/kasus/${t}`} readOnly={false} />
    </div>
  );
}
