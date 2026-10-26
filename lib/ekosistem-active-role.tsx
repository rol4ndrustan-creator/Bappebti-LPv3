"use client";

// Role switcher for the Ekosistem Active portal (List Revisi 4 #5A). The
// coordinator persona represents Bursa, Kliring and Custody collectively —
// this lets them pick which of the three they're currently acting as, and
// every page under /ekosistem/active/* (dashboard metrics, Manajemen
// Pengaduan, Data Member) filters to that context. Scoped to this portal
// only, so it's a plain Context (mounted once in the layout, which stays
// alive across client-side navigation within /ekosistem/active/*) rather
// than the global localStorage+event-bus mock-service pattern used for
// data that must sync across independently-mounted pages.

import * as React from "react";

export type EkosistemActiveRoleType = "Bursa" | "Kliring" | "Custody";

const STORAGE_KEY = "bappebti-ekosistem-active-role";
const ROLE_TYPES: EkosistemActiveRoleType[] = ["Bursa", "Kliring", "Custody"];

interface EkosistemActiveRoleContextValue {
  roleType: EkosistemActiveRoleType;
  setRoleType: (type: EkosistemActiveRoleType) => void;
}

const EkosistemActiveRoleContext = React.createContext<EkosistemActiveRoleContextValue | null>(null);

export function EkosistemActiveRoleProvider({ children }: { children: React.ReactNode }) {
  const [roleType, setRoleTypeState] = React.useState<EkosistemActiveRoleType>("Bursa");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (ROLE_TYPES as string[]).includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with localStorage on mount, required to avoid SSR/static-export hydration mismatch
        setRoleTypeState(stored as EkosistemActiveRoleType);
      }
    } catch {
      // localStorage unavailable (e.g. private mode) — fall back to default role.
    }
  }, []);

  const setRoleType = React.useCallback((type: EkosistemActiveRoleType) => {
    setRoleTypeState(type);
    try {
      window.localStorage.setItem(STORAGE_KEY, type);
    } catch {
      // ignore persistence failures in the prototype
    }
  }, []);

  const value = React.useMemo(() => ({ roleType, setRoleType }), [roleType, setRoleType]);

  return <EkosistemActiveRoleContext.Provider value={value}>{children}</EkosistemActiveRoleContext.Provider>;
}

export function useEkosistemActiveRole(): EkosistemActiveRoleContextValue {
  const ctx = React.useContext(EkosistemActiveRoleContext);
  if (!ctx) throw new Error("useEkosistemActiveRole must be used within EkosistemActiveRoleProvider");
  return ctx;
}

export const EKOSISTEM_ACTIVE_ROLE_TYPES = ROLE_TYPES;

/** Seperti useEkosistemActiveRole, tetapi mengembalikan null di luar portal Ekosistem Active (tidak melempar error). */
export function useOptionalEkosistemActiveRole(): EkosistemActiveRoleContextValue | null {
  return React.useContext(EkosistemActiveRoleContext);
}
