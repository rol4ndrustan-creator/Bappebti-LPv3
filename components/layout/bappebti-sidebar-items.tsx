// Builds the PortalShell SidebarItem[] for the unified Bappebti + Admin
// portal from the canonical MENU_TREE (lib/menu-tree.ts), so both
// app/bappebti/layout.tsx and app/admin/layout.tsx render the exact same
// sidebar regardless of which URL prefix the staff member is on.

import {
  LayoutDashboard,
  Gauge,
  ListChecks,
  ShieldAlert,
  Users,
  MessageSquareWarning,
  FileBarChart,
  UserCog,
  Building2,
  Server,
  IdCard,
  Route,
  Settings2,
  History,
  Handshake,
} from "lucide-react";
import { MENU_TREE } from "@/lib/menu-tree";
import { SidebarItem } from "./portal-shell";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Gauge,
  ListChecks,
  ShieldAlert,
  Users,
  MessageSquareWarning,
  FileBarChart,
  UserCog,
  Building2,
  Server,
  IdCard,
  Route,
  Settings2,
  History,
  Handshake,
};

const iconCls = "size-4 shrink-0";

function renderIcon(name: string) {
  const Icon = ICONS[name];
  return Icon ? <Icon className={iconCls} /> : null;
}

export const BAPPEBTI_SIDEBAR_ITEMS: SidebarItem[] = MENU_TREE.map((item) => ({
  label: item.label,
  href: item.href,
  icon: renderIcon(item.iconName),
  matchPrefixes: item.matchPrefixes,
  children: item.children?.map((child) => ({
    label: child.label,
    href: child.href,
    icon: null,
  })),
}));
