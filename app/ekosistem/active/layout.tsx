import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { EkosistemActiveRoleProvider } from "@/lib/ekosistem-active-role";
import { EkosistemActiveRoleSwitcher } from "@/components/shared/ekosistem-active-role-switcher";
import { ListChecks, ClipboardCheck, Users, Scale, Handshake, UserCog, History } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Manajemen Pengaduan", href: "/ekosistem/active/pengaduan", icon: <ListChecks className={iconCls} />, matchPrefixes: ["/ekosistem/active/kasus"] },
  { label: "Mediasi Perselisihan", href: "/ekosistem/active/mediasi", icon: <Scale className={iconCls} /> },
  { label: "Musyawarah", href: "/ekosistem/active/musyawarah", icon: <Handshake className={iconCls} /> },
  { label: "Manajemen Tugas", href: "/ekosistem/active/tugas", icon: <ClipboardCheck className={iconCls} /> },
  { label: "Data Member", href: "/ekosistem/active/member", icon: <Users className={iconCls} /> },
  { label: "User & Role Management", href: "/ekosistem/active/user-management", icon: <UserCog className={iconCls} /> },
  { label: "Audit Log", href: "/ekosistem/active/audit-log", icon: <History className={iconCls} /> },
];

export default function EkosistemActiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <EkosistemActiveRoleProvider>
      <PortalShell
        title="Ekosistem Active"
        subtitle="Infrastruktur Pasar — Bursa, Kliring, Custody"
        sidebarItems={sidebarItems}
        portal="ekosistem"
        extraHeader={<EkosistemActiveRoleSwitcher />}
      >
        {children}
      </PortalShell>
    </EkosistemActiveRoleProvider>
  );
}
