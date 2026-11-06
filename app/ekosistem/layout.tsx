"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RequireInternalAuth } from "@/components/shared/require-internal-auth";

const ROLES = [
  { label: "Ekosistem Active", href: "/ekosistem/active" },
  { label: "Ekosistem Pasif", href: "/ekosistem/pengawas" },
];

export default function EkosistemLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireInternalAuth>
      <div className="flex flex-1 min-h-0 flex-col" data-portal="ekosistem">
        <div className="border-b border-border bg-card px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-xs font-medium text-muted mr-2 shrink-0">AKUN EKOSISTEM &middot; PERAN:</span>
          {ROLES.map((r) => {
            const active = pathname?.startsWith(r.href);
            return (
              <Link
                key={r.href}
                href={r.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border",
                  active ? "bg-navy text-white border-navy" : "bg-white text-foreground border-border hover:bg-muted-bg"
                )}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-1 min-h-0">{children}</div>
      </div>
    </RequireInternalAuth>
  );
}
