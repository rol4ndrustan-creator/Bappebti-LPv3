"use client";

// Audit Log operasional (List Revisi 11 #6): setiap aktivitas penting
// (publikasi respon, unduh PDF, jadwal musyawarah, ubah status tugas, dst.)
// dicatat beserta pengguna & lembaganya. Seed tetap read-only; event baru
// disimpan di localStorage seperti store lainnya.

import * as React from "react";
import { AuditPortal, OperationalAuditEvent } from "../types";
import { DEFAULT_DEMO_USER_ID, DEMO_USERS, ROLE_LABEL, getViewerGroup } from "../permissions";
import { subscribe, emitChange, getVersion } from "./event-bus";

const KEY = "bappebti-demo-audit-events";
const DEMO_ROLE_KEY = "bappebti-demo-role";

function read(): OperationalAuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OperationalAuditEvent[]) : [];
  } catch {
    return [];
  }
}

/** Pengguna demo yang sedang login (Mode Demonstrasi). */
function currentUser() {
  let id = DEFAULT_DEMO_USER_ID;
  try {
    id = window.localStorage.getItem(DEMO_ROLE_KEY) ?? id;
  } catch {
    // ignore
  }
  return DEMO_USERS.find((u) => u.id === id) ?? DEMO_USERS[0];
}

const GROUP_TO_PORTAL: Record<ReturnType<typeof getViewerGroup>, AuditPortal> = {
  User: "Publik",
  Bappebti: "Bappebti",
  Platform: "Platform",
  EkosistemActive: "EkosistemActive",
  EkosistemPengawas: "EkosistemPengawas",
};

export function logAudit(entry: { activity: string; ticket?: string; detail: string }) {
  if (typeof window === "undefined") return;
  const u = currentUser();
  const event: OperationalAuditEvent = {
    id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    userName: u.name,
    institution: u.institution,
    roleLabel: ROLE_LABEL[u.role],
    portal: GROUP_TO_PORTAL[getViewerGroup(u.role)],
    ...entry,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...read(), event]));
  } catch {
    // ignore persistence failures in the prototype
  }
  emitChange();
}

export function resetAuditEvents() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Seed + event baru, terbaru di atas. */
export function useAuditEvents(seed: OperationalAuditEvent[]): OperationalAuditEvent[] {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces recomputation when the store changes
  return React.useMemo(() => [...seed, ...read()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [seed, version]);
}
