"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePublikAuth } from "@/lib/publik-auth";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileClock,
  FilePlus2,
  FileSearch,
  Gavel,
  Handshake,
  Hash,
  IdCard,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  Ticket,
  XCircle,
} from "lucide-react";

/** Kontainer standar portal publik (responsive-rules: px-4 → px-8, max-w-7xl). */
const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

const STAGES = [
  {
    icon: FilePlus2,
    title: "Pengaduan Online",
    desc: "Isi formulir dan unggah berkas pendukung. Nomor tiket resmi terbit otomatis.",
    sla: "Tiket terbit seketika",
  },
  {
    icon: ShieldCheck,
    title: "Verifikasi Pialang",
    desc: "Pialang Berjangka memverifikasi pengaduan sesuai syarat materiil.",
    sla: "Batas waktu SLA",
  },
  {
    icon: Handshake,
    title: "Musyawarah",
    desc: "Nasabah dan Pialang bermusyawarah untuk mencapai kesepakatan damai.",
    sla: "Dijadwalkan bersama",
  },
  {
    icon: Landmark,
    title: "Mediasi Bursa",
    desc: "Bila musyawarah tidak sepakat, Bursa Berjangka memfasilitasi mediasi.",
    sla: "Bila diperlukan",
  },
  {
    icon: Gavel,
    title: "Arbitrase / Pengadilan",
    desc: "Bila tetap tidak sepakat, nasabah dapat memilih arbitrase BAKTI atau Pengadilan Negeri.",
    sla: "Pilihan nasabah",
  },
];

const CHECKLIST = [
  { icon: IdCard, title: "KTP", text: "Diunggah sekali saat pendaftaran akun pelapor." },
  { icon: Building2, title: "Nama Pialang Berjangka", text: "Opsional — Bappebti melakukan triase bila belum diketahui." },
  { icon: Hash, title: "User ID & Nomor Akun", text: "Pialang User ID dan nomor akun transaksi Anda." },
  { icon: Receipt, title: "Bukti setor dana", text: "Bukti transfer dengan rekening tujuan terbaca jelas." },
  { icon: FileClock, title: "Kronologi kejadian", text: "Dalam bentuk teks atau dokumen terlampir." },
  { icon: MessageSquareText, title: "Bukti komunikasi", text: "Riwayat percakapan dengan Pialang atau tim CS." },
  { icon: Target, title: "Penyelesaian yang diharapkan", text: "Tuliskan hasil yang Anda harapkan secara spesifik." },
];

const NOTES = [
  {
    icon: CheckCircle2,
    border: "border-l-emerald-600",
    iconCls: "bg-emerald-50 text-emerald-700",
    title: "Setelah pengaduan disampaikan",
    text: "Pengaduan diteruskan ke Pialang Berjangka untuk diverifikasi. Bila nama Pialang belum diketahui, Bappebti melakukan triase terlebih dahulu.",
  },
  {
    icon: AlertTriangle,
    border: "border-l-amber-500",
    iconCls: "bg-amber-50 text-amber-700",
    title: "Syarat materiil",
    text: "Pengaduan dapat ditolak bila isu sudah selesai, sedang diproses di kanal lain, atau sudah masuk proses pengadilan / arbitrase.",
  },
  {
    icon: XCircle,
    border: "border-l-red-500",
    iconCls: "bg-red-50 text-red-600",
    title: "Tidak ada jaminan kompensasi",
    text: "Penyampaian pengaduan tidak otomatis menjamin pengembalian dana. Setiap kasus dinilai berdasarkan bukti dan fakta.",
  },
  {
    icon: ShieldAlert,
    border: "border-l-slate-500",
    iconCls: "bg-slate-100 text-slate-700",
    title: "Jaga kerahasiaan akun",
    text: "Jangan pernah membagikan OTP, PIN, kata sandi, atau kode pemulihan kepada siapa pun, termasuk yang mengaku petugas.",
  },
];

const TRUST = [
  { icon: BadgeCheck, text: "Kanal resmi Bappebti" },
  { icon: Clock3, text: "Batas waktu setiap tahapan" },
  { icon: LockKeyhole, text: "Data pelapor dilindungi" },
];

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";

function SectionHeading({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-wider text-navy">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-semibold leading-snug text-slate-900 sm:text-[28px]">{title}</h2>
        {desc && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/** Kartu lacak status tiket (hero, kolom kanan). */
function TrackCard() {
  const router = useRouter();
  const [ticket, setTicket] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = ticket.trim().toUpperCase();
    router.push(`/publik/cek-pengaduan${t ? `?tiket=${encodeURIComponent(t)}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-md sm:p-6" aria-labelledby="track-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-navy">
          <Ticket className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="track-title" className="text-lg font-semibold text-slate-900">
            Lacak Status Pengaduan
          </h2>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">Masukkan nomor tiket yang Anda terima saat mengajukan pengaduan.</p>
        </div>
      </div>

      <label htmlFor="hero-ticket" className="mt-5 block text-sm font-medium text-slate-700">
        Nomor Tiket
      </label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id="hero-ticket"
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          placeholder="BPP-2026-XXXXXX"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-[15px] text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>
      <p className="mt-1.5 text-[13px] text-slate-500">Format: BPP-tahun-6 digit, contoh BPP-2026-000187.</p>

      <button type="submit" className={cn(BTN_PRIMARY, "mt-4 w-full")}>
        <Search className="size-4" /> Lacak Pengaduan
      </button>

      <div className="mt-4 border-t border-slate-200 pt-4 text-[13px] text-slate-600">
        Lupa nomor tiket?{" "}
        <Link href="/publik/pengaduan" className="font-semibold text-navy hover:underline">
          Lihat di Pengaduan Saya
        </Link>
      </div>
    </form>
  );
}

/** Desktop (≥ lg): stepper horizontal bergaris dengan indikator progresif. */
function StagesStepper() {
  return (
    <ol className="relative hidden lg:grid lg:grid-cols-5 lg:gap-6" aria-label="Tahapan penyelesaian sengketa">
      {/* garis indikator: dari pusat lingkaran pertama hingga pusat lingkaran terakhir */}
      <span aria-hidden className="absolute left-[10%] right-[10%] top-6 h-1 rounded-full bg-gradient-to-r from-navy via-emerald-500 to-amber-400" />
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        return (
          <li key={s.title} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-4 border-white bg-navy text-white shadow-md ring-1 ring-slate-200">
              <Icon className="size-5" />
            </span>
            <div className="mt-4 flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-navy">Tahap {i + 1}</p>
              <p className="mt-1 text-base font-semibold leading-snug text-slate-900">{s.title}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                <Clock3 className="size-3.5" /> {s.sla}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Mobile & tablet (< lg): vertical timeline card. */
function StagesTimeline() {
  return (
    <ol className="relative lg:hidden" aria-label="Tahapan penyelesaian sengketa">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const last = i === STAGES.length - 1;
        return (
          <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && <span aria-hidden className="absolute left-5 top-11 -bottom-1 w-0.5 -translate-x-1/2 bg-gradient-to-b from-navy to-emerald-300" />}
            <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-sm ring-4 ring-background">
              <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-navy">Tahap {i + 1}</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">{s.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{s.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                <Clock3 className="size-3.5" /> {s.sla}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function PublikLandingPage() {
  const { isAuthenticated } = usePublikAuth();
  const buatPengaduanHref = isAuthenticated ? "/publik/cek-kelayakan" : "/publik/login";

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(13,92,58,0.08),transparent_55%)]" />
        <div className={cn(CONTAINER, "relative grid grid-cols-1 items-center gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-20")}>
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-navy ring-1 ring-inset ring-emerald-200">
              <ShieldCheck className="size-4 shrink-0" /> Layanan Pengaduan Nasabah PBK
            </p>
            <h1 className="mt-5 text-[32px] font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[40px]">
              Sampaikan pengaduan secara resmi dan pantau penyelesaiannya.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Ajukan pengaduan terhadap Pialang Berjangka, lengkapi dokumen pendukung, ikuti jadwal musyawarah, dan pantau setiap tahapan penanganan hingga
              selesai.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={buatPengaduanHref} className={BTN_PRIMARY}>
                <FilePlus2 className="size-4" /> Buat Pengaduan
              </Link>
              <Link href="/publik/cek-pengaduan" className={BTN_SECONDARY}>
                <FileSearch className="size-4" /> Lacak Kasus
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.text} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Icon className="size-4 shrink-0 text-navy" /> {t.text}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <TrackCard />
          </div>
        </div>
      </section>

      {/* Tahapan penyelesaian */}
      <section id="alur" className={cn(CONTAINER, "py-12 sm:py-16")}>
        <SectionHeading
          eyebrow="Alur Layanan"
          title="Tahapan Penyelesaian Sengketa"
          desc="Setiap tahapan memiliki batas waktu dan tercatat pada riwayat tiket Anda."
          action={
            <Link href="/publik/alur-penyelesaian" className="inline-flex items-center gap-1 text-[15px] font-semibold text-navy hover:underline">
              Lihat alur lengkap <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="mt-8 lg:mt-10">
          <StagesStepper />
          <StagesTimeline />
        </div>
      </section>

      {/* Persiapan dokumen */}
      <section className="border-y border-slate-200 bg-white">
        <div className={cn(CONTAINER, "grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-12 lg:gap-12")}>
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Persiapan"
              title="Sebelum Mengajukan Pengaduan"
              desc="Siapkan dokumen berikut agar pengaduan dapat diverifikasi lebih cepat. Dokumen tambahan tetap dapat diunggah setelah tiket terbit."
            />
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-8">
            {CHECKLIST.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-navy">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-slate-900">{c.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{c.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Informasi penting */}
      <section className={cn(CONTAINER, "py-12 sm:py-16")}>
        <SectionHeading eyebrow="Informasi Penting" title="Yang Perlu Anda Ketahui" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {NOTES.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.title} className={cn("flex items-start gap-4 rounded-xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm", n.border)}>
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", n.iconCls)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{n.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className={cn(CONTAINER, "pb-12 sm:pb-16")}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy-dark px-6 py-8 shadow-md sm:px-10 sm:py-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-2xl font-semibold text-white">Siap menyampaikan pengaduan?</p>
              <p className="mt-2 text-[15px] leading-relaxed text-emerald-50/90">Daftar akun pelapor sekali, lalu ajukan dan pantau pengaduan kapan saja.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={buatPengaduanHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-[15px] font-semibold text-navy shadow-sm hover:bg-emerald-50"
              >
                <FilePlus2 className="size-4" /> Buat Pengaduan
              </Link>
              <Link
                href="/publik/bantuan"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-[15px] font-semibold text-white hover:bg-white/10"
              >
                Pusat Bantuan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
