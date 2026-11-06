"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePublikAuth } from "@/lib/publik-auth";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileClock,
  FileSearch,
  FilePlus2,
  Gavel,
  Handshake,
  Hash,
  IdCard,
  Landmark,
  MessageSquareText,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";

const STAGES = [
  { icon: FilePlus2, title: "Pengaduan Online", desc: "Nasabah mengisi formulir dan mengunggah berkas. Tiket resmi terbit otomatis." },
  { icon: ShieldCheck, title: "Verifikasi Pialang", desc: "Pialang Berjangka memverifikasi komplain sesuai syarat materiil dalam batas waktu SLA." },
  { icon: Handshake, title: "Musyawarah", desc: "Nasabah dan Pialang bermusyawarah untuk mencapai kesepakatan damai." },
  { icon: Landmark, title: "Mediasi Bursa", desc: "Bila musyawarah tidak sepakat, Bursa Berjangka memfasilitasi mediasi." },
  { icon: Gavel, title: "Arbitrase / Pengadilan", desc: "Bila tetap tidak sepakat, nasabah dapat memilih arbitrase BAKTI atau Pengadilan Negeri." },
];

const CHECKLIST = [
  { icon: IdCard, text: "KTP (diunggah saat pendaftaran akun)" },
  { icon: Building2, text: "Nama Pialang Berjangka (bila diketahui)" },
  { icon: Hash, text: "Pialang User ID dan Nomor Akun Transaksi" },
  { icon: Receipt, text: "Bukti setor dana" },
  { icon: FileClock, text: "Kronologi kejadian (teks atau dokumen)" },
  { icon: MessageSquareText, text: "Bukti komunikasi dengan Pialang" },
  { icon: Target, text: "Penyelesaian yang diharapkan" },
];

const NOTES = [
  {
    icon: CheckCircle2,
    tone: "text-green bg-green-bg",
    title: "Setelah pengaduan disampaikan",
    text: "Pengaduan diteruskan ke Pialang Berjangka untuk diverifikasi. Bila nama Pialang belum diketahui, Bappebti melakukan triase terlebih dahulu.",
  },
  {
    icon: AlertTriangle,
    tone: "text-amber bg-amber-bg",
    title: "Syarat materiil",
    text: "Pengaduan dapat ditolak bila isu sudah selesai, sedang diproses di kanal lain, atau sudah masuk proses pengadilan/arbitrase.",
  },
  {
    icon: XCircle,
    tone: "text-red bg-red-bg",
    title: "Tidak ada jaminan kompensasi",
    text: "Penyampaian pengaduan tidak otomatis menjamin pengembalian dana. Setiap kasus dinilai berdasarkan bukti dan fakta.",
  },
  {
    icon: ShieldAlert,
    tone: "text-navy bg-navy/10",
    title: "Jaga kerahasiaan akun",
    text: "Jangan pernah membagikan OTP, PIN, kata sandi, atau kode pemulihan kepada siapa pun, termasuk yang mengaku petugas.",
  },
];

export default function PublikLandingPage() {
  const router = useRouter();
  const { isAuthenticated } = usePublikAuth();
  const [ticket, setTicket] = React.useState("");
  const buatPengaduanHref = isAuthenticated ? "/publik/cek-kelayakan" : "/publik/login";

  function track(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/publik/cek-pengaduan${ticket.trim() ? `?tiket=${encodeURIComponent(ticket.trim().toUpperCase())}` : ""}`);
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy">Layanan Pengaduan Nasabah Perdagangan Berjangka Komoditi</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Sampaikan pengaduan Anda secara resmi dan pantau penyelesaiannya.
            </h1>
            <p className="mt-4 text-base text-foreground/75 leading-relaxed max-w-xl">
              Ajukan pengaduan terhadap Pialang Berjangka, lengkapi dokumen pendukung, ikuti jadwal musyawarah, dan pantau setiap tahapan penanganan
              hingga selesai.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={buatPengaduanHref}
                className="inline-flex items-center gap-2 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-dark"
              >
                <FilePlus2 className="size-4" /> Buat Pengaduan
              </Link>
              <Link
                href="/publik/cek-pengaduan"
                className="inline-flex items-center gap-2 rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5"
              >
                <FileSearch className="size-4" /> Lacak Kasus
              </Link>
            </div>
          </div>
          <div className="lg:col-span-2">
            <form onSubmit={track} className="rounded-lg border border-border bg-[#f6f8fb] p-6">
              <p className="text-base font-semibold text-foreground">Cek Status Pengaduan</p>
              <p className="mt-1 text-sm text-foreground/70">Masukkan nomor tiket yang Anda terima saat mengajukan pengaduan.</p>
              <label htmlFor="hero-ticket" className="mt-4 block text-sm font-medium text-foreground">
                Nomor Tiket
              </label>
              <input
                id="hero-ticket"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="Contoh: BPP-2026-000187"
                className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
              <button type="submit" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark">
                <Search className="size-4" /> Lacak Pengaduan
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Tahapan penyelesaian */}
      <section id="alur" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tahapan Penyelesaian Sengketa</h2>
            <p className="mt-1 text-sm text-foreground/70">Setiap tahapan memiliki batas waktu dan tercatat pada riwayat tiket Anda.</p>
          </div>
          <Link href="/publik/alur-penyelesaian" className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
            Lihat alur lengkap <ArrowRight className="size-4" />
          </Link>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="rounded-lg border border-border bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
                  <Icon className="size-5 text-navy" />
                </div>
                <p className="mt-3 text-base font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-sm text-foreground/70 leading-relaxed">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Persiapan dokumen */}
      <section className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sebelum Mengajukan Pengaduan</h2>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              Siapkan dokumen berikut agar pengaduan dapat diverifikasi lebih cepat. Dokumen tambahan tetap dapat diunggah setelah tiket terbit.
            </p>
          </div>
          <ul className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHECKLIST.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.text} className="flex items-start gap-3 rounded-md border border-border p-3.5">
                  <Icon className="size-5 text-navy shrink-0" />
                  <span className="text-sm text-foreground">{c.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Informasi penting */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-14">
        <h2 className="text-2xl font-bold text-foreground mb-6">Yang Perlu Anda Ketahui</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NOTES.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.title} className="flex items-start gap-4 rounded-lg border border-border bg-white p-5">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-md ${n.tone}`}>
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{n.title}</p>
                  <p className="mt-1 text-sm text-foreground/70 leading-relaxed">{n.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-14">
        <div className="rounded-lg bg-navy px-6 py-8 md:px-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-white">Siap menyampaikan pengaduan?</p>
            <p className="mt-1 text-sm text-white/80">Daftar akun pelapor sekali, lalu ajukan dan pantau pengaduan kapan saja.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={buatPengaduanHref} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-white/90">
              Buat Pengaduan
            </Link>
            <Link href="/publik/bantuan" className="rounded-md border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Pusat Bantuan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
