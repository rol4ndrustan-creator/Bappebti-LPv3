import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SeverityBadge } from "@/components/shared/badges";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CASES, formatCurrency } from "@/lib/mock-data";
import {
  ShieldAlert,
  AlertTriangle,
  Repeat,
  Network,
  Banknote,
  Clock,
  UserX,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function PemantauanRisikoPage() {
  const critical = CASES.filter((c) => c.severity === "Kritis");
  const fraud = CASES.filter((c) => c.category === "Dugaan penipuan / fraud");
  const highValue = CASES.filter((c) => (c.amount || 0) > 50000000);
  const multiPlatform = CASES.filter((c) => (c.relatedCases?.length || 0) > 0);
  const dataPrivacy = 1;
  const repeatedPattern = 2;

  const highRiskCases = CASES.filter(
    (c) => c.severity === "Kritis" || c.slaStatus === "Lewat SLA" || (c.amount || 0) > 50000000
  );

  const patterns = [
    {
      icon: Repeat,
      title: "Keterlambatan penarikan berulang",
      desc: "Pola keterlambatan penarikan dana yang berulang pada beberapa pialang dengan kategori Dana / Withdrawal.",
      count: CASES.filter((c) => c.category === "Dana / Withdrawal").length,
    },
    {
      icon: Network,
      title: "Keterlibatan multi-pialang",
      desc: "Kasus yang melibatkan lebih dari satu pialang atau memiliki keterkaitan dengan kasus lain.",
      count: multiPlatform.length,
    },
    {
      icon: Banknote,
      title: "Pengaduan nilai tinggi",
      desc: "Kasus dengan nilai transaksi di atas Rp50.000.000 yang memerlukan perhatian khusus.",
      count: highValue.length,
    },
    {
      icon: Clock,
      title: "Pialang response delay",
      desc: "Indikasi keterlambatan respon pialang terhadap permintaan klarifikasi atau penyelesaian kasus.",
      count: CASES.filter((c) => c.slaStatus !== "Aman").length,
    },
    {
      icon: UserX,
      title: "Identitas / akses akun abnormal",
      desc: "Pola akses akun atau identitas yang tidak biasa, termasuk pemblokiran tanpa pemberitahuan.",
      count: CASES.filter((c) => c.category === "Akses akun" || c.category === "Transaksi tidak dikenali").length,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pemantauan Risiko"
        description="Deteksi pola risiko sistemik dan daftar kasus berisiko tinggi untuk pengawasan lintas pialang, bursa, dan kliring."
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <KpiCard label="Kasus Kritis" value={critical.length} icon={ShieldAlert} tone="red" />
        <KpiCard label="Indikasi Fraud" value={fraud.length} icon={AlertTriangle} tone="red" />
        <KpiCard label="Pengaduan Nilai Tinggi" value={highValue.length} icon={Banknote} tone="amber" />
        <KpiCard label="Multi-Pialang Dispute" value={multiPlatform.length} icon={Network} tone="amber" />
        <KpiCard label="Privasi Data" value={dataPrivacy} icon={Lock} tone="default" />
        <KpiCard label="Repeated Complaint Pattern" value={repeatedPattern} icon={Repeat} tone="default" />
      </div>

      {/* Pattern detection */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Deteksi Pola Risiko</CardTitle>
          <CardDescription>Pola risiko sistemik yang terdeteksi dari data pengaduan terkini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {patterns.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-md border border-amber/30 bg-amber-bg px-3 py-2 text-xs"
              >
                <Icon className="size-4 text-amber shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="text-muted mt-0.5">{p.desc}</p>
                </div>
                <UiBadge variant="amber">{p.count} kasus</UiBadge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* High risk cases table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kasus Berisiko Tinggi</CardTitle>
          <CardDescription>
            Kasus dengan tingkat keparahan kritis, melewati SLA, atau bernilai transaksi tinggi (&gt;Rp50.000.000).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiket</TableHead>
                <TableHead>Pengaduan</TableHead>
                <TableHead>Pialang</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Nilai Transaksi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highRiskCases.map((c) => (
                <TableRow key={c.ticket}>
                  <TableCell className="font-medium text-navy whitespace-nowrap">{c.ticket}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{c.title}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{c.platform}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={c.severity} />
                  </TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{c.category}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(c.amount)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/bappebti/kasus/${c.ticket}`}
                      className="text-navy inline-flex items-center gap-1 hover:underline whitespace-nowrap"
                    >
                      Tinjau <ArrowRight className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {highRiskCases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted py-6">
                    Tidak ada kasus berisiko tinggi saat ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
