import { PortalShell, SidebarItem } from "@/components/layout/portal-shell";
import { RequireInternalAuth } from "@/components/shared/require-internal-auth";
import { LayoutDashboard, ListChecks, Clock, MessageCircle, FileBarChart, ClipboardCheck, Users, Handshake } from "lucide-react";

const iconCls = "size-4 shrink-0";

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard Platform", href: "/platform", icon: <LayoutDashboard className={iconCls} /> },
  { label: "Manajemen Pengaduan", href: "/platform/case-queue", icon: <ListChecks className={iconCls} />, matchPrefixes: ["/platform/kasus"] },
  { label: "Musyawarah Nasabah", href: "/platform/musyawarah", icon: <Handshake className={iconCls} /> },
  { label: "Manajemen Tugas", href: "/platform/tugas", icon: <ClipboardCheck className={iconCls} /> },
  { label: "Manajemen Member", href: "/platform/member", icon: <Users className={iconCls} /> },
  { label: "SLA & Resolution", href: "/platform/sla-resolution", icon: <Clock className={iconCls} /> },
  { label: "Klarifikasi", href: "/platform/klarifikasi", icon: <MessageCircle className={iconCls} /> },
  { label: "Reporting", href: "/platform/reporting", icon: <FileBarChart className={iconCls} /> },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireInternalAuth>
      <PortalShell title="Portal Platform" subtitle="PT Bursa Digital Nusantara" sidebarItems={sidebarItems} portal="platform">
        {children}
      </PortalShell>
    </RequireInternalAuth>
  );
}
