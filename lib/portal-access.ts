// User & Role Management per portal ekosistem (List Revisi 11 #4):
// lembaga yang dikelola, role bawaan, dan staf contoh untuk Portal Platform,
// Ekosistem Active, dan Ekosistem Pengawas.

import { ECOSYSTEM_ENTITIES } from "./mock-data";
import { AdminUser, RoleDefinition } from "./types";

export type PortalKey = NonNullable<RoleDefinition["portal"]>;

export interface PortalAccessConfig {
  key: PortalKey;
  title: string;
  description: string;
  /** Lembaga yang penggunanya dikelola di portal ini. */
  organizations: string[];
  /** Menu portal yang dapat dipilih sebagai hak akses role. */
  menus: string[];
  emailPlaceholder: string;
}

const namesOf = (...categories: string[]) =>
  ECOSYSTEM_ENTITIES.filter((e) => categories.includes(e.category)).map((e) => e.name);

export const PORTAL_ACCESS: Record<PortalKey, PortalAccessConfig> = {
  Platform: {
    key: "Platform",
    title: "User & Role Management",
    description: "Kelola admin pialang, tim CS, dan tim compliance beserta hak aksesnya.",
    organizations: namesOf("Platform/Pialang"),
    menus: [
      "Dashboard Platform",
      "Manajemen Pengaduan",
      "Perselisihan Nasabah",
      "Musyawarah",
      "Manajemen Tugas",
      "Manajemen Member",
      "SLA & Resolution",
      "Klarifikasi",
      "Reporting",
      "User & Role Management",
      "Audit Log",
    ],
    emailPlaceholder: "nama@pialang.co.id",
  },
  EkosistemActive: {
    key: "EkosistemActive",
    title: "User & Role Management",
    description: "Kelola staf penanganan Bursa, Kliring, dan Custody beserta hak aksesnya.",
    organizations: namesOf("Bursa", "Kliring", "Custody"),
    menus: ["Manajemen Pengaduan", "Mediasi Perselisihan", "Musyawarah", "Manajemen Tugas", "Data Member", "User & Role Management", "Audit Log"],
    emailPlaceholder: "nama@bursa.co.id",
  },
  EkosistemPengawas: {
    key: "EkosistemPengawas",
    title: "User & Role Management",
    description: "Kelola tim audit asosiasi dan lembaga pengawas beserta hak aksesnya.",
    organizations: namesOf("Asosiasi"),
    menus: ["Manajemen Pengaduan", "Musyawarah", "Manajemen Tugas", "Data Member", "User & Role Management", "Audit Log"],
    emailPlaceholder: "nama@aspebtindo.or.id",
  },
};

const role = (portal: PortalKey, id: string, name: string, description: string, menuKeys: string[]): RoleDefinition => ({
  id: `role-${portal.toLowerCase()}-${id}`,
  portal,
  name,
  description,
  menuKeys,
  createdAt: "01 Jun 2026",
  builtIn: true,
});

const ALL = (p: PortalKey) => PORTAL_ACCESS[p].menus;

export const PORTAL_ROLE_SEED: RoleDefinition[] = [
  role("Platform", "admin", "Admin Pialang", "Akses penuh portal pialang termasuk pengelolaan pengguna.", ALL("Platform")),
  role("Platform", "cs", "Tim Customer Service", "Menangani pengaduan, klarifikasi, dan respon kepada nasabah.", [
    "Manajemen Pengaduan",
    "Musyawarah",
    "Manajemen Tugas",
    "Klarifikasi",
  ]),
  role("Platform", "compliance", "Tim Compliance", "Memantau kepatuhan penanganan, perselisihan, dan jejak audit.", [
    "Dashboard Platform",
    "Manajemen Pengaduan",
    "Perselisihan Nasabah",
    "Musyawarah",
    "SLA & Resolution",
    "Reporting",
    "Audit Log",
  ]),
  role("EkosistemActive", "coord", "Koordinator Ekosistem", "Akses penuh portal Ekosistem Active.", ALL("EkosistemActive")),
  role("EkosistemActive", "bursa", "Petugas Penanganan Bursa", "Mediasi perselisihan dan supervisi pialang anggota bursa.", [
    "Manajemen Pengaduan",
    "Mediasi Perselisihan",
    "Musyawarah",
    "Manajemen Tugas",
  ]),
  role("EkosistemActive", "kliring", "Petugas Penanganan Kliring", "Rekonsiliasi settlement dan tindak lanjut tugas kliring.", [
    "Manajemen Pengaduan",
    "Musyawarah",
    "Manajemen Tugas",
  ]),
  role("EkosistemActive", "custody", "Petugas Penanganan Custody", "Verifikasi aset kustodian terkait pengaduan.", ["Manajemen Pengaduan", "Manajemen Tugas"]),
  role("EkosistemPengawas", "coord", "Koordinator Pengawas", "Akses penuh portal Ekosistem Pengawas.", ALL("EkosistemPengawas")),
  role("EkosistemPengawas", "auditor", "Auditor Asosiasi", "Pemantauan read-only pengaduan, musyawarah, dan jejak audit.", [
    "Manajemen Pengaduan",
    "Musyawarah",
    "Audit Log",
  ]),
];

const user = (name: string, email: string, role: string, organization: string, status: AdminUser["status"], lastLogin: string): AdminUser => ({
  name,
  email,
  role,
  organization,
  status,
  lastLogin,
});

export const PORTAL_USER_SEED: AdminUser[] = [
  user("Ferry Hartono", "ferry.hartono@bdn.co.id", "Admin Pialang", "PT Bursa Digital Nusantara", "Aktif", "15 Jun 2026, 08:10"),
  user("Rina Kusuma", "rina.kusuma@bdn.co.id", "Tim Customer Service", "PT Bursa Digital Nusantara", "Aktif", "15 Jun 2026, 09:02"),
  user("Andi Prasetyo", "andi.prasetyo@bdn.co.id", "Tim Compliance", "PT Bursa Digital Nusantara", "Aktif", "14 Jun 2026, 16:45"),
  user("Indra Kusnadi", "indra.kusnadi@indodax.co.id", "Tim Customer Service", "PT Indodax Nasional Indonesia", "Aktif", "15 Jun 2026, 10:20"),
  user("Yoga Pratama", "yoga.pratama@cib.co.id", "Tim Customer Service", "PT Crypto Indonesia Berkat", "Aktif", "15 Jun 2026, 09:10"),
  user("Siska Amelia", "siska.amelia@monex.co.id", "Tim Compliance", "PT Monex Investindo Futures", "Nonaktif", "02 Mei 2026, 11:00"),
  user("Galih Nugraha", "galih.nugraha@ekosistem.id", "Koordinator Ekosistem", "Bursa Berjangka Jakarta", "Aktif", "15 Jun 2026, 08:40"),
  user("Ahmad Pratama", "ahmad.pratama@bbj.co.id", "Petugas Penanganan Bursa", "Bursa Berjangka Jakarta", "Aktif", "15 Jun 2026, 08:30"),
  user("Sari Wulandari", "sari.wulandari@kbi.co.id", "Petugas Penanganan Kliring", "Kliring Berjangka Indonesia", "Aktif", "15 Jun 2026, 10:05"),
  user("Budi Santoso", "budi.santoso@kbi.co.id", "Petugas Penanganan Kliring", "Kliring Berjangka Indonesia", "Nonaktif", "20 Mei 2026, 14:15"),
  user("Maya Lestari", "maya.lestari@kustodian.co.id", "Petugas Penanganan Custody", "PT Kustodian Aset Komoditi Indonesia", "Aktif", "13 Jun 2026, 15:20"),
  user("Wulan Kartika", "wulan.kartika@aspebtindo.or.id", "Koordinator Pengawas", "Asosiasi Pialang Berjangka Indonesia", "Aktif", "15 Jun 2026, 11:15"),
  user("Lina Hapsari", "lina.hapsari@aspebtindo.or.id", "Auditor Asosiasi", "Asosiasi Pialang Berjangka Indonesia", "Aktif", "13 Jun 2026, 14:00"),
  user("Rudi Hartanto", "rudi.hartanto@bakti.or.id", "Auditor Asosiasi", "Badan Arbitrase Perdagangan Berjangka Komoditi Indonesia", "Aktif", "12 Jun 2026, 09:30"),
];
