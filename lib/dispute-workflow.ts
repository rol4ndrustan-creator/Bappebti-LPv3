// Mekanisme Penanganan Perselisihan Nasabah PBK (rancangan Bappebti).
// Seluruh aturan alur, tenggat (hari kerja), ambang nilai kesepakatan, dan
// pihak yang berwenang pada tiap tahap didefinisikan di sini — halaman dan
// komponen hanya membaca hasil turunan dari modul ini.

import {
  AgreementDocumentType,
  ComplaintCase,
  DisputeRecord,
  DisputeStage,
  PublicStatus,
  SlaClock,
  SlaClockStatus,
  SlaClockType,
  OwnerType,
} from "./types";
import { Role, ROLE_GROUP } from "./permissions";
import { MOCK_NOW, formatMockDateTime, parseMockDateTime } from "./clarification-workflow";
import { addBusinessDays, addCalendarDays, businessDaysBetween } from "./business-days";
import type { BadgeTone } from "./workflow-config";

// ---------------------------------------------------------------------------
// Parameter mekanisme (sesuai bagan "Rancangan Mekanisme Penanganan
// Perselisihan Nasabah PBK")
// ---------------------------------------------------------------------------

export const DISPUTE_RULES = {
  /** Verifikasi materiil & formil oleh Bappebti. */
  bappebtiVerificationBusinessDays: 2,
  /** Klarifikasi oleh Pialang Berjangka (daluarsa, informasi kontrak, dll). */
  pialangClarificationBusinessDays: 1,
  /** Perbaikan berkas oleh nasabah sejak tanggal dikembalikan. */
  formilCorrectionBusinessDays: 2,
  musyawarahBusinessDays: 21,
  mediasiBusinessDays: 21,
  /**
   * Perpanjangan musyawarah/mediasi "maks. 14 hari". Bagan tidak menyebut
   * "hari kerja" untuk perpanjangan, sehingga dihitung sebagai hari kalender.
   */
  maxExtensionCalendarDays: 14,
  /** Bursa melaporkan hasil mediasi ke Bappebti. */
  mediasiReportBusinessDays: 1,
  /** Batas nasabah memilih penyelesaian melalui BAKTI. */
  forumChoiceBusinessDays: 20,
  /**
   * Ambang nilai kesepakatan. Bagan hanya menyebut "< Rp100.000.000" dan
   * "> Rp100.000.000"; nilai tepat Rp100.000.000 diperlakukan sebagai akta
   * perdamaian (perlindungan lebih kuat bagi nasabah) sampai ada ketentuan resmi.
   */
  agreementValueThreshold: 100_000_000,
} as const;

export function agreementDocumentTypeFor(value: number): AgreementDocumentType {
  return value < DISPUTE_RULES.agreementValueThreshold ? "Dokumen Kesepakatan" : "Akta Perdamaian";
}

// ---------------------------------------------------------------------------
// Tahapan
// ---------------------------------------------------------------------------

export type DisputeActor = "Nasabah" | "Bappebti" | "Pialang" | "Bursa";

export interface DisputeStageConfig {
  code: DisputeStage;
  label: string;
  publicLabel: PublicStatus;
  description: string;
  /** Pihak yang wajib bertindak pada tahap ini. */
  actionOwner: DisputeActor | null;
  owner: OwnerType;
  badgeTone: BadgeTone;
  isOpen: boolean;
}

export const DISPUTE_STAGES: Record<DisputeStage, DisputeStageConfig> = {
  VERIFIKASI: {
    code: "VERIFIKASI",
    label: "Verifikasi Bappebti & Klarifikasi Pialang",
    publicLabel: "Verifikasi Bappebti",
    description:
      "Bappebti memverifikasi syarat materiil & formil (maks. 2 hari kerja). Secara paralel Pialang Berjangka melakukan klarifikasi (maks. 1 hari kerja).",
    actionOwner: "Bappebti",
    owner: "Bappebti",
    badgeTone: "navy",
    isOpen: true,
  },
  PERBAIKAN_FORMIL: {
    code: "PERBAIKAN_FORMIL",
    label: "Perbaikan Berkas oleh Nasabah",
    publicLabel: "Perbaikan Berkas",
    description: "Syarat formil belum terpenuhi. Pengaduan dikembalikan kepada nasabah untuk diperbaiki dalam maks. 2 hari kerja sejak dikembalikan.",
    actionOwner: "Nasabah",
    owner: "Pelapor",
    badgeTone: "amber",
    isOpen: true,
  },
  DITOLAK_MATERIIL: {
    code: "DITOLAK_MATERIIL",
    label: "Ditolak & Ditutup",
    publicLabel: "Ditolak",
    description: "Syarat materiil tidak terpenuhi sehingga pengaduan ditolak dan ditutup.",
    actionOwner: null,
    owner: "Bappebti",
    badgeTone: "red",
    isOpen: false,
  },
  MUSYAWARAH: {
    code: "MUSYAWARAH",
    label: "Musyawarah Pialang",
    publicLabel: "Musyawarah dengan Pialang",
    description: "Pengaduan didisposisikan ke Pialang Berjangka untuk musyawarah dengan nasabah. Jangka waktu 21 hari kerja (dapat diperpanjang maks. 14 hari).",
    actionOwner: "Pialang",
    owner: "Platform",
    badgeTone: "amber",
    isOpen: true,
  },
  MEDIASI_BURSA: {
    code: "MEDIASI_BURSA",
    label: "Mediasi Bursa",
    publicLabel: "Mediasi di Bursa",
    description: "Musyawarah tidak tercapai. Bursa Berjangka memediasi perselisihan. Jangka waktu 21 hari kerja (dapat diperpanjang maks. 14 hari).",
    actionOwner: "Bursa",
    owner: "Bursa",
    badgeTone: "amber",
    isOpen: true,
  },
  LAPOR_HASIL_MEDIASI: {
    code: "LAPOR_HASIL_MEDIASI",
    label: "Lapor Hasil Mediasi ke Bappebti",
    publicLabel: "Mediasi di Bursa",
    description: "Mediasi telah berakhir. Bursa Berjangka wajib melaporkan hasilnya ke Bappebti dalam 1 hari kerja.",
    actionOwner: "Bursa",
    owner: "Bursa",
    badgeTone: "navy",
    isOpen: true,
  },
  PENYAMPAIAN_KESEPAKATAN: {
    code: "PENYAMPAIAN_KESEPAKATAN",
    label: "Penyampaian Dokumen Kesepakatan",
    publicLabel: "Penyampaian Kesepakatan",
    description:
      "Kesepakatan tercapai. Pihak penyelenggara (Pialang untuk musyawarah, Bursa untuk mediasi) menyampaikan dokumen kesepakatan (< Rp100 juta) atau akta perdamaian (≥ Rp100 juta) ke Bappebti.",
    actionOwner: null, // ditentukan oleh forum kesepakatan, lihat getDisputeActionOwner()
    owner: "Platform",
    badgeTone: "green",
    isOpen: true,
  },
  PILIHAN_PENYELESAIAN: {
    code: "PILIHAN_PENYELESAIAN",
    label: "Pilihan Pengadilan / BAKTI",
    publicLabel: "Pilihan Pengadilan/BAKTI",
    description:
      "Mediasi tidak mencapai kesepakatan. Bursa Berjangka telah menjelaskan pilihan sarana penyelesaian; nasabah berhak memilih penyelesaian melalui BAKTI paling lambat 20 hari kerja.",
    actionOwner: "Nasabah",
    owner: "Pelapor",
    badgeTone: "amber",
    isOpen: true,
  },
  PENGADILAN_BAKTI: {
    code: "PENGADILAN_BAKTI",
    label: "Diteruskan ke Pengadilan / BAKTI",
    publicLabel: "Diteruskan ke Pengadilan/BAKTI",
    description: "Penyelesaian perselisihan dilanjutkan di luar portal ini melalui forum yang dipilih nasabah.",
    actionOwner: null,
    owner: "Pelapor",
    badgeTone: "muted",
    isOpen: false,
  },
  SELESAI: {
    code: "SELESAI",
    label: "Selesai",
    publicLabel: "Selesai",
    description: "Dokumen kesepakatan / akta perdamaian telah diterima Bappebti. Perselisihan dinyatakan selesai.",
    actionOwner: null,
    owner: "Bappebti",
    badgeTone: "green",
    isOpen: false,
  },
};

export function getDisputeActionOwner(d: DisputeRecord): DisputeActor | null {
  if (d.stage === "PENYAMPAIAN_KESEPAKATAN") return d.agreement?.forum === "Mediasi" ? "Bursa" : "Pialang";
  return DISPUTE_STAGES[d.stage].actionOwner;
}

export function getDisputeOwner(d: DisputeRecord): OwnerType {
  if (d.stage === "PENYAMPAIAN_KESEPAKATAN") return d.agreement?.forum === "Mediasi" ? "Bursa" : "Platform";
  return DISPUTE_STAGES[d.stage].owner;
}

/** Pemetaan peran demo ke pihak dalam mekanisme perselisihan. */
export function disputeActorForRole(role: Role): DisputeActor | null {
  const group = ROLE_GROUP[role];
  if (group === "Publik") return "Nasabah";
  if (group === "Platform") return "Pialang";
  if (role === "BURSA_CASE_OFFICER" || role === "BURSA_SUPERVISOR" || role === "EKOSISTEM_ACTIVE_COORDINATOR") return "Bursa";
  if (group === "Bappebti" || role === "SYSTEM_ADMIN") return "Bappebti";
  return null;
}

// ---------------------------------------------------------------------------
// Tenggat & jam SLA
// ---------------------------------------------------------------------------

function at(value: string): Date {
  return parseMockDateTime(value);
}

export function nowMock(): string {
  return formatMockDateTime(MOCK_NOW);
}

export interface DisputeDeadline {
  type: SlaClockType;
  start: Date;
  deadline: Date;
  responsible: DisputeActor;
  owner: OwnerType;
  ruleLabel: string;
  done: boolean;
}

function periodDeadline(startedAt: string, businessDays: number, extendedDays?: number): Date {
  const base = addBusinessDays(at(startedAt), businessDays);
  return extendedDays ? addCalendarDays(base, extendedDays) : base;
}

/** Batas waktu klarifikasi Pialang — lewat tanpa respons berarti Pialang dianggap menyetujui pengaduan. */
export function pialangClarificationDeadline(d: DisputeRecord): Date {
  return addBusinessDays(at(d.submittedAt), DISPUTE_RULES.pialangClarificationBusinessDays);
}

export function isPialangDeemedApproved(d: DisputeRecord, now: Date = MOCK_NOW): boolean {
  return !d.pialangClarification.respondedAt && now > pialangClarificationDeadline(d);
}

export type PialangClarificationStatus = "Menunggu Klarifikasi" | "Sudah Diklarifikasi" | "Dianggap Menyetujui Pengaduan";

export function getPialangClarificationStatus(d: DisputeRecord, now: Date = MOCK_NOW): PialangClarificationStatus {
  if (d.pialangClarification.respondedAt) return "Sudah Diklarifikasi";
  return isPialangDeemedApproved(d, now) ? "Dianggap Menyetujui Pengaduan" : "Menunggu Klarifikasi";
}

/** Semua tenggat yang relevan untuk tahap saat ini (dan tahap paralel). */
export function getDisputeDeadlines(d: DisputeRecord): DisputeDeadline[] {
  const list: DisputeDeadline[] = [];
  switch (d.stage) {
    case "VERIFIKASI":
      list.push({
        type: "Verifikasi Materiil & Formil Bappebti",
        start: at(d.formilCorrectedAt ?? d.submittedAt),
        deadline: addBusinessDays(at(d.formilCorrectedAt ?? d.submittedAt), DISPUTE_RULES.bappebtiVerificationBusinessDays),
        responsible: "Bappebti",
        owner: "Bappebti",
        ruleLabel: "Maks. 2 hari kerja",
        done: false,
      });
      list.push({
        type: "Klarifikasi Pialang Berjangka",
        start: at(d.submittedAt),
        deadline: pialangClarificationDeadline(d),
        responsible: "Pialang",
        owner: "Platform",
        ruleLabel: "Maks. 1 hari kerja — lewat tanpa klarifikasi = dianggap menyetujui",
        done: !!d.pialangClarification.respondedAt,
      });
      break;
    case "PERBAIKAN_FORMIL":
      if (d.formilReturnedAt) {
        list.push({
          type: "Perbaikan Berkas Formil",
          start: at(d.formilReturnedAt),
          deadline: addBusinessDays(at(d.formilReturnedAt), DISPUTE_RULES.formilCorrectionBusinessDays),
          responsible: "Nasabah",
          owner: "Pelapor",
          ruleLabel: "Maks. 2 hari kerja sejak dikembalikan",
          done: false,
        });
      }
      break;
    case "MUSYAWARAH":
      if (d.musyawarah) {
        list.push({
          type: "Musyawarah Pialang",
          start: at(d.musyawarah.startedAt),
          deadline: periodDeadline(d.musyawarah.startedAt, DISPUTE_RULES.musyawarahBusinessDays, d.musyawarah.extendedDays),
          responsible: "Pialang",
          owner: "Platform",
          ruleLabel: d.musyawarah.extendedDays
            ? `21 hari kerja + perpanjangan ${d.musyawarah.extendedDays} hari`
            : "21 hari kerja (dapat diperpanjang maks. 14 hari)",
          done: false,
        });
      }
      break;
    case "MEDIASI_BURSA":
      if (d.mediasi) {
        list.push({
          type: "Mediasi Bursa",
          start: at(d.mediasi.startedAt),
          deadline: periodDeadline(d.mediasi.startedAt, DISPUTE_RULES.mediasiBusinessDays, d.mediasi.extendedDays),
          responsible: "Bursa",
          owner: "Bursa",
          ruleLabel: d.mediasi.extendedDays
            ? `21 hari kerja + perpanjangan ${d.mediasi.extendedDays} hari`
            : "21 hari kerja (dapat diperpanjang maks. 14 hari)",
          done: false,
        });
      }
      break;
    case "LAPOR_HASIL_MEDIASI":
      if (d.mediasi?.endedAt) {
        list.push({
          type: "Laporan Hasil Mediasi ke Bappebti",
          start: at(d.mediasi.endedAt),
          deadline: addBusinessDays(at(d.mediasi.endedAt), DISPUTE_RULES.mediasiReportBusinessDays),
          responsible: "Bursa",
          owner: "Bursa",
          ruleLabel: "Maks. 1 hari kerja",
          done: false,
        });
      }
      break;
    case "PILIHAN_PENYELESAIAN":
      if (d.forumChoice) {
        list.push({
          type: "Pemilihan Pengadilan/BAKTI",
          start: at(d.forumChoice.explainedAt),
          deadline: addBusinessDays(at(d.forumChoice.explainedAt), DISPUTE_RULES.forumChoiceBusinessDays),
          responsible: "Nasabah",
          owner: "Pelapor",
          ruleLabel: "Pilih BAKTI paling lambat 20 hari kerja",
          done: false,
        });
      }
      break;
    default:
      break;
  }
  return list;
}

export function deadlineStatus(deadline: Date, done: boolean, now: Date = MOCK_NOW): SlaClockStatus {
  if (done) return "Selesai";
  if (now > deadline) return "Lewat Batas Waktu";
  return businessDaysBetween(now, deadline) <= 1 ? "Mendekati Batas Waktu" : "Aman";
}

/** Sisa hari kerja dalam kalimat, mis. "Sisa 3 hari kerja" / "Terlambat 2 hari kerja". */
export function describeRemaining(deadline: Date, now: Date = MOCK_NOW): string {
  const n = businessDaysBetween(now, deadline);
  if (now > deadline) return n === 0 ? "Terlambat (hari ini)" : `Terlambat ${Math.abs(n)} hari kerja`;
  return n === 0 ? "Berakhir hari ini" : `Sisa ${n} hari kerja`;
}

export function getDisputeSlaClocks(d: DisputeRecord): SlaClock[] {
  return getDisputeDeadlines(d).map((dl) => ({
    type: dl.type,
    startTime: formatMockDateTime(dl.start),
    deadline: formatMockDateTime(dl.deadline),
    status: deadlineStatus(dl.deadline, dl.done),
    responsibleParty: dl.owner,
  }));
}

// ---------------------------------------------------------------------------
// Penanda kemajuan (mengikuti bagan alir)
// ---------------------------------------------------------------------------

export const DISPUTE_PROGRESS_STEPS = [
  "Pengaduan Online",
  "Verifikasi",
  "Musyawarah Pialang",
  "Mediasi Bursa",
  "Kesepakatan / Pengadilan-BAKTI",
  "Selesai",
] as const;

export interface DisputeProgressStep {
  label: string;
  status: "done" | "current" | "upcoming" | "skipped";
}

export function getDisputeProgress(d: DisputeRecord): DisputeProgressStep[] {
  const reachedMediasi = !!d.mediasi;
  const idx: Record<DisputeStage, number> = {
    VERIFIKASI: 1,
    PERBAIKAN_FORMIL: 1,
    DITOLAK_MATERIIL: 1,
    MUSYAWARAH: 2,
    MEDIASI_BURSA: 3,
    LAPOR_HASIL_MEDIASI: 3,
    PENYAMPAIAN_KESEPAKATAN: 4,
    PILIHAN_PENYELESAIAN: 4,
    PENGADILAN_BAKTI: 5,
    SELESAI: 5,
  };
  const current = idx[d.stage];
  const closed = !DISPUTE_STAGES[d.stage].isOpen;
  return DISPUTE_PROGRESS_STEPS.map((label, i) => {
    // Kesepakatan saat musyawarah melompati tahap mediasi.
    if (i === 3 && !reachedMediasi && current > 3) return { label, status: "skipped" };
    if (d.stage === "DITOLAK_MATERIIL" && i > 1) return { label, status: "skipped" };
    if (i < current || (closed && i === current)) return { label, status: "done" };
    if (i === current) return { label, status: "current" };
    return { label, status: "upcoming" };
  });
}

// ---------------------------------------------------------------------------
// Tindakan per tahap & pihak
// ---------------------------------------------------------------------------

export type DisputeActionId =
  | "bappebti-verify"
  | "pialang-clarify"
  | "nasabah-correct-formil"
  | "musyawarah-extend"
  | "musyawarah-result"
  | "mediasi-extend"
  | "mediasi-result"
  | "mediasi-report"
  | "submit-agreement"
  | "nasabah-choose-forum";

export interface DisputeActionMeta {
  id: DisputeActionId;
  label: string;
  actor: DisputeActor;
  description: string;
}

export const DISPUTE_ACTIONS: Record<DisputeActionId, DisputeActionMeta> = {
  "bappebti-verify": {
    id: "bappebti-verify",
    label: "Catat Hasil Verifikasi Materiil & Formil",
    actor: "Bappebti",
    description:
      "Materiil tidak terpenuhi → ditolak & ditutup. Formil tidak terpenuhi → dikembalikan ke nasabah (perbaikan maks. 2 hari kerja). Keduanya terpenuhi → disposisi ke Pialang untuk musyawarah.",
  },
  "pialang-clarify": {
    id: "pialang-clarify",
    label: "Kirim Klarifikasi Pialang",
    actor: "Pialang",
    description: "Klarifikasi atas pengaduan (daluarsa, informasi kontrak, dll) dalam 1 hari kerja. Tanpa klarifikasi, Pialang dianggap menyetujui pengaduan nasabah.",
  },
  "nasabah-correct-formil": {
    id: "nasabah-correct-formil",
    label: "Kirim Perbaikan Berkas",
    actor: "Nasabah",
    description: "Lengkapi kekurangan syarat formil. Berkas akan diverifikasi ulang oleh Bappebti (maks. 2 hari kerja).",
  },
  "musyawarah-extend": {
    id: "musyawarah-extend",
    label: "Perpanjang Musyawarah",
    actor: "Pialang",
    description: "Jangka waktu musyawarah dapat diperpanjang satu kali, maksimal 14 hari.",
  },
  "musyawarah-result": {
    id: "musyawarah-result",
    label: "Catat Hasil Musyawarah",
    actor: "Pialang",
    description: "Tercapai → catat nilai kesepakatan lalu sampaikan dokumennya ke Bappebti. Tidak tercapai → perselisihan diteruskan ke Mediasi Bursa.",
  },
  "mediasi-extend": {
    id: "mediasi-extend",
    label: "Perpanjang Mediasi",
    actor: "Bursa",
    description: "Jangka waktu mediasi dapat diperpanjang satu kali, maksimal 14 hari.",
  },
  "mediasi-result": {
    id: "mediasi-result",
    label: "Catat Hasil Mediasi",
    actor: "Bursa",
    description: "Catat apakah mediasi mencapai kesepakatan. Hasil wajib dilaporkan ke Bappebti dalam 1 hari kerja.",
  },
  "mediasi-report": {
    id: "mediasi-report",
    label: "Laporkan Hasil Mediasi ke Bappebti",
    actor: "Bursa",
    description: "Sepakat → sampaikan dokumen kesepakatan/akta perdamaian. Tidak sepakat → jelaskan pilihan sarana penyelesaian (Pengadilan/BAKTI) kepada nasabah.",
  },
  "submit-agreement": {
    id: "submit-agreement",
    label: "Sampaikan Dokumen ke Bappebti",
    actor: "Pialang",
    description: "Unggah dokumen kesepakatan (< Rp100 juta) atau akta perdamaian (≥ Rp100 juta). Setelah diterima, perselisihan dinyatakan selesai.",
  },
  "nasabah-choose-forum": {
    id: "nasabah-choose-forum",
    label: "Pilih Sarana Penyelesaian",
    actor: "Nasabah",
    description: "Pilih penyelesaian melalui BAKTI (paling lambat 20 hari kerja) atau melalui Pengadilan.",
  },
};

/** Tindakan yang tersedia untuk pihak tertentu pada kondisi perselisihan saat ini. */
export function getAvailableDisputeActions(d: DisputeRecord, actor: DisputeActor | null): DisputeActionId[] {
  if (!actor) return [];
  const ids: DisputeActionId[] = [];
  switch (d.stage) {
    case "VERIFIKASI":
      if (actor === "Bappebti") ids.push("bappebti-verify");
      if (actor === "Pialang" && !d.pialangClarification.respondedAt && !isPialangDeemedApproved(d)) ids.push("pialang-clarify");
      break;
    case "PERBAIKAN_FORMIL":
      if (actor === "Nasabah") ids.push("nasabah-correct-formil");
      break;
    case "MUSYAWARAH":
      if (actor === "Pialang") {
        ids.push("musyawarah-result");
        if (!d.musyawarah?.extendedDays) ids.push("musyawarah-extend");
      }
      break;
    case "MEDIASI_BURSA":
      if (actor === "Bursa") {
        ids.push("mediasi-result");
        if (!d.mediasi?.extendedDays) ids.push("mediasi-extend");
      }
      break;
    case "LAPOR_HASIL_MEDIASI":
      if (actor === "Bursa") ids.push("mediasi-report");
      break;
    case "PENYAMPAIAN_KESEPAKATAN":
      if (actor === getDisputeActionOwner(d)) ids.push("submit-agreement");
      break;
    case "PILIHAN_PENYELESAIAN":
      if (actor === "Nasabah") ids.push("nasabah-choose-forum");
      break;
    default:
      break;
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Transisi (fungsi murni — penyimpanan ada di lib/mock-service/store.ts)
// ---------------------------------------------------------------------------

export type DisputeActionInput =
  | { id: "bappebti-verify"; materiil: "Terpenuhi" | "Tidak Terpenuhi"; formil: "Terpenuhi" | "Tidak Terpenuhi"; note: string; actor: string }
  | { id: "pialang-clarify"; note: string; actor: string }
  | { id: "nasabah-correct-formil"; note: string; actor: string }
  | { id: "musyawarah-extend"; days: number; note: string; actor: string }
  | { id: "musyawarah-result"; outcome: "Tercapai" | "Tidak Tercapai"; value?: number; note: string; actor: string }
  | { id: "mediasi-extend"; days: number; note: string; actor: string }
  | { id: "mediasi-result"; outcome: "Sepakat" | "Tidak Sepakat"; value?: number; note: string; actor: string }
  | { id: "mediasi-report"; note: string; actor: string }
  | { id: "submit-agreement"; documentName: string; note: string; actor: string }
  | { id: "nasabah-choose-forum"; choice: "BAKTI" | "Pengadilan"; note: string; actor: string };

export interface DisputeTransitionResult {
  next: DisputeRecord;
  timelineAction: string;
  timelineNote: string;
  tone: "success" | "info" | "warning" | "danger";
}

export function applyDisputeAction(
  d: DisputeRecord,
  input: DisputeActionInput,
  pialangName: string,
  bursaName: string,
  now: string = nowMock()
): DisputeTransitionResult {
  const next: DisputeRecord = structuredClone(d);
  const withNote = (s: string) => (input.note.trim() ? `${s} — ${input.note.trim()}` : s);

  switch (input.id) {
    case "bappebti-verify": {
      next.bappebtiVerification = {
        materiil: input.materiil,
        formil: input.formil,
        verifiedAt: now,
        verifiedBy: input.actor,
        note: input.note,
      };
      if (input.materiil === "Tidak Terpenuhi") {
        next.stage = "DITOLAK_MATERIIL";
        next.closedAt = now;
        return { next, timelineAction: "Pengaduan ditolak & ditutup", timelineNote: withNote("Syarat materiil tidak terpenuhi"), tone: "danger" };
      }
      if (input.formil === "Tidak Terpenuhi") {
        next.stage = "PERBAIKAN_FORMIL";
        next.formilReturnedAt = now;
        return {
          next,
          timelineAction: "Dikembalikan ke nasabah untuk perbaikan",
          timelineNote: withNote("Syarat formil belum terpenuhi; perbaikan maks. 2 hari kerja sejak tanggal dikembalikan"),
          tone: "warning",
        };
      }
      next.stage = "MUSYAWARAH";
      next.dispositionAt = now;
      next.musyawarah = { startedAt: now };
      return {
        next,
        timelineAction: "Disposisi ke Pialang — Musyawarah dimulai",
        timelineNote: withNote(`Syarat materiil & formil terpenuhi. Musyawarah dengan ${pialangName} berlangsung 21 hari kerja`),
        tone: "success",
      };
    }
    case "pialang-clarify":
      next.pialangClarification = { respondedAt: now, respondedBy: input.actor, note: input.note };
      return { next, timelineAction: "Klarifikasi Pialang disampaikan", timelineNote: withNote(`${pialangName} menyampaikan klarifikasi`), tone: "info" };
    case "nasabah-correct-formil":
      next.stage = "VERIFIKASI";
      next.formilCorrectedAt = now;
      next.bappebtiVerification = {};
      return { next, timelineAction: "Perbaikan berkas dikirim nasabah", timelineNote: withNote("Berkas diverifikasi ulang oleh Bappebti (maks. 2 hari kerja)"), tone: "info" };
    case "musyawarah-extend": {
      const days = Math.min(Math.max(1, Math.round(input.days)), DISPUTE_RULES.maxExtensionCalendarDays);
      if (next.musyawarah) next.musyawarah.extendedDays = days;
      return { next, timelineAction: "Musyawarah diperpanjang", timelineNote: withNote(`Perpanjangan ${days} hari`), tone: "warning" };
    }
    case "musyawarah-result":
      if (next.musyawarah) {
        next.musyawarah.endedAt = now;
        next.musyawarah.outcome = input.outcome;
      }
      if (input.outcome === "Tercapai") {
        const value = input.value ?? 0;
        next.stage = "PENYAMPAIAN_KESEPAKATAN";
        next.agreement = { forum: "Musyawarah", value, documentType: agreementDocumentTypeFor(value), submitter: pialangName };
        return {
          next,
          timelineAction: "Musyawarah tercapai",
          timelineNote: withNote(`Nilai kesepakatan Rp${value.toLocaleString("id-ID")} — ${pialangName} wajib menyampaikan ${agreementDocumentTypeFor(value).toLowerCase()} ke Bappebti`),
          tone: "success",
        };
      }
      next.stage = "MEDIASI_BURSA";
      next.mediasi = { startedAt: now };
      return { next, timelineAction: "Musyawarah tidak tercapai — diteruskan ke Mediasi Bursa", timelineNote: withNote(`Mediasi oleh ${bursaName} berlangsung 21 hari kerja`), tone: "warning" };
    case "mediasi-extend": {
      const days = Math.min(Math.max(1, Math.round(input.days)), DISPUTE_RULES.maxExtensionCalendarDays);
      if (next.mediasi) next.mediasi.extendedDays = days;
      return { next, timelineAction: "Mediasi diperpanjang", timelineNote: withNote(`Perpanjangan ${days} hari`), tone: "warning" };
    }
    case "mediasi-result":
      if (next.mediasi) {
        next.mediasi.endedAt = now;
        next.mediasi.outcome = input.outcome;
      }
      if (input.outcome === "Sepakat") {
        const value = input.value ?? 0;
        next.agreement = { forum: "Mediasi", value, documentType: agreementDocumentTypeFor(value), submitter: bursaName };
      }
      next.stage = "LAPOR_HASIL_MEDIASI";
      return {
        next,
        timelineAction: `Mediasi berakhir — ${input.outcome}`,
        timelineNote: withNote("Hasil mediasi wajib dilaporkan ke Bappebti dalam 1 hari kerja"),
        tone: input.outcome === "Sepakat" ? "success" : "warning",
      };
    case "mediasi-report":
      if (next.mediasi) next.mediasi.reportedAt = now;
      if (next.mediasi?.outcome === "Sepakat") {
        next.stage = "PENYAMPAIAN_KESEPAKATAN";
        return {
          next,
          timelineAction: "Hasil mediasi dilaporkan ke Bappebti — Sepakat",
          timelineNote: withNote(`${bursaName} menyampaikan ${next.agreement?.documentType.toLowerCase() ?? "dokumen kesepakatan"} ke Bappebti`),
          tone: "success",
        };
      }
      next.stage = "PILIHAN_PENYELESAIAN";
      next.forumChoice = { explainedAt: now };
      return {
        next,
        timelineAction: "Hasil mediasi dilaporkan ke Bappebti — Tidak Sepakat",
        timelineNote: withNote(`${bursaName} menjelaskan pilihan sarana penyelesaian. Nasabah dapat memilih BAKTI paling lambat 20 hari kerja`),
        tone: "warning",
      };
    case "submit-agreement":
      if (next.agreement) {
        next.agreement.documentName = input.documentName;
        next.agreement.submittedAt = now;
      }
      next.stage = "SELESAI";
      next.closedAt = now;
      return {
        next,
        timelineAction: `${next.agreement?.documentType ?? "Dokumen kesepakatan"} diterima Bappebti — Selesai`,
        timelineNote: withNote(`${input.documentName} disampaikan oleh ${next.agreement?.submitter ?? input.actor}`),
        tone: "success",
      };
    case "nasabah-choose-forum":
      next.stage = "PENGADILAN_BAKTI";
      next.closedAt = now;
      if (next.forumChoice) {
        next.forumChoice.choice = input.choice;
        next.forumChoice.chosenAt = now;
      }
      return {
        next,
        timelineAction: `Nasabah memilih penyelesaian melalui ${input.choice}`,
        timelineNote: withNote(input.choice === "BAKTI" ? "Diteruskan ke Badan Arbitrase Perdagangan Berjangka Komoditi (BAKTI)" : "Nasabah menempuh jalur Pengadilan"),
        tone: "info",
      };
  }
}

export function isDisputeCase(c: ComplaintCase): c is ComplaintCase & { dispute: DisputeRecord } {
  return !!c.dispute;
}
