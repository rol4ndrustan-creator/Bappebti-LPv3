// Filter demografi pengadu (List Revisi 12 #8).

import { ComplaintCase } from "./types";

export const AGE_GROUPS = ["18–25 tahun", "26–35 tahun", "36–45 tahun", "46–55 tahun", "> 55 tahun"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export function ageGroupOf(age?: number): AgeGroup | "Tidak diketahui" {
  if (!age) return "Tidak diketahui";
  if (age <= 25) return "18–25 tahun";
  if (age <= 35) return "26–35 tahun";
  if (age <= 45) return "36–45 tahun";
  if (age <= 55) return "46–55 tahun";
  return "> 55 tahun";
}

/** Provinsi domisili pengadu: dari profil, atau bagian setelah koma pada "Kota, Provinsi". */
export function regionOf(c: ComplaintCase): string {
  return c.reporter?.province ?? c.reporterCity?.split(",").pop()?.trim() ?? "Tidak diketahui";
}
