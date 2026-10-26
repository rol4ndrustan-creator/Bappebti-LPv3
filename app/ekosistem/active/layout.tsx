import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { EkosistemActiveRoleProvider } from "@/lib/ekosistem-active-role";
import { EkosistemActiveRoleSwitcher } from "@/components/shared/ekosistem-active-role-switcher";
import { LayoutDashboard, ListChecks, ClipboardCheck, Users, Scale } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard Overview", href: "/ekosistem/active", icon: <LayoutDashboard className={iconCls} /> },
  { label: "Manajemen Pengaduan", href: "/ekosistem/active/pengaduan", icon: <ListChecks className={iconCls} />, matchPrefixes: ["/ekosistem/active/kasus"] },
  { label: "Mediasi Perselisihan", href: "/ekosistem/active/mediasi", icon: <Scale className={iconCls} /> },
  { label: "Manajemen Tugas", href: "/ekosistem/active/tugas", icon: <ClipboardCheck className={iconCls} /> },
  { label: "Data Member", href: "/ekosistem/active/member", icon: <Users className={iconCls} /> },
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
