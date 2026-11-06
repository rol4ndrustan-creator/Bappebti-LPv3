"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { DemoRoleSwitcher } from "@/components/shared/demo-role-switcher";
import { ResetDemoDataButton } from "@/components/shared/reset-demo-data-button";
import { InternalAuthIndicator } from "@/components/shared/internal-auth-indicator";

const PORTALS = [
  { label: "Publik", href: "/publik" },
  { label: "Bappebti", href: "/bappebti" },
  { label: "Pialang", href: "/platform" },
  { label: "Ekosistem Active", href: "/ekosistem/active" },
  { label: "Ekosistem Pasif", href: "/ekosistem/pengawas" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  // /admin/* is part of the unified Bappebti portal (Bab III), so it
  // highlights "Bappebti" in the switcher rather than having no match.
  const effectivePathname = pathname?.startsWith("/admin") ? "/bappebti" : pathname;
  const activePortal = PORTALS.find((p) => effectivePathname?.startsWith(p.href))?.href ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-navy text-white">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/publik" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/40 bg-navy-dark bg-linear-to-b from-white/20 to-transparent shadow-sm shadow-black/40 text-base font-bold">
            B
          </span>
          <span className="leading-tight hidden sm:block">
            <span className="block text-sm font-semibold">Layanan Pengaduan Bappebti</span>
            <span className="hidden xl:block text-[10px] text-white/70">
              Badan Pengawas Perdagangan Berjangka Komoditi
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 rounded-md bg-white/10 pl-2 pr-1 py-1">
          <Compass className="size-3.5 text-white/70 shrink-0" />
          <label className="hidden sm:inline text-[10px] font-medium uppercase tracking-wide text-white/70 shrink-0">
            Demo Navigation
          </label>
          <select
            aria-label="Pindah ke portal demo lain"
            value={activePortal}
            onChange={(e) => {
              if (e.target.value) router.push(e.target.value);
            }}
            className="bg-transparent text-xs font-medium text-white outline-none max-w-[140px] truncate [&>option]:text-foreground"
          >
            <option value="" disabled>
              Pilih portal
            </option>
            {PORTALS.map((p) => (
              <option key={p.href} value={p.href}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto shrink-0 flex items-center gap-2">
          <InternalAuthIndicator />
          <ResetDemoDataButton />
          <DemoRoleSwitcher />
        </div>
      </div>
    </header>
  );
}
