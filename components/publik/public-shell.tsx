"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePublikAuth } from "@/lib/publik-auth";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, PlusCircle, UserCircle, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Logo resmi gabungan Kementerian Perdagangan + Bappebti (public/images/logo/logo-kemendag-bappebti.png, rasio ±3,17 : 1). */
export function InstitutionLogos({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-14 sm:h-16" : size === "sm" ? "h-9 sm:h-10" : "h-10 sm:h-12";
  return (
    // eslint-disable-next-line @next/next/no-img-element -- aset statis ekspor; next/image tidak menambah basePath
    <img
      src={`${BASE}/images/logo/logo-kemendag-bappebti.png`}
      alt="Kementerian Perdagangan Republik Indonesia — Bappebti"
      width={682}
      height={215}
      className={cn("w-auto shrink-0 select-none", cls)}
    />
  );
}

export const PUBLIC_NAV = [
  { label: "Beranda", href: "/publik" },
  { label: "Alur Layanan", href: "/publik/alur-penyelesaian" },
  { label: "Cek Pengaduan", href: "/publik/cek-pengaduan" },
  { label: "Bantuan", href: "/publik/bantuan" },
];

const ACCOUNT_NAV = [
  { label: "Dashboard", href: "/publik/dashboard", icon: LayoutDashboard },
  { label: "Pengaduan Saya", href: "/publik/pengaduan", icon: FileText },
  { label: "Buat Pengaduan", href: "/publik/pengaduan/baru", icon: PlusCircle },
  { label: "Notifikasi", href: "/publik/notifikasi", icon: Bell },
  { label: "Profil", href: "/publik/profil", icon: UserCircle },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/publik") return pathname === "/publik";
  if (href === "/publik/pengaduan") return pathname === href || (pathname.startsWith(href + "/") && !pathname.startsWith("/publik/pengaduan/baru"));
  return pathname === href || pathname.startsWith(href + "/");
}

export function PublicHeader({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const { isAuthenticated, account } = usePublikAuth();
  const [open, setOpen] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-h-16 sm:min-h-20 py-2.5 flex items-center gap-3 sm:gap-4">
        <Link href="/publik" className="flex items-center gap-3 min-w-0">
          <InstitutionLogos />
          <span className="h-9 w-px shrink-0 bg-slate-200" aria-hidden />
          <span className="leading-tight min-w-0">
            <span className="block text-[13px] sm:text-[15px] font-semibold text-slate-900">Layanan Pengaduan</span>
            <span className="block text-xs text-slate-500">Nasabah PBK</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Navigasi utama">
          {PUBLIC_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-3 py-2 text-[15px] font-medium rounded-lg transition-colors",
                isActive(pathname, n.href) ? "text-navy bg-navy/5" : "text-slate-700 hover:text-navy hover:bg-slate-50"
              )}
            >
              {n.label}
            </Link>
          ))}
          <span className="mx-2 h-6 w-px bg-border" />
          {isAuthenticated ? (
            <>
              <Link href="/publik/dashboard" className="px-3 py-2 text-sm font-medium text-navy hover:underline">
                {account?.nama?.split(" ")[0] ?? "Akun Saya"}
              </Link>
              <button type="button" onClick={onLogout} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-foreground/70 hover:text-red">
                <LogOut className="size-4" /> Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/publik/masuk" className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg bg-white shadow-sm hover:bg-slate-50">
                Masuk
              </Link>
              <Link href="/publik/register" className="px-4 py-2 text-sm font-semibold text-white bg-navy rounded-lg shadow-sm hover:bg-navy-dark">
                Daftar
              </Link>
            </>
          )}
        </nav>

        <button type="button" className="lg:hidden ml-auto rounded-md p-2 text-foreground hover:bg-muted-bg" aria-label="Buka menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-slate-200 bg-white px-4 sm:px-6 py-3 flex flex-col gap-1" aria-label="Navigasi utama (seluler)">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("px-3 py-2.5 rounded-lg text-[15px] font-medium", isActive(pathname, n.href) ? "bg-navy/5 text-navy" : "text-slate-700")}>
              {n.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <button type="button" onClick={onLogout} className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700">
                Keluar
              </button>
            ) : (
              <>
                <Link href="/publik/masuk" className="flex-1 text-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
                  Masuk
                </Link>
                <Link href="/publik/register" className="flex-1 text-center rounded-lg bg-navy px-3 py-2.5 text-sm font-semibold text-white">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

/** Menu akun pelapor (setelah login). */
export function PublicAccountNav() {
  const pathname = usePathname();
  return (
    <div className="bg-navy">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto scrollbar-thin" aria-label="Menu akun">
        {ACCOUNT_NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors",
                active ? "border-white text-white" : "border-transparent text-white/75 hover:text-white"
              )}
            >
              <Icon className="size-4" /> {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#064e3b] text-emerald-50/85 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div className="sm:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-md bg-white px-3 py-2">
              <InstitutionLogos size="sm" />
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/75 max-w-md">
            Layanan pengaduan nasabah Perdagangan Berjangka Komoditi: verifikasi oleh Pialang Berjangka, musyawarah, mediasi Bursa, hingga penyelesaian melalui
            arbitrase BAKTI atau pengadilan.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Layanan</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/publik/login" className="hover:text-white">Buat Pengaduan</Link></li>
            <li><Link href="/publik/cek-pengaduan" className="hover:text-white">Cek Status Pengaduan</Link></li>
            <li><Link href="/publik/alur-penyelesaian" className="hover:text-white">Alur Layanan</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Bantuan</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/publik/bantuan" className="hover:text-white">Pertanyaan Umum (FAQ)</Link></li>
            <li><Link href="/publik/bantuan#kontak" className="hover:text-white">Kontak Layanan</Link></li>
            <li><Link href="/publik/register" className="hover:text-white">Daftar Akun Pelapor</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-white/60 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between gap-2">
          <span>© {2026} Badan Pengawas Perdagangan Berjangka Komoditi. Hak cipta dilindungi.</span>
          <span>Prototipe layanan pengaduan — data yang ditampilkan adalah data simulasi.</span>
        </div>
      </div>
    </footer>
  );
}
