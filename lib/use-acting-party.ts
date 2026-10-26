"use client";

// Peran & lembaga pengguna yang sedang bertindak, dipakai untuk label
// pengirim respon publik dan pengaju jadwal musyawarah.

import { useDemoSession } from "./demo-session";
import { useOptionalEkosistemActiveRole } from "./ekosistem-active-role";
import { getViewerGroup } from "./permissions";
import { ComplaintCase, MeetingProposerRole } from "./types";

export interface ActingParty {
  name: string;
  role: MeetingProposerRole;
  institution: string;
}

export function useActingParty(): (c?: ComplaintCase) => ActingParty {
  const { user } = useDemoSession();
  const ekosistemRole = useOptionalEkosistemActiveRole();
  return (c) => {
    const group = getViewerGroup(user.role);
    if (group === "Bappebti") return { name: user.name, role: "Bappebti", institution: "Bappebti" };
    if (group === "Platform") return { name: user.name, role: "Platform", institution: user.institution };
    if (user.role.startsWith("BURSA_")) return { name: user.name, role: "Bursa", institution: user.institution };
    if (user.role.startsWith("CLEARING_")) return { name: user.name, role: "Kliring", institution: user.institution };
    const type = ekosistemRole?.roleType ?? "Bursa";
    const institution = !c
      ? user.institution
      : type === "Bursa"
        ? c.institution?.bursa ?? c.bursaEntity
        : type === "Kliring"
          ? c.institution?.clearing ?? c.kliringEntity
          : c.linkedEcosystemEntities?.find((e) => e.type === "Custody")?.name ?? user.institution;
    return { name: user.name, role: type, institution };
  };
}
