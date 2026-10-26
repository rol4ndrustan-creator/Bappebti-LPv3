import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { RequireInternalAuth } from "@/components/shared/require-internal-auth";
import { ListChecks, Users, TrendingUp, BookOpen } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Manajemen Pengaduan", href: "/ekosistem/pengawas/pengaduan", icon: <ListChecks className={iconCls} /> },
  { label: "Kinerja Anggota", href: "/asosiasi/kinerja-anggota", icon: <Users className={iconCls} /> },
  { label: "Tren Industri", href: "/asosiasi/tren-industri", icon: <TrendingUp className={iconCls} /> },
  { label: "Topik Edukasi", href: "/asosiasi/topik-edukasi", icon: <BookOpen className={iconCls} /> },
];

export default function AsosiasiLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireInternalAuth>
      <PortalShell title="Asosiasi" subtitle="Asosiasi Pialang Berjangka Indonesia" sidebarItems={sidebarItems} portal="asosiasi">
        {children}
      </PortalShell>
    </RequireInternalAuth>
  );
}
