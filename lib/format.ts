import { OwnerType } from "./types";
import { SlaClockStatus } from "./types";

export function formatCurrencyIDR(value?: number): string {
  if (value === undefined || value === null) return "-";
  return "Rp" + value.toLocaleString("id-ID");
}

export function formatDateID(value?: string | Date): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatDateTimeID(value?: string | Date): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nowDateTimeID(): string {
  return formatDateTimeID(new Date());
}

/** Converts a <input type="date"> value ("YYYY-MM-DD") into the short display date used throughout the app's seed data (e.g. "03 Jul 2026") — keeps a task's Batas Waktu formatted identically whether it came from seed data or was just typed into a form. */
export function formatDueDateID(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
}

const ID_SHORT_MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06",
  Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12",
};

/** Reverse of formatDueDateID — parses a "03 Jul 2026"-style display date back into an <input type="date"> value, so an existing task's Batas Waktu pre-fills the date picker correctly when editing. */
export function parseDueDateID(value?: string): string {
  if (!value) return "";
  const m = value.match(/^(\d{2}) (\w+) (\d{4})$/);
  if (!m) return "";
  const month = ID_SHORT_MONTHS[m[2]];
  if (!month) return "";
  return `${m[3]}-${month}-${m[1]}`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} menit`;
  if (hours < 24) return `${Math.round(hours)} jam`;
  const days = Math.floor(hours / 24);
  const remHours = Math.round(hours % 24);
  return remHours > 0 ? `${days} hari ${remHours} jam` : `${days} hari`;
}

export function getSlaTone(status: SlaClockStatus): "green" | "amber" | "red" | "navy" | "muted" {
  switch (status) {
    case "Aman":
      return "green";
    case "Perlu Perhatian":
      return "amber";
    case "Mendekati Batas Waktu":
      return "amber";
    case "Lewat Batas Waktu":
      return "red";
    case "Dijeda":
      return "muted";
    case "Selesai":
      return "navy";
    default:
      return "muted";
  }
}

export function getPriorityTone(severity: "Rendah" | "Sedang" | "Tinggi" | "Kritis"): "green" | "amber" | "red" {
  if (severity === "Rendah") return "green";
  if (severity === "Kritis") return "red";
  return "amber";
}

const OWNER_LABEL: Record<OwnerType, string> = {
  Pelapor: "Anda (Pelapor)",
  Pialang: "Pialang Berjangka",
  Bursa: "Bursa",
  Kliring: "Lembaga kliring",
  Bappebti: "Bappebti",
};

export function getActionOwnerLabel(owner: OwnerType): string {
  return OWNER_LABEL[owner];
}
