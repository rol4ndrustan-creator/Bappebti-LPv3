import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { Landmark, FileSearch, FileCheck2, MessageCircle, FileBarChart } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Settlement Queue", href: "/ekosistem/kliring/settlement-queue", icon: <Landmark className={iconCls} /> },
  { label: "Reconciliation Review", href: "/ekosistem/kliring/reconciliation-review", icon: <FileSearch className={iconCls} /> },
  { label: "Settlement Evidence", href: "/ekosistem/kliring/settlement-evidence", icon: <FileCheck2 className={iconCls} /> },
  { label: "Klarifikasi", href: "/ekosistem/kliring/klarifikasi", icon: <MessageCircle className={iconCls} /> },
  { label: "Reporting", href: "/ekosistem/kliring/reporting", icon: <FileBarChart className={iconCls} /> },
];

export default function KliringLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell title="Kliring" subtitle="Kliring Berjangka Indonesia" sidebarItems={sidebarItems}>
      {children}
    </PortalShell>
  );
}
