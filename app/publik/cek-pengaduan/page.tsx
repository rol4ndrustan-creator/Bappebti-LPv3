"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCaseByTicket } from "@/lib/mock-data";
import { useCaseData } from "@/lib/mock-service/store";
import { useLifecycleView } from "@/lib/mock-service/lifecycle-store";
import { LifecycleTracker } from "@/components/shared/ticket-lifecycle";
import { usePublikAuth } from "@/lib/publik-auth";
import { formatWIB } from "@/lib/case-pdf";
import { ArrowRight, FileSearch, Info, Search } from "lucide-react";

function TrackingForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    router.replace(`/publik/cek-pengaduan${t ? `?tiket=${encodeURIComponent(t)}` : ""}`);
  }
  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-white p-5 md:p-6">
      <label htmlFor="cek-ticket" className="block text-sm font-medium text-foreground">
        Nomor Tiket
      </label>
      <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
        <input
          id="cek-ticket"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Contoh: BPP-2026-000187"
          className="flex-1 rounded-md border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark">
          <Search className="size-4" /> Lacak
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Nomor tiket tercantum pada email konfirmasi dan halaman Pengaduan Saya.</p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2.5 border-b border-border last:border-0">
      <dt className="text-sm text-foreground/65">{label}</dt>
      <dd className="sm:col-span-2 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function TrackingResult({ ticket }: { ticket: string }) {
  const c = useCaseData(getCaseByTicket(ticket));
  const view = useLifecycleView(c);
  const { isAuthenticated } = usePublikAuth();

  if (!c) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-center" role="status">
        <FileSearch className="mx-auto size-8 text-muted" />
        <p className="mt-3 text-base font-semibold text-foreground">Tiket tidak ditemukan</p>
        <p className="mt-1 text-sm text-foreground/70">
          Nomor tiket <span className="font-semibold">{ticket}</span> tidak terdaftar. Periksa kembali penulisan nomor tiket Anda.
        </p>
      </div>
    );
  }

  const detailHref = `/publik/pengaduan/${c.ticket}`;
  return (
    <div className="rounded-lg border border-border bg-white" data-testid="tracking-result">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Nomor Tiket</p>
          <p className="mt-1 text-xl font-bold text-navy">{c.ticket}</p>
        </div>
        {view && (
          <span className="rounded-full bg-navy/10 px-3 py-1 text-sm font-semibold text-navy" data-testid="tracking-status">
            {view.status}
          </span>
        )}
      </div>
      <div className="p-5 md:p-6 space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-foreground">Tahapan Penanganan</p>
          <LifecycleTracker complaintCase={c} />
        </div>
        <dl>
          <Row label="Pialang Berjangka" value={c.platform || "Dalam triase Bappebti"} />
          <Row label="Kategori" value={c.category} />
          <Row label="Tanggal pengajuan" value={view ? formatWIB(new Date(view.lc.submittedAt)) : "—"} />
          <Row label="Batas SLA penyelesaian" value={view ? formatWIB(view.slaDeadline) : "—"} />
        </dl>
        <div className="flex items-start gap-3 rounded-md bg-[#f6f8fb] p-4 text-sm text-foreground/75">
          <Info className="size-4 mt-0.5 shrink-0 text-navy" />
          <p>
            Demi menjaga kerahasiaan, halaman ini hanya menampilkan ringkasan status. Rincian kronologi, dokumen, dan jadwal musyawarah dapat dilihat setelah
            masuk ke akun pelapor.
          </p>
        </div>
        <Link
          href={isAuthenticated ? detailHref : "/publik/masuk"}
          className="inline-flex items-center gap-2 rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          {isAuthenticated ? "Lihat detail pengaduan" : "Masuk untuk melihat detail"} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function CekPengaduanContent() {
  const params = useSearchParams();
  const ticket = (params.get("tiket") ?? "").trim().toUpperCase();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cek Status Pengaduan</h1>
        <p className="mt-2 text-sm text-foreground/70">Masukkan nomor tiket untuk melihat tahapan penanganan pengaduan Anda saat ini.</p>
      </div>
      <TrackingForm key={ticket} initial={ticket} />
      {ticket && <TrackingResult ticket={ticket} />}
    </div>
  );
}

export default function CekPengaduanPage() {
  return (
    <React.Suspense fallback={null}>
      <CekPengaduanContent />
    </React.Suspense>
  );
}
