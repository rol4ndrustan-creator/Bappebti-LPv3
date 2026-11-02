"use client";

// Parameter Konfigurasi Bisnis & SLA (List Revisi 12 #8, #15).

import * as React from "react";
import { BusinessParams } from "../types";
import { subscribe, emitChange, getVersion } from "./event-bus";
import { logAudit } from "./audit-store";
import { useClock } from "../clock";

export const DEFAULT_PARAMS: BusinessParams = {
  slaReviewPialangBusinessDays: 1,
  slaPenyelesaianDays: 60,
  kedaluwarsaDays: 730,
  arbitrationWindowBusinessDays: 20,
  resolutionResponseDays: 7,
};

export const PARAM_LABEL: Record<keyof BusinessParams, { label: string; unit: string; help: string }> = {
  slaReviewPialangBusinessDays: {
    label: "SLA Review Pialang",
    unit: "hari kerja",
    help: "Batas waktu verifikasi komplain baru oleh Pialang. Jika terlewati, komplain otomatis disetujui (auto-approved) dan lanjut ke musyawarah.",
  },
  slaPenyelesaianDays: {
    label: "SLA Penyelesaian Kasus",
    unit: "hari",
    help: "Total waktu penanganan sengketa sejak tiket terbit; ditampilkan sebagai hitung mundur sisa hari pada kartu status.",
  },
  kedaluwarsaDays: {
    label: "Batas Kedaluwarsa Perkara",
    unit: "hari",
    help: "Umur maksimal perkara sejak tanggal kejadian (standar 730 hari / 2 tahun). Pengaduan atas kejadian yang lebih lama tidak dapat diajukan.",
  },
  arbitrationWindowBusinessDays: {
    label: "Jendela Waktu Arbitrase",
    unit: "hari kerja",
    help: "Masa aktif tombol pengajuan arbitrase bagi nasabah setelah musyawarah/mediasi Tidak Sepakat (standar 20 hari kerja, mulai H+1).",
  },
  resolutionResponseDays: {
    label: "Tenggat Persetujuan Resolusi Nasabah",
    unit: "hari",
    help: "Jika nasabah tidak menyetujui/menolak tawaran resolusi dalam batas ini, tiket otomatis ditutup dengan status Close Auto.",
  },
};

const KEY = "bappebti-demo-business-params";

export function readParams(): BusinessParams {
  if (typeof window === "undefined") return DEFAULT_PARAMS;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PARAMS, ...(JSON.parse(raw) as Partial<BusinessParams>) } : DEFAULT_PARAMS;
  } catch {
    return DEFAULT_PARAMS;
  }
}

export function updateParams(next: BusinessParams) {
  const before = readParams();
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore persistence failures in the prototype
  }
  const changes = (Object.keys(next) as (keyof BusinessParams)[])
    .filter((k) => next[k] !== before[k])
    .map((k) => `${PARAM_LABEL[k].label}: ${before[k]} → ${next[k]} ${PARAM_LABEL[k].unit}`);
  if (changes.length) logAudit({ activity: "Ubah Parameter Bisnis & SLA", detail: changes.join("; ") });
  emitChange();
}

export function useBusinessParams(): BusinessParams {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  // Nilai tersimpan hanya dibaca setelah hydration (prerender selalu memakai default).
  const mounted = useClock() !== null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces re-read after updates
  return React.useMemo(() => (mounted ? readParams() : DEFAULT_PARAMS), [version, mounted]);
}
