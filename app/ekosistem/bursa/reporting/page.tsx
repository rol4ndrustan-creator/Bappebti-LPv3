"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import { FileBarChart, Download } from "lucide-react";

const reports = [
  {
    title: "Pialang SLA Report",
    description: "Ringkasan kepatuhan SLA seluruh pialang yang dipantau oleh Bursa.",
  },
  {
    title: "Escalation Report",
    description: "Rekapitulasi kasus yang dieskalasikan ke Bursa beserta status penanganannya.",
  },
  {
    title: "Supervisory Follow-up Report",
    description: "Catatan tindak lanjut supervisi yang telah dilakukan terhadap pialang.",
  },
  {
    title: "Critical Cases Under Bursa",
    description: "Daftar kasus dengan severitas kritis yang berada dalam pengawasan Bursa.",
  },
  {
    title: "Pialang Performance Trend",
    description: "Tren kinerja pialang dari waktu ke waktu berdasarkan indikator SLA dan volume kasus.",
  },
];

export default function BursaReportingPage() {
  const { showToast } = useToast();

  return (
    <div>
      <PageHeader
        title="Reporting"
        description="Unduh laporan terkait pengawasan pialang dan eskalasi kasus."
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
