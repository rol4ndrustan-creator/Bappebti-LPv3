"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, Clock, Mail, MapPin, Phone } from "lucide-react";

const FAQ = [
  {
    q: "Siapa yang dapat mengajukan pengaduan?",
    a: "Nasabah Perdagangan Berjangka Komoditi yang memiliki keluhan terhadap Pialang Berjangka, dengan akun pelapor yang telah terdaftar dan KTP yang telah diunggah.",
  },
  {
    q: "Bagaimana jika saya tidak mengetahui nama Pialang Berjangka?",
    a: "Centang opsi “Saya tidak mengetahui nama Pialang” pada formulir. Bappebti akan melakukan triase dan meneruskan pengaduan ke Pialang yang tepat.",
  },
  {
    q: "Berapa lama pengaduan saya diproses?",
    a: "Setiap tahapan memiliki batas waktu (SLA) dalam hari kerja. Sisa waktu setiap tahapan dapat dipantau pada halaman detail pengaduan.",
  },
  {
    q: "Mengapa pengaduan saya dapat ditolak?",
    a: "Pengaduan dapat ditolak bila isu sudah selesai, isu sedang aktif diproses di kanal lain, atau isu sudah masuk ke proses pengadilan / arbitrase. Penolakan oleh Pialang ditinjau kembali oleh Bappebti.",
  },
  {
    q: "Apa yang terjadi bila musyawarah tidak mencapai kesepakatan?",
    a: "Pengaduan dapat difasilitasi mediasi oleh Bursa Berjangka. Bila tetap tidak sepakat, Anda dapat mengajukan arbitrase ke BAKTI dalam jangka waktu yang ditentukan, atau menempuh jalur Pengadilan Negeri.",
  },
  {
    q: "Apakah saya dapat menambahkan dokumen setelah pengaduan dikirim?",
    a: "Ya. Dokumen tambahan dapat diunggah melalui halaman detail pengaduan, termasuk saat petugas meminta perbaikan berkas.",
  },
];

export default function BantuanPage() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pusat Bantuan</h1>
        <p className="mt-2 text-sm text-foreground/70">Jawaban atas pertanyaan yang sering diajukan dan kontak layanan pengaduan.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">Pertanyaan Umum</h2>
          <div className="rounded-lg border border-border bg-white divide-y divide-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground">
                  {f.q}
                  <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{f.a}</p>
              </details>
            ))}
          </div>
          <Link href="/publik/alur-penyelesaian" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
            Pelajari alur layanan selengkapnya <ArrowRight className="size-4" />
          </Link>
        </div>

        <aside id="kontak" className="scroll-mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Kontak Layanan</h2>
          <div className="rounded-lg border border-border bg-white p-5 space-y-4 text-sm">
            <p className="flex items-start gap-3">
              <Phone className="size-4 mt-0.5 text-navy shrink-0" /> <span>Call center: (021) 0000-0000 <span className="block text-xs text-muted">Nomor simulasi</span></span>
            </p>
            <p className="flex items-start gap-3">
              <Mail className="size-4 mt-0.5 text-navy shrink-0" /> <span>pengaduan@contoh.go.id <span className="block text-xs text-muted">Alamat simulasi</span></span>
            </p>
            <p className="flex items-start gap-3">
              <Clock className="size-4 mt-0.5 text-navy shrink-0" /> <span>Senin–Jumat, 08.00–16.00 WIB</span>
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="size-4 mt-0.5 text-navy shrink-0" /> <span>Badan Pengawas Perdagangan Berjangka Komoditi, Jakarta</span>
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
