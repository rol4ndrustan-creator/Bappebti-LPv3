"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePublikAuth } from "@/lib/publik-auth";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, PlusCircle, UserCircle, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Logo instansi. File di public/images/logo/ adalah placeholder — ganti dengan logo resmi (nama file sama). */
export function InstitutionLogos({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  return (
    <span className="flex items-center gap-2 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- aset statis ekspor; next/image tidak menambah basePath */}
      <img src={`${BASE}/images/logo/logo-kemendag.svg`} alt="Logo Kementerian Perdagangan" className={cls} />
      {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
      <img src={`${BASE}/images/logo/logo-bappebti.svg`} alt="Logo Bappebti" className={cls} />
    </span>
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

  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center gap-4">
        <Link href="/publik" className="flex items-center gap-3 min-w-0">
          <InstitutionLogos />
          <span className="leading-tight min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">Kementerian Perdagangan Republik Indonesia</span>
            <span className="block text-sm md:text-base font-bold text-navy truncate">Badan Pengawas Perdagangan Berjangka Komoditi</span>
            <span className="block text-xs text-foreground/70">Layanan Pengaduan Nasabah</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Navigasi utama">
          {PUBLIC_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(pathname, n.href) ? "text-navy bg-navy/5" : "text-foreground/80 hover:text-navy hover:bg-muted-bg"
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
              <Link href="/publik/masuk" className="px-4 py-2 text-sm font-semibold text-navy border border-navy rounded-md hover:bg-navy/5">
                Masuk
              </Link>
              <Link href="/publik/register" className="px-4 py-2 text-sm font-semibold text-white bg-navy rounded-md hover:bg-navy-dark">
                Daftar
              </Link>
            </>
          )}
        </nav>

        <button type="button" className="lg:hidden ml-auto rounded-md p-2 text-foreground hover:bg-muted-bg" aria-label="Buka menu" onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border px-4 py-3 flex flex-col gap-1" aria-label="Navigasi utama (seluler)">
          {PUBLIC_NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={cn("px-3 py-2 rounded-md text-sm font-medium", isActive(pathname, n.href) ? "bg-navy/5 text-navy" : "text-foreground")}>
              {n.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            {isAuthenticated ? (
              <button type="button" onClick={onLogout} className="flex-1 rounded-md border border-border px-3 py-2 text-sm">
                Keluar
              </button>
            ) : (
              <>
                <Link href="/publik/masuk" className="flex-1 text-center rounded-md border border-navy px-3 py-2 text-sm font-semibold text-navy">
                  Masuk
                </Link>
                <Link href="/publik/register" className="flex-1 text-center rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white">
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
      <nav className="max-w-6xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto scrollbar-thin" aria-label="Menu akun">
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
    <footer className="bg-navy-dark text-white/85 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white p-1">
              <InstitutionLogos />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold text-white">Badan Pengawas Perdagangan Berjangka Komoditi</span>
              <span className="block text-xs text-white/70">Kementerian Perdagangan Republik Indonesia</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-white/70 max-w-md">
            Layanan pengaduan nasabah Perdagangan Berjangka Komoditi: verifikasi oleh Pialang Berjangka, musyawarah, mediasi Bursa, hingga penyelesaian melalui
            arbitrase BAKTI atau pengadilan.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Layanan</p>
          <ul className="space-y-1.5 text-xs">
            <li><Link href="/publik/login" className="hover:text-white">Buat Pengaduan</Link></li>
            <li><Link href="/publik/cek-pengaduan" className="hover:text-white">Cek Status Pengaduan</Link></li>
            <li><Link href="/publik/alur-penyelesaian" className="hover:text-white">Alur Layanan</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-2">Bantuan</p>
          <ul className="space-y-1.5 text-xs">
            <li><Link href="/publik/bantuan" className="hover:text-white">Pertanyaan Umum (FAQ)</Link></li>
            <li><Link href="/publik/bantuan#kontak" className="hover:text-white">Kontak Layanan</Link></li>
            <li><Link href="/publik/register" className="hover:text-white">Daftar Akun Pelapor</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 text-[11px] text-white/60 flex flex-wrap justify-between gap-2">
          <span>© {2026} Badan Pengawas Perdagangan Berjangka Komoditi. Hak cipta dilindungi.</span>
          <span>Prototipe layanan pengaduan — data yang ditampilkan adalah data simulasi.</span>
        </div>
      </div>
    </footer>
  );
}
