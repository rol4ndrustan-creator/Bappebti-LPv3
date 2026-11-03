"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import { FileBarChart, Download } from "lucide-react";

const reports = [
  {
    title: "Settlement Reconciliation Report",
    description: "Ringkasan hasil rekonsiliasi batch settlement antara pialang dan kliring.",
  },
  {
    title: "Pending Settlement Proof Report",
    description: "Daftar bukti settlement yang masih tertunda dari pialang maupun bank kustodian.",
  },
  {
    title: "Settlement Aging Report",
    description: "Rekapitulasi usia kasus settlement yang belum terselesaikan berdasarkan batas waktu.",
  },
  {
    title: "Pialang Data Request Report",
    description: "Catatan permintaan data kepada pialang untuk keperluan rekonsiliasi transaksi.",
  },
  {
    title: "Escalated Settlement Case Report",
    description: "Daftar kasus settlement yang dieskalasikan ke Bappebti beserta status penyelesaiannya.",
  },
];

export default function KliringReportingPage() {
  const { showToast } = useToast();

  return (
    <div>
      <PageHeader
        title="Reporting"
        description="Unduh laporan terkait settlement, rekonsiliasi, dan kelengkapan bukti settlement."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <div className="rounded-md bg-navy/10 p-2">
                <FileBarChart className="size-4 text-navy" />
              </div>
              <div>
                <CardTitle>{r.title}</CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast(`Laporan ${r.title} sedang disiapkan (demo)`)}
              >
                <Download className="size-3.5" />
                Unduh / Ekspor
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
