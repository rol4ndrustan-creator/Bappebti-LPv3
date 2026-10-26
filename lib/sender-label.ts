// Label asal lembaga & nama pengirim untuk setiap balon percakapan
// "Respon ke Public", mis. "[Kliring: Kliring Berjangka Indonesia] Sari Wulandari".

import { ClarificationMessage, ComplaintCase } from "./types";

/** Lembaga default berdasarkan peran pengirim, untuk pesan lama yang belum menyimpan lembaganya. */
function defaultInstitution(role: string, c?: ComplaintCase): string | undefined {
  if (role === "Bappebti") return "Bappebti";
  if (!c) return undefined;
  switch (role) {
    case "Platform":
      return c.platform;
    case "Bursa":
      return c.institution?.bursa ?? c.bursaEntity;
    case "Kliring":
      return c.institution?.clearing ?? c.kliringEntity;
    case "Custody":
      return c.linkedEcosystemEntities?.find((e) => e.type === "Custody")?.name;
    default:
      return undefined;
  }
}

export interface SenderLabel {
  /** "[Peran: Lembaga]" atau "[Pelapor]". */
  tag: string;
  name: string;
}

export function getSenderLabel(m: ClarificationMessage, c?: ComplaintCase): SenderLabel {
  if (m.role === "Pelapor") return { tag: "[Pelapor]", name: m.from };
  const institution = m.institution ?? defaultInstitution(m.role, c);
  return { tag: institution && institution !== m.role ? `[${m.role}: ${institution}]` : `[${m.role}]`, name: m.from };
}

export function formatSenderLabel(m: ClarificationMessage, c?: ComplaintCase): string {
  const l = getSenderLabel(m, c);
  return `${l.tag} ${l.name}`;
}
