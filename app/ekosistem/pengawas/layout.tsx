import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { ListChecks, ClipboardCheck, Users, Handshake, UserCog, History } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Manajemen Pengaduan", href: "/ekosistem/pengawas/pengaduan", icon: <ListChecks className={iconCls} />, matchPrefixes: ["/ekosistem/pengawas/kasus"] },
  { label: "Musyawarah", href: "/ekosistem/pengawas/musyawarah", icon: <Handshake className={iconCls} /> },
  { label: "Manajemen Tugas", href: "/ekosistem/pengawas/tugas", icon: <ClipboardCheck className={iconCls} /> },
  { label: "Data Member", href: "/ekosistem/pengawas/member", icon: <Users className={iconCls} /> },
  { label: "User & Role Management", href: "/ekosistem/pengawas/user-management", icon: <UserCog className={iconCls} /> },
  { label: "Audit Log", href: "/ekosistem/pengawas/audit-log", icon: <History className={iconCls} /> },
];

export default function EkosistemPengawasLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell title="Ekosistem Pengawas" subtitle="ASPEBTINDO & BAKTI — Pengawasan Kepatuhan Industri" sidebarItems={sidebarItems} portal="ekosistem">
      {children}
    </PortalShell>
  );
}
