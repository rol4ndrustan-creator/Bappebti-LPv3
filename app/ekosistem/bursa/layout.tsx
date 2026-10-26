import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { Building2, ArrowUpRight, ClipboardList, MessageCircle, FileBarChart, Scale } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Mediasi Perselisihan", href: "/ekosistem/bursa/mediasi", icon: <Scale className={iconCls} /> },
  { label: "Platform Monitoring", href: "/ekosistem/bursa/platform-monitoring", icon: <Building2 className={iconCls} /> },
  { label: "Escalation Queue", href: "/ekosistem/bursa/escalation-queue", icon: <ArrowUpRight className={iconCls} /> },
  { label: "Supervisory Actions", href: "/ekosistem/bursa/supervisory-actions", icon: <ClipboardList className={iconCls} /> },
  { label: "Klarifikasi", href: "/ekosistem/bursa/klarifikasi", icon: <MessageCircle className={iconCls} /> },
  { label: "Reporting", href: "/ekosistem/bursa/reporting", icon: <FileBarChart className={iconCls} /> },
];

export default function BursaLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell title="Bursa" subtitle="Bursa Berjangka Jakarta" sidebarItems={sidebarItems}>
      {children}
    </PortalShell>
  );
}
