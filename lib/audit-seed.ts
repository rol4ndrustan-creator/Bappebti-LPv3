// Data contoh Audit Log operasional (List Revisi 11 #6): riwayat Bappebti
// lama (AUDIT_LOGS) dikonversi ke format baru, ditambah contoh per portal.

import { AUDIT_LOGS } from "./mock-data";
import { parseMockDateTime } from "./clarification-workflow";
import { AuditPortal, OperationalAuditEvent } from "./types";

/** "15 Jun 2026, 14:05" (WIB) → ISO. */
function wibIso(mock: string): string {
  const d = parseMockDateTime(mock);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - 7, d.getMinutes())).toISOString();
}

function legacyPortal(role: string): AuditPortal {
  if (role.startsWith("Bappebti")) return "Bappebti";
  if (role === "Bursa" || role === "Kliring") return "EkosistemActive";
  if (role === "Platform") return "Platform";
  return "Sistem";
}

function legacyInstitution(role: string): string {
  if (role.startsWith("Bappebti")) return "Bappebti";
  if (role === "Bursa") return "Bursa Berjangka Jakarta";
  if (role === "Kliring") return "Kliring Berjangka Indonesia";
  return role;
}

const LEGACY: OperationalAuditEvent[] = AUDIT_LOGS.map((l, i) => ({
  id: `AUD-LEGACY-${i}`,
  timestamp: wibIso(l.timestamp),
  userName: l.actor,
  institution: legacyInstitution(l.role),
  roleLabel: l.role,
  portal: legacyPortal(l.role),
  activity: l.action,
  ticket: l.object.startsWith("BPP-") ? l.object : undefined,
  detail: l.before === l.after ? `Status tetap '${l.after}'${l.reason ? ` — ${l.reason}` : ""}.` : `Memperbarui dari '${l.before}' menjadi '${l.after}'.`,
}));

const PORTAL_EXAMPLES: OperationalAuditEvent[] = [
  {
    id: "AUD-SEED-P1",
    timestamp: wibIso("14 Jun 2026, 09:20"),
    userName: "Rina Kusuma",
    institution: "PT Bursa Digital Nusantara",
    roleLabel: "Petugas Kasus Platform",
    portal: "Platform",
    activity: "Ubah Status Tugas",
    ticket: "BPP-2026-000184",
    detail: "Memperbarui status tugas 'Konfirmasi status penarikan ke bank kustodian' dari 'Pending' menjadi 'In Progress'.",
  },
  {
    id: "AUD-SEED-P2",
    timestamp: wibIso("14 Jun 2026, 15:42"),
    userName: "Ferry Hartono",
    institution: "PT Bursa Digital Nusantara",
    roleLabel: "Supervisor Platform",
    portal: "Platform",
    activity: "Publikasi Respon Publik",
    ticket: "BPP-2026-000184",
    detail: "Mempublikasikan respon ke kolom tanggapan publik dan mengirim salinan ke email pelapor.",
  },
  {
    id: "AUD-SEED-E1",
    timestamp: wibIso("14 Jun 2026, 10:05"),
    userName: "Sari Wulandari",
    institution: "Kliring Berjangka Indonesia",
    roleLabel: "Petugas Kasus Kliring",
    portal: "EkosistemActive",
    activity: "Unduh PDF Rekap Kasus",
    ticket: "BPP-2026-000186",
    detail: "Mengunduh Detail-Pengaduan-BPP-2026-000186.pdf (ber-watermark identitas pengunduh).",
  },
  {
    id: "AUD-SEED-E2",
    timestamp: wibIso("15 Jun 2026, 08:30"),
    userName: "Ahmad Pratama",
    institution: "Bursa Berjangka Jakarta",
    roleLabel: "Petugas Kasus Bursa",
    portal: "EkosistemActive",
    activity: "Buat Jadwal Musyawarah",
    ticket: "BPP-2026-000187",
    detail: "Menjadwalkan 'Musyawarah Lanjutan Kendala Respons Platform #BPP-2026-000187' (Tautan Video Conference).",
  },
  {
    id: "AUD-SEED-W1",
    timestamp: wibIso("15 Jun 2026, 11:15"),
    userName: "Wulan Kartika",
    institution: "Koordinator Ekosistem Pengawas (ASPEBTINDO & BAKTI)",
    roleLabel: "Koordinator Ekosistem Pengawas",
    portal: "EkosistemPengawas",
    activity: "Unduh PDF Rekap Kasus",
    ticket: "BPP-2026-000189",
    detail: "Mengunduh Detail-Pengaduan-BPP-2026-000189.pdf untuk keperluan pemantauan kepatuhan.",
  },
  {
    id: "AUD-SEED-W2",
    timestamp: wibIso("13 Jun 2026, 14:00"),
    userName: "Lina Hapsari",
    institution: "Asosiasi Pialang Berjangka Indonesia",
    roleLabel: "Petugas Asosiasi",
    portal: "EkosistemPengawas",
    activity: "Tambah Pengguna",
    detail: "Menambahkan pengguna 'Rudi Hartanto' (Auditor Asosiasi) dengan status Aktif.",
  },
];

export const AUDIT_SEED: OperationalAuditEvent[] = [...LEGACY, ...PORTAL_EXAMPLES];
