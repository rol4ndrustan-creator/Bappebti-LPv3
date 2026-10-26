import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight } from "lucide-react";

type Tone = "navy" | "amber" | "green" | "red" | "muted";

const TONE: Record<Tone, string> = {
  navy: "border-navy/30 bg-navy/5",
  amber: "border-amber/40 bg-amber-bg/50",
  green: "border-green/30 bg-green-bg/50",
  red: "border-red/30 bg-red-bg/50",
  muted: "border-border bg-muted-bg/60",
};

function Box({ title, lines, tone = "navy", className }: { title: string; lines?: string[]; tone?: Tone; className?: string }) {
  return (
    <div className={cn("rounded-md border px-3 py-2 text-xs", TONE[tone], className)}>
      <p className="font-semibold text-foreground">{title}</p>
      {lines?.map((l) => (
        <p key={l} className="text-foreground/80 mt-0.5">
          {l}
        </p>
      ))}
    </div>
  );
}

function Branch({ label, tone }: { label: string; tone: "green" | "red" }) {
  return (
    <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold", tone === "green" ? "bg-green-bg text-green" : "bg-red-bg text-red")}>
      {label}
    </span>
  );
}

function Down() {
  return (
    <div className="flex justify-center py-1 text-muted">
      <ArrowDown className="size-4" />
    </div>
  );
}

/** Bagan alir Mekanisme Penanganan Perselisihan Nasabah PBK dalam bentuk responsif. */
export function DisputeFlowDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mekanisme Penanganan Perselisihan Nasabah PBK</CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-1">
        {/* 1. Pengajuan */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
          <Box title="Nasabah" tone="muted" />
          <ArrowRight className="hidden sm:block size-4 text-muted" />
          <Box title="Pengaduan online & unggah berkas" tone="muted" />
          <ArrowRight className="hidden sm:block size-4 text-muted" />
          <Box title="Otomatis oleh sistem" lines={["Diteruskan paralel ke Bappebti & Pialang"]} tone="muted" />
        </div>
        <Down />

        {/* 2. Verifikasi paralel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Box title="Bappebti — Verifikasi Materiil & Formil" lines={["Maks. 2 hari kerja"]} />
          <Box
            title="Pialang Berjangka — Klarifikasi"
            lines={["Maks. 1 hari kerja (daluarsa, informasi kontrak, dll)", "Tidak diverifikasi dalam 1 hari kerja → Pialang dianggap menyetujui pengaduan"]}
          />
        </div>
        <Down />

        {/* 3. Hasil verifikasi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Branch label="Materiil: Tidak" tone="red" />
            <Box title="Ditolak & ditutup pengaduan" tone="red" />
          </div>
          <div className="space-y-1">
            <Branch label="Formil: Tidak" tone="red" />
            <Box title="Dikembalikan ke nasabah" lines={["Perbaikan maks. 2 hari kerja sejak tanggal dikembalikan"]} tone="amber" />
          </div>
          <div className="space-y-1">
            <Branch label="Ya, terpenuhi" tone="green" />
            <Box title="Disposisi ke Pialang" tone="green" />
          </div>
        </div>
        <Down />

        {/* 4. Musyawarah */}
        <Box title="Musyawarah Pialang" lines={["Jangka waktu 21 hari kerja (bisa diperpanjang maks. 14 hari)"]} tone="amber" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <div className="space-y-1">
            <Branch label="Musyawarah tercapai" tone="green" />
            <Box
              title="Nilai kesepakatan — Pialang menyampaikan ke Bappebti"
              lines={["< Rp100.000.000 → dokumen kesepakatan", "≥ Rp100.000.000 → akta perdamaian"]}
              tone="green"
            />
            <Box title="Selesai" tone="green" />
          </div>
          <div className="space-y-1">
            <Branch label="Tidak tercapai" tone="red" />
            <Box title="Mediasi Bursa" lines={["Jangka waktu 21 hari kerja (bisa diperpanjang maks. 14 hari)"]} tone="amber" />
            <Down />
            <Box title="Lapor ke Bappebti" lines={["Maks. 1 hari kerja"]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Branch label="Sepakat" tone="green" />
                <Box
                  title="Bursa menyampaikan ke Bappebti"
                  lines={["< Rp100 juta → dokumen kesepakatan", "≥ Rp100 juta → akta perdamaian", "→ Selesai"]}
                  tone="green"
                />
              </div>
              <div className="space-y-1">
                <Branch label="Tidak sepakat" tone="red" />
                <Box
                  title="Pengadilan / BAKTI"
                  lines={["Bursa menjelaskan pilihan sarana penyelesaian", "Nasabah dapat memilih BAKTI paling lambat 20 hari kerja"]}
                  tone="muted"
                />
              </div>
            </div>
          </div>
        </div>
        <p className="pt-2 text-[11px] text-muted">
          Sumber: Rancangan Mekanisme Penanganan Perselisihan Nasabah PBK — Kementerian Perdagangan / Bappebti. Nilai tepat Rp100.000.000 diperlakukan sebagai akta perdamaian sampai ada ketentuan resmi.
        </p>
      </CardContent>
    </Card>
  );
}
