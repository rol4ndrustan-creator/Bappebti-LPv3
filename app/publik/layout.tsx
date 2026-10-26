"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePublikAuth } from "@/lib/publik-auth";
import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { LayoutDashboard, FileText, PlusCircle, Bell, UserCircle, LogOut, Scale } from "lucide-react";

const iconCls = "size-4 shrink-0";

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/publik/dashboard", icon: <LayoutDashboard className={iconCls} /> },
  { label: "Pengaduan Saya", href: "/publik/pengaduan", icon: <FileText className={iconCls} /> },
  { label: "Buat Pengaduan", href: "/publik/pengaduan/baru", icon: <PlusCircle className={iconCls} /> },
  { label: "Alur Penyelesaian", href: "/publik/alur-penyelesaian", icon: <Scale className={iconCls} /> },
  { label: "Notifikasi", href: "/publik/notifikasi", icon: <Bell className={iconCls} /> },
  {
    label: "Profil",
    href: "/publik/profil",
    icon: <UserCircle className={iconCls} />,
    children: [
      { label: "Ubah Profil", href: "/publik/profil", icon: null },
      { label: "Ubah Password", href: "/publik/profil#ubah-password", icon: null },
    ],
  },
];

const MOBILE_TAB_ITEMS = [
  { label: "Dashboard", href: "/publik/dashboard" },
  { label: "Pengaduan Saya", href: "/publik/pengaduan" },
  { label: "Buat Pengaduan", href: "/publik/pengaduan/baru" },
  { label: "Alur Penyelesaian", href: "/publik/alur-penyelesaian" },
  { label: "Notifikasi", href: "/publik/notifikasi" },
  { label: "Profil", href: "/publik/profil" },
];

const NO_NAV_PATHS = ["/publik", "/publik/login", "/publik/masuk", "/publik/register"];

function MobileTabBar({ pathname, onLogout }: { pathname: string | null; onLogout: () => void }) {
  return (
    <div className="md:hidden border-b border-border bg-card px-2 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
      {MOBILE_TAB_ITEMS.map((l) => {
        const active = pathname === l.href || pathname?.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors",
              active ? "bg-navy text-white" : "text-foreground hover:bg-muted-bg"
            )}
          >
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onLogout}
        className="ml-auto rounded-md px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-muted hover:bg-muted-bg hover:text-foreground"
      >
        Keluar
      </button>
    </div>
  );
}

export default function PublikLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, ready, logout } = usePublikAuth();
  const requiresAuth = !NO_NAV_PATHS.includes(pathname || "");

  React.useEffect(() => {
    if (requiresAuth && ready && !isAuthenticated) {
      router.replace("/publik/login");
    }
  }, [requiresAuth, ready, isAuthenticated, router]);

  function handleLogout() {
    logout();
    router.push("/publik");
  }

  if (requiresAuth && (!ready || !isAuthenticated)) return null;

  if (!requiresAuth) {
    return (
      <div className="flex flex-1 min-h-0 flex-col" data-portal="publik">
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6">{children}</main>
      </div>
    );
  }

  return (
    <PortalShell
      title="Portal Pelapor"
      subtitle="Layanan Pengaduan Bappebti"
      sidebarItems={SIDEBAR_ITEMS}
      portal="publik"
      extraHeader={<MobileTabBar pathname={pathname} onLogout={handleLogout} />}
      asideFooter={
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted-bg"
        >
          <LogOut className={iconCls} /> Keluar
        </button>
      }
    >
      {children}
    </PortalShell>
  );
}
