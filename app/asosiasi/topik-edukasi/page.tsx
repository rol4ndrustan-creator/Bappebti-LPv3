"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";

const TOPICS = [
  {
    title: "Withdrawal SLA",
    description: "Memahami batas waktu penarikan dana dan eskalasi jika terlambat",
  },
  {
    title: "Fraud Prevention",
    description: "Mengenali ciri-ciri penipuan investasi berkedok robot trading",
  },
  {
    title: "Account Closure Process",
    description: "Tahapan resmi penutupan akun dan hak atas dana",
  },
  {
    title: "How to Identify Licensed Pialang",
    description: "Cara memverifikasi legalitas pialang melalui Bappebti",
  },
  {
    title: "What Evidence is Needed for Complaint",
    description: "Daftar bukti pendukung yang mempercepat proses pengaduan",
  },
];

export default function TopikEdukasiPage() {
  const { showToast } = useToast();

  return (
    <div>
      <PageHeader
        title="Topik Edukasi"
        description="Rekomendasi topik edukasi publik berdasarkan tren pengaduan industri, untuk mendukung pencegahan dan literasi pelapor."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TOPICS.map((t) => (
          <Card key={t.title} className="flex flex-col">
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => showToast("Materi edukasi sedang disiapkan (demo)")}
              >
                Lihat Materi
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
