"use client";

// Approval Configuration — every Kategori Pengaduan, Manajemen SLA, and
// Category Ecosystem change is staged here first and only takes effect
// once approved. On approval the dispatcher below applies the staged
// payload to the relevant underlying store (category-store, sla-store,
// ecosystem-category-store); on rejection nothing changes.

import * as React from "react";
import { ConfigChangeRequest } from "../types";
import { subscribe, emitChange, getVersion } from "./event-bus";
import { addCategory, setCategoryActive } from "./category-store";
import { addSlaEntry } from "./sla-store";
import { addEcosystemCategory, setEcosystemCategoryActive } from "./ecosystem-category-store";
import { nowDateTimeID } from "../format";

const ADDED_KEY = "bappebti-demo-added-config-requests";
const DECISIONS_KEY = "bappebti-demo-config-decisions";

interface Decision {
  status: "Disetujui" | "Ditolak";
  decidedBy: string;
  decidedAt: string;
  reason?: string;
}

type DecisionMap = Record<string, Decision>;

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

export function requestConfigChange(input: Omit<ConfigChangeRequest, "id" | "status" | "requestedAt">): ConfigChangeRequest {
  const request: ConfigChangeRequest = {
    ...input,
    id: `CFR-${Date.now().toString(36).toUpperCase()}`,
    requestedAt: nowDateTimeID(),
    status: "Menunggu",
  };
  writeJSON(ADDED_KEY, [...readJSON<ConfigChangeRequest[]>(ADDED_KEY, []), request]);
  return request;
}

function applyConfigChange(req: ConfigChangeRequest, decidedBy: string) {
  const data = JSON.parse(req.payload) as Record<string, string | number | undefined>;
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  if (req.configType === "Kategori Pengaduan") {
    if (req.action === "Tambah") {
      addCategory({ id: `CAT-${Date.now().toString(36).toUpperCase()}`, name: String(data.name), active: true, createdAt: today });
    } else if (req.action === "Nonaktifkan" || req.action === "Aktifkan") {
      setCategoryActive(String(data.id), req.action === "Aktifkan");
    }
  } else if (req.configType === "Manajemen SLA") {
    addSlaEntry({
      id: `SLA-${Date.now().toString(36).toUpperCase()}`,
      hours: Number(data.hours),
      effectiveFrom: today,
      changedBy: decidedBy,
      note: data.note ? String(data.note) : undefined,
    });
  } else if (req.configType === "Kategori Ekosistem") {
    if (req.action === "Tambah") {
      addEcosystemCategory({
        id: `ECAT-${Date.now().toString(36).toUpperCase()}`,
        type: data.type as "Ecosystem Aktif" | "Ecosystem Pasif",
        shortDescription: String(data.shortDescription),
        longDescription: String(data.longDescription ?? ""),
        active: true,
        createdAt: today,
        displayDate: today,
        userMaker: req.requestedBy,
        userApproval: decidedBy,
      });
    } else if (req.action === "Nonaktifkan" || req.action === "Aktifkan") {
      setEcosystemCategoryActive(String(data.id), req.action === "Aktifkan");
    }
  }
}

export function decideConfigChange(req: ConfigChangeRequest, status: "Disetujui" | "Ditolak", decidedBy: string, reason?: string) {
  if (status === "Disetujui") applyConfigChange(req, decidedBy);
  const decisions = readJSON<DecisionMap>(DECISIONS_KEY, {});
  decisions[req.id] = { status, decidedBy, decidedAt: nowDateTimeID(), reason };
  writeJSON(DECISIONS_KEY, decisions);
}

export function useConfigChangeRequests(seed: ConfigChangeRequest[]): ConfigChangeRequest[] {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  return React.useMemo(() => {
    const added = readJSON<ConfigChangeRequest[]>(ADDED_KEY, []);
    const decisions = readJSON<DecisionMap>(DECISIONS_KEY, {});
    return [...seed, ...added].map((r) => {
      const d = decisions[r.id];
      return d ? { ...r, status: d.status, decidedBy: d.decidedBy, decidedAt: d.decidedAt, reason: d.reason ?? r.reason } : r;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version isn't read in the body, it only forces recomputation when the store changes
  }, [seed, version]);
}
