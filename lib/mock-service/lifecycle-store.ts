"use client";

// Penyimpanan siklus tiket (List Revisi 12). Seed relatif terhadap waktu
// sekarang (lib/lifecycle-seed.ts); setiap tindakan menyimpan catatan siklus
// lengkap per tiket di localStorage.

import * as React from "react";
import { ComplaintCase, TicketLifecycle } from "../types";
import { lifecycleSeed } from "../lifecycle-seed";
import { LifecycleView, deriveLifecycle } from "../ticket-lifecycle";
import { useClock } from "../clock";
import { useBusinessParams } from "./params-store";
import { subscribe, emitChange, getVersion } from "./event-bus";

const KEY = "bappebti-demo-lifecycles";

function readAll(): Record<string, TicketLifecycle> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, TicketLifecycle>) : {};
  } catch {
    return {};
  }
}

export function getLifecycle(ticket: string, now: Date): TicketLifecycle {
  return readAll()[ticket] ?? lifecycleSeed(ticket, now);
}

/** Simpan perubahan berdasarkan catatan siklus terkini (seed atau tersimpan). */
export function updateLifecycle(ticket: string, fn: (lc: TicketLifecycle) => TicketLifecycle) {
  const all = readAll();
  all[ticket] = fn(structuredClone(all[ticket] ?? lifecycleSeed(ticket, new Date())));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore persistence failures in the prototype
  }
  emitChange();
}

/** Status siklus per tiket; null selama prerender/hydration. */
export function useLifecycleViews(): (c: ComplaintCase | string) => LifecycleView | null {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  const now = useClock();
  const params = useBusinessParams();
  return React.useCallback(
    (c: ComplaintCase | string) => (now ? deriveLifecycle(getLifecycle(typeof c === "string" ? c : c.ticket, now), params, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces recomputation when the store changes
    [now, params, version]
  );
}

export function useLifecycleView(c: ComplaintCase | string | undefined): LifecycleView | null {
  const get = useLifecycleViews();
  return c ? get(c) : null;
}
