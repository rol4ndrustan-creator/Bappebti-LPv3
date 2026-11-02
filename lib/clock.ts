"use client";

// Jam demo bersama: null saat prerender/hydration, lalu waktu nyata (diperbarui
// tiap menit) agar status berbasis waktu tidak menyebabkan hydration mismatch.

import * as React from "react";

let minute = 0;
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(l: () => void) {
  listeners.add(l);
  if (timer === undefined && typeof window !== "undefined") {
    minute = Math.floor(Date.now() / 60_000);
    timer = window.setInterval(() => {
      minute = Math.floor(Date.now() / 60_000);
      listeners.forEach((fn) => fn());
    }, 30_000);
  }
  return () => {
    listeners.delete(l);
  };
}

export function useClock(): Date | null {
  const m = React.useSyncExternalStore(
    subscribe,
    () => minute || Math.floor(Date.now() / 60_000),
    () => 0
  );
  return React.useMemo(() => (m ? new Date() : null), [m]);
}
