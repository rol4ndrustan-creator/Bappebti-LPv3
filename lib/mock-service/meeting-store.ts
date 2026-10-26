"use client";

// Pertemuan Musyawarah (List Revisi 11 #1-#3). Seed di lib/meeting-seed.ts
// tetap read-only; jadwal baru dan catatan hasil disimpan di localStorage.

import * as React from "react";
import { MusyawarahMeeting } from "../types";
import { subscribe, emitChange, getVersion } from "./event-bus";

const ADDED_KEY = "bappebti-demo-meetings";
const OUTCOME_KEY = "bappebti-demo-meeting-outcomes";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore persistence failures in the prototype
  }
  emitChange();
}

export function addMeeting(meeting: Omit<MusyawarahMeeting, "id" | "createdAt">): MusyawarahMeeting {
  const full: MusyawarahMeeting = {
    ...meeting,
    id: `MSY-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  writeJSON(ADDED_KEY, [...readJSON<MusyawarahMeeting[]>(ADDED_KEY, []), full]);
  return full;
}

export function recordMeetingOutcome(id: string, outcome: NonNullable<MusyawarahMeeting["outcome"]>) {
  const map = readJSON<Record<string, MusyawarahMeeting["outcome"]>>(OUTCOME_KEY, {});
  map[id] = outcome;
  writeJSON(OUTCOME_KEY, map);
}

function merge(seed: MusyawarahMeeting[]): MusyawarahMeeting[] {
  const outcomes = readJSON<Record<string, MusyawarahMeeting["outcome"]>>(OUTCOME_KEY, {});
  return [...seed, ...readJSON<MusyawarahMeeting[]>(ADDED_KEY, [])].map((m) => (outcomes[m.id] ? { ...m, outcome: outcomes[m.id] } : m));
}

export function useMeetings(seed: MusyawarahMeeting[]): MusyawarahMeeting[] {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces recomputation when the store changes
  return React.useMemo(() => merge(seed), [seed, version]);
}
