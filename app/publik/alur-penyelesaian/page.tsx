import { PageHeader } from "@/components/shared/page-header";
import { DisputeFlowDiagram } from "@/components/shared/dispute-flow-diagram";

export default function AlurPenyelesaianPage() {
  return (
    <div>
      <PageHeader
        title="Alur Penyelesaian Perselisihan"
        description="Bagaimana pengaduan Anda sebagai nasabah Perdagangan Berjangka Komoditi (PBK) ditangani: dari verifikasi, musyawarah dengan Pialang, mediasi oleh Bursa, hingga pilihan Pengadilan atau BAKTI."
      />
      <DisputeFlowDiagram />
    </div>
  );
}
