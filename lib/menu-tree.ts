// Canonical menu/submenu structure for the unified Bappebti + Admin portal
// (Bab III — "Fitur pada admin dan Dashboard Bappebti digabungkan jadi
// satu"). This is the single source of truth for two things:
//   1. The sidebar both /bappebti/* and /admin/* pages render (see
//      components/layout/bappebti-sidebar.tsx), so staff see one menu
//      regardless of which URL prefix they're on.
//   2. The checkbox tree in the role builder (admin/roles) — each role is
//      just a list of the `key`s below it's allowed to see.
//
// Plain data only (no JSX) so it can be imported from both server and
// client code; icon names are mapped to lucide-react components where the
// tree is actually rendered.

export interface MenuTreeItem {
  key: string;
  label: string;
  href: string;
  iconName: string;
  children?: MenuTreeItem[];
  /** Extra path prefixes (e.g. a case detail route) that also count as this item being active — see SidebarItem.matchPrefixes. */
  matchPrefixes?: string[];
}

export const MENU_TREE: MenuTreeItem[] = [
  { key: "dashboard-eksekutif", label: "Dashboard Eksekutif", href: "/bappebti", iconName: "LayoutDashboard" },
  { key: "dashboard-admin", label: "Dashboard Admin", href: "/admin", iconName: "Gauge" },
  {
    key: "pengaduan",
    label: "Manajemen Pengaduan",
    href: "/bappebti/antrean",
    iconName: "ListChecks",
    matchPrefixes: ["/bappebti/kasus"],
    children: [
      { key: "pengaduan.semua", label: "Semua Pengaduan", href: "/bappebti/antrean", iconName: "" },
      { key: "pengaduan.perselisihan", label: "Perselisihan Nasabah PBK", href: "/bappebti/pengaduan/perselisihan", iconName: "" },
      { key: "pengaduan.bappebti", label: "Penanganan Bappebti", href: "/bappebti/pengaduan/penanganan-bappebti", iconName: "" },
      { key: "pengaduan.tanpa-platform", label: "Tanpa ID Platform", href: "/bappebti/pengaduan/tanpa-platform", iconName: "" },
      { key: "pengaduan.menunggu-konfirmasi", label: "Menunggu Konfirmasi Pelapor", href: "/bappebti/pengaduan/menunggu-konfirmasi", iconName: "" },
      { key: "pengaduan.selesai-otomatis", label: "Ditutup Otomatis", href: "/bappebti/pengaduan/selesai-otomatis", iconName: "" },
    ],
  },
  { key: "risiko", label: "Pemantauan Risiko", href: "/bappebti/risiko", iconName: "ShieldAlert" },
  { key: "kinerja", label: "Kinerja Anggota", href: "/bappebti/kinerja-anggota", iconName: "Users" },
  {
    key: "kritik",
    label: "Kritik & Saran",
    href: "/bappebti/kritik-masukan",
    iconName: "MessageSquareWarning",
    children: [
      { key: "kritik.daftar", label: "Daftar Kritik & Saran", href: "/bappebti/kritik-masukan", iconName: "" },
      { key: "kritik.belum-dibaca", label: "Belum Dibaca", href: "/bappebti/kritik-masukan/belum-dibaca", iconName: "" },
      { key: "kritik.tindak-lanjut", label: "Perlu Tindak Lanjut", href: "/bappebti/kritik-masukan/tindak-lanjut", iconName: "" },
    ],
  },
  { key: "laporan", label: "Laporan & Ekspor", href: "/bappebti/laporan", iconName: "FileBarChart" },
  {
    key: "user-management",
    label: "User Management",
    href: "/admin/users",
    iconName: "UserCog",
    children: [
      { key: "user-management.users", label: "User Management", href: "/admin/users", iconName: "" },
      { key: "user-management.roles", label: "Setup Role Access", href: "/admin/roles", iconName: "" },
      { key: "user-management.approval", label: "Approval User & Role", href: "/admin/approval", iconName: "" },
    ],
  },
  {
    key: "ekosistem",
    label: "Manajemen Ekosistem",
    href: "/admin/ekosistem/daftar",
    iconName: "Building2",
    children: [
      { key: "ekosistem.kategori", label: "Kategori Ekosistem", href: "/admin/ekosistem/kategori", iconName: "" },
      { key: "ekosistem.daftar", label: "Daftar Ekosistem", href: "/admin/ekosistem/daftar", iconName: "" },
      { key: "ekosistem.approval", label: "Approval Ekosistem", href: "/admin/ekosistem/approval", iconName: "" },
    ],
  },
  {
    key: "platform-management",
    label: "Platform Management",
    href: "/admin/platform/daftar",
    iconName: "Server",
    children: [
      { key: "platform-management.daftar", label: "Daftar Platform", href: "/admin/platform/daftar", iconName: "" },
      { key: "platform-management.approval", label: "Approval Data Platform", href: "/admin/platform/approval", iconName: "" },
    ],
  },
  { key: "member-management", label: "Management Member", href: "/bappebti/member", iconName: "IdCard" },
  {
    key: "routing",
    label: "Routing Mapping",
    href: "/admin/routing/setup",
    iconName: "Route",
    children: [
      { key: "routing.setup", label: "Setup Routing Mapping", href: "/admin/routing/setup", iconName: "" },
      { key: "routing.approval", label: "Approval Routing", href: "/admin/routing/approval", iconName: "" },
    ],
  },
  {
    key: "konfigurasi",
    label: "Konfigurasi",
    href: "/admin/konfigurasi/kategori-pengaduan",
    iconName: "Settings2",
    children: [
      { key: "konfigurasi.kategori", label: "Kategori Pengaduan", href: "/admin/konfigurasi/kategori-pengaduan", iconName: "" },
      { key: "konfigurasi.sla", label: "Manajemen SLA", href: "/admin/konfigurasi/sla", iconName: "" },
      { key: "konfigurasi.category-ecosystem", label: "Category Ecosystem", href: "/admin/konfigurasi/category-ecosystem", iconName: "" },
      { key: "konfigurasi.approval", label: "Approval Configuration", href: "/admin/konfigurasi/approval", iconName: "" },
    ],
  },
  { key: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs", iconName: "History" },
];

/** Flattened list of every selectable key (parents + children) for the role builder. */
export function flattenMenuTree(tree: MenuTreeItem[] = MENU_TREE): MenuTreeItem[] {
  const out: MenuTreeItem[] = [];
  for (const item of tree) {
    out.push(item);
    if (item.children) out.push(...item.children);
  }
  return out;
}

export function getMenuLabel(key: string): string {
  return flattenMenuTree().find((i) => i.key === key)?.label ?? key;
}
