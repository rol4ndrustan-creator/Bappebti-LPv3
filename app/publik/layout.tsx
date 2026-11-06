"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePublikAuth } from "@/lib/publik-auth";
import { PublicAccountNav, PublicFooter, PublicHeader } from "@/components/publik/public-shell";

/** Halaman yang dapat dibuka tanpa login. */
const PUBLIC_PATHS = [
  "/publik",
  "/publik/login",
  "/publik/masuk",
  "/publik/register",
  "/publik/cek-pengaduan",
  "/publik/bantuan",
  "/publik/alur-penyelesaian",
];

/**
 * Portal Publik (List Revisi 14 #3): satu kerangka standar portal instansi —
 * header dengan logo & navigasi, menu akun setelah login, konten terpusat,
 * dan footer instansi — untuk seluruh halaman, sebelum maupun sesudah login.
 */
export default function PublikLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, ready, logout } = usePublikAuth();
  const requiresAuth = !PUBLIC_PATHS.includes(pathname || "");

  React.useEffect(() => {
    if (requiresAuth && ready && !isAuthenticated) {
      router.replace("/publik/login");
    }
  }, [requiresAuth, ready, isAuthenticated, router]);

  function handleLogout() {
    logout();
    router.push("/publik");
  }

  const blocked = requiresAuth && (!ready || !isAuthenticated);
  const isLanding = pathname === "/publik";

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-[#f6f8fb] overflow-y-auto" data-portal="publik">
      <PublicHeader onLogout={handleLogout} />
      {isAuthenticated && requiresAuth && <PublicAccountNav />}
      {blocked ? (
        <div className="flex-1" />
      ) : isLanding ? (
        <main className="flex-1">{children}</main>
      ) : (
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
      )}
      <PublicFooter />
    </div>
  );
}
