"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import {
  ClipboardList,
  Clock,
  FileCheck2,
  AlertTriangle,
  FileSearch,
  Download,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ReportItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

const REPORTS: ReportItem[] = [
  {
    title: "Assigned Cases Report",
    description: "Daftar lengkap kasus pengaduan yang saat ini menjadi tanggung jawab Pialang, termasuk status dan kategori penanganan.",
    icon: ClipboardList,
  },
  {
    title: "SLA Aging Report",
    description: "Rekap usia kasus terhadap batas waktu SLA, mencakup distribusi bucket waktu dan kasus yang berisiko terlambat.",
    icon: Clock,
  },
  {
    title: "Resolution Quality Report",
    description: "Analisis kualitas resolusi yang diajukan, termasuk tingkat penerimaan dan waktu rata-rata penyelesaian.",
    icon: FileCheck2,
  },
  {
    title: "Escalation History Report",
    description: "Riwayat kasus yang dieskalasi ke Bappebti atau Bursa, beserta alasan dan tindak lanjutnya.",
    icon: AlertTriangle,
  },
  {
    title: "Evidence Pending Report",
    description: "Daftar kasus yang masih membutuhkan kelengkapan bukti penanganan atau klarifikasi tambahan.",
    icon: FileSearch,
  },
];

export default function PlatformReportingPage() {
  const { showToast } = useToast();

  return (
    <div>
      <PageHeader
        title="Reporting"
        description="Unduh atau ekspor laporan operasional terkait penanganan kasus pengaduan oleh Pialang."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => (
          <Card key={report.title} className="flex flex-col">
            <CardHeader className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <report.icon className="size-4 text-navy" />
                {report.title}
              </CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => showToast(`Laporan ${report.title} sedang disiapkan (demo)`)}
              >
                <Download className="size-3.5" />
                Unduh / Ekspor
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
