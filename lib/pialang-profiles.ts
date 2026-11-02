// Data simulasi "Profiling Bappebti": pejabat berizin per Pialang (Direksi,
// Kepala Cabang, Wakil Pialang Berjangka). Dipakai onboarding tahap 4 dan
// pemilihan pihak terlapor pada formulir pengaduan publik. Nama bersifat
// fiktif — di produksi data ditarik dari sistem Profiling Bappebti.

import { PialangOfficial } from "./types";

const FIRST = ["Adi", "Bayu", "Citra", "Dimas", "Eka", "Fajar", "Gita", "Hadi", "Intan", "Joko", "Kurnia", "Laras", "Mira", "Nanda", "Oki", "Putra", "Rani", "Satria", "Tari", "Wira"];
const LAST = ["Santoso", "Wibowo", "Lestari", "Pratama", "Kusuma", "Saputra", "Hidayat", "Permata", "Nugroho", "Wijaya", "Susanto", "Rahayu", "Setiawan", "Utami"];
const CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const POSITIONS: { position: PialangOfficial["position"]; count: number; prefix: string }[] = [
  { position: "Direksi", count: 2, prefix: "DIR" },
  { position: "Kepala Cabang", count: 2, prefix: "KC" },
  { position: "Wakil Pialang Berjangka (WPB)", count: 3, prefix: "WPB" },
];

/** Daftar pejabat berizin (simulasi) untuk satu Pialang, deterministik per nama. */
export function getPialangOfficials(pialang: string): PialangOfficial[] {
  if (!pialang) return [];
  let seed = hash(pialang);
  const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0);
  const used = new Set<string>();
  const out: PialangOfficial[] = [];
  for (const { position, count, prefix } of POSITIONS) {
    for (let i = 0; i < count; i++) {
      let name = "";
      do name = `${FIRST[next() % FIRST.length]} ${LAST[next() % LAST.length]}`;
      while (used.has(name));
      used.add(name);
      out.push({
        id: `${prefix}-${hash(pialang + name).toString(36).slice(0, 6)}`,
        position,
        name,
        licenseNumber: `${prefix}-${String(next() % 9000 + 1000)}/BAPPEBTI/${2018 + (next() % 7)}`,
        office: position === "Direksi" ? "Kantor Pusat" : `Cabang ${CITIES[next() % CITIES.length]}`,
      });
    }
  }
  return out;
}
