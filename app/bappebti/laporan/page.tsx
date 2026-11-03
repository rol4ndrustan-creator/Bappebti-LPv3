"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import {
  FileBarChart,
  Gauge,
  Users,
  ShieldAlert,
  MessageSquareWarning,
  History,
  Download,
} from "lucide-react";

const REPORTS = [
  {
    title: "Executive Summary Report",
    description: "Ringkasan eksekutif kondisi penanganan pengaduan lintas pialang, bursa, dan kliring.",
    icon: FileBarChart,
  },
  {
    title: "SLA Compliance Report",
    description: "Laporan kepatuhan SLA atas seluruh kasus pengaduan yang ditangani.",
    icon: Gauge,
  },
  {
    title: "Member Performance Report",
    description: "Laporan kinerja penanganan pengaduan oleh masing-masing anggota terdaftar.",
    icon: Users,
  },
  {
    title: "Risk & Fraud Pattern Report",
    description: "Laporan deteksi pola risiko sistemik dan indikasi fraud pada periode tertentu.",
    icon: ShieldAlert,
  },
  {
    title: "Public Feedback Report",
    description: "Ringkasan kritik dan masukan publik beserta status tindak lanjutnya.",
    icon: MessageSquareWarning,
  },
  {
    title: "Audit Trail Report",
    description: "Riwayat lengkap tindakan dan perubahan status pada seluruh kasus pengaduan.",
    icon: History,
  },
];

export default function LaporanEksporPage() {
  const { showToast } = useToast();

  return (
    <div>
      <PageHeader
        title="Laporan & Ekspor"
        description="Unduh laporan terstruktur untuk kebutuhan pengawasan, evaluasi kinerja, dan pelaporan internal Bappebti."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-navy" />
                  <CardTitle>{r.title}</CardTitle>
                </div>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => showToast(`Laporan ${r.title} sedang disiapkan (demo)`)}
                >
                  <Download className="size-4" /> Unduh / Ekspor
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
