import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SeverityBadge } from "@/components/shared/badges";

const SLA_RULES: { kategori: string; tingkat: "Rendah" | "Sedang" | "Tinggi" | "Kritis"; responAwal: string; penyelesaian: string }[] = [
  { kategori: "Dana / Withdrawal", tingkat: "Tinggi", responAwal: "12 jam", penyelesaian: "3 hari" },
  { kategori: "Dana / Withdrawal", tingkat: "Kritis", responAwal: "6 jam", penyelesaian: "2 hari" },
  { kategori: "Deposit", tingkat: "Sedang", responAwal: "24 jam", penyelesaian: "3 hari" },
  { kategori: "Transaksi tidak dikenali", tingkat: "Kritis", responAwal: "6 jam", penyelesaian: "2 hari" },
  { kategori: "Settlement / Kliring", tingkat: "Sedang", responAwal: "24 jam", penyelesaian: "5 hari" },
  { kategori: "Akses akun", tingkat: "Sedang", responAwal: "24 jam", penyelesaian: "3 hari" },
  { kategori: "Penutupan akun", tingkat: "Rendah", responAwal: "48 jam", penyelesaian: "7 hari" },
  { kategori: "Layanan / respon pialang", tingkat: "Tinggi", responAwal: "24 jam", penyelesaian: "3 hari" },
  { kategori: "Dugaan penipuan / fraud", tingkat: "Kritis", responAwal: "6 jam", penyelesaian: "2 hari" },
];

const ESKALASI_RULES = [
  "Jika SLA terlampaui 2x tanpa penyelesaian -> eskalasi ke Bursa",
  "Jika kategori = Dugaan penipuan / fraud dan nilai > Rp50.000.000 -> langsung BAPPEBTI OWNED",
  "Jika tidak ada respon pialang > 72 jam -> eskalasi ke Bursa",
  "Jika kasus telah dieskalasi ke Bursa namun tetap melampaui SLA tambahan -> eskalasi ke Bappebti",
];

const OWNER_TRANSITIONS = [
  { from: "Pelapor", to: "Sistem Verifikasi", desc: "Pengaduan baru masuk dan menunggu verifikasi kelengkapan dokumen." },
  { from: "Sistem Verifikasi", to: "Pialang", desc: "Verifikasi awal selesai, kasus diteruskan ke pialang terkait." },
  { from: "Pialang", to: "Bursa", desc: "Eskalasi karena SLA terlampaui atau tidak ada respon dari pialang." },
  { from: "Pialang", to: "Kliring", desc: "Kasus terkait settlement/rekonsiliasi diteruskan ke kliring." },
  { from: "Pialang / Bursa / Kliring", to: "Bappebti", desc: "Kasus diambil alih sebagai BAPPEBTI OWNED karena indikasi fraud bernilai tinggi atau eskalasi berulang." },
  { from: "Bursa / Kliring / Bappebti", to: "Selesai", desc: "Resolusi diajukan dan diterima/divalidasi, kasus ditutup." },
];

const CLOSURE_RULES = [
  "Kasus dapat ditutup setelah resolusi diterima pelapor atau divalidasi Bappebti",
  "Kasus dapat dibuka kembali dalam 14 hari setelah penutupan jika ada bukti baru",
  "Kasus yang ditolak (Ditolak) dapat diajukan kembali dengan melengkapi data/bukti tambahan",
  "Penutupan kasus BAPPEBTI OWNED memerlukan persetujuan eksplisit dari regulator",
];

export default function SlaWorkflowPage() {
  return (
    <div>
      <PageHeader
        title="SLA & Workflow"
        description="Konfigurasi aturan SLA berdasarkan kategori dan tingkat keparahan, aturan eskalasi otomatis, transisi current owner, serta aturan penutupan/pembukaan kembali kasus."
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aturan SLA berdasarkan Kategori / Tingkat</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>SLA Respon Awal</TableHead>
                  <TableHead>SLA Penyelesaian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SLA_RULES.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-navy">{r.kategori}</TableCell>
                    <TableCell><SeverityBadge severity={r.tingkat} /></TableCell>
                    <TableCell>{r.responAwal}</TableCell>
                    <TableCell>{r.penyelesaian}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aturan Eskalasi Otomatis</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              {ESKALASI_RULES.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aturan Transisi Current Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 border-l-4 border-navy bg-navy/5 px-3 py-2 text-xs text-navy">
              Current owner bersifat tunggal dan berubah melalui proses penugasan (assignment).
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dari</TableHead>
                  <TableHead>Ke</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OWNER_TRANSITIONS.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium whitespace-nowrap">{t.from}</TableCell>
                    <TableCell className="font-medium text-navy whitespace-nowrap">{t.to}</TableCell>
                    <TableCell className="text-muted">{t.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aturan Penutupan / Pembukaan Kembali Kasus</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              {CLOSURE_RULES.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
