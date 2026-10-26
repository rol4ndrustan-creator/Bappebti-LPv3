// Aturan & data contoh Pertemuan Musyawarah (List Revisi 11).

import * as React from "react";
import { MeetingLocationType, MeetingStatus, MusyawarahMeeting } from "./types";

export const MEETING_LOCATION_OPTIONS: MeetingLocationType[] = ["Tautan Video Conference", "Kantor Fisik Bappebti", "Kantor Pialang"];

export const MEETING_STATUS_TONE: Record<MeetingStatus, "navy" | "amber" | "green" | "muted"> = {
  Dijadwalkan: "navy",
  Berlangsung: "amber",
  Selesai: "green",
  "Lanjut Musyawarah Berikutnya": "muted",
};

function wib(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

/**
 * Status pertemuan: hasil yang sudah dicatat menentukan Selesai / Lanjut;
 * tanpa hasil, pertemuan "Dijadwalkan" sebelum jam mulai dan "Berlangsung"
 * sejak jam mulai sampai hasilnya dicatat.
 */
export function getMeetingStatus(m: MusyawarahMeeting, now: Date | null): MeetingStatus {
  if (m.outcome) return m.outcome.decision === "Selesai (Damai / Kesepakatan Tercapai)" ? "Selesai" : "Lanjut Musyawarah Berikutnya";
  if (!now) return "Dijadwalkan";
  return now >= wib(m.date, m.startTime) ? "Berlangsung" : "Dijadwalkan";
}

/** Waktu saat ini setelah mount (null saat prerender) agar status tidak menyebabkan hydration mismatch. */
export function useNow(): Date | null {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the clock only on the client, after hydration
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Urutan kronologis per tiket → Musyawarah ke-1, ke-2, dst. */
export function sortMeetings(list: MusyawarahMeeting[]): MusyawarahMeeting[] {
  return [...list].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`) || a.createdAt.localeCompare(b.createdAt));
}

export function meetingSequence(m: MusyawarahMeeting, all: MusyawarahMeeting[]): number {
  return sortMeetings(all.filter((x) => x.ticket === m.ticket)).findIndex((x) => x.id === m.id) + 1;
}

const DAY_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function formatMeetingDate(m: Pick<MusyawarahMeeting, "date" | "startTime" | "endTime">): string {
  const [y, mo, d] = m.date.split("-").map(Number);
  const day = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return `${DAY_LABEL[day]}, ${String(d).padStart(2, "0")} ${MONTH_LABEL[mo - 1]} ${y} · ${m.startTime}–${m.endTime} WIB`;
}

export const MEETING_SEED: MusyawarahMeeting[] = [
  {
    id: "MSY-SEED-196-1",
    ticket: "BPP-2026-000196",
    title: "Musyawarah Kompensasi Biaya Transaksi Ganda #BPP-2026-000196",
    date: "2026-06-08",
    startTime: "10:00",
    endTime: "11:30",
    locationType: "Kantor Fisik Bappebti",
    locationDetail: "Gedung Bappebti Lt. 3, Jl. Kramat Raya No. 172, Jakarta Pusat",
    agenda: "Klarifikasi biaya transaksi yang tercatat ganda dan besaran kompensasi kepada nasabah.",
    proposedBy: { name: "Dewi Anjani", institution: "Bappebti", role: "Bappebti" },
    createdAt: "2026-06-05T08:00:00.000Z",
    outcome: {
      decision: "Selesai (Damai / Kesepakatan Tercapai)",
      notula: "Pialang mengakui biaya ganda akibat gangguan sistem dan menyetujui pengembalian Rp350.000 paling lambat 2 hari kerja. Nasabah menerima.",
      reporterAttendance: "Hadir",
      respondentAttendance: "Hadir",
      recordedBy: "Dewi Anjani",
      recordedAt: "2026-06-08T05:00:00.000Z",
    },
  },
  {
    id: "MSY-SEED-193-1",
    ticket: "BPP-2026-000193",
    title: "Musyawarah Keterlambatan Penyelesaian #BPP-2026-000193",
    date: "2026-06-10",
    startTime: "13:00",
    endTime: "15:00",
    locationType: "Kantor Pialang",
    locationDetail: "Kantor PT Monex Investindo Futures, Jakarta Selatan",
    agenda: "Penjelasan penyebab keterlambatan penyelesaian dan usulan kompensasi.",
    proposedBy: { name: "Tim Kepatuhan Monex", institution: "PT Monex Investindo Futures", role: "Platform" },
    createdAt: "2026-06-08T09:00:00.000Z",
    outcome: {
      decision: "Diundang ke Musyawarah Berikutnya",
      notula: "Belum ada titik temu atas besaran kompensasi. Para pihak sepakat melanjutkan ke tahap berikutnya.",
      reporterAttendance: "Hadir",
      respondentAttendance: "Hadir",
      recordedBy: "Tim Kepatuhan Monex",
      recordedAt: "2026-06-10T08:30:00.000Z",
    },
  },
  {
    id: "MSY-SEED-187-1",
    ticket: "BPP-2026-000187",
    title: "Musyawarah Mediasi Kendala Respons Platform #BPP-2026-000187",
    date: "2026-06-12",
    startTime: "10:00",
    endTime: "12:00",
    locationType: "Tautan Video Conference",
    locationDetail: "https://meet.bappebti.go.id/msy-187-1",
    agenda: "Pialang tidak merespons pengaduan selama 3 hari; pembahasan tindak lanjut atas permintaan nasabah.",
    proposedBy: { name: "Ferry Hartono", institution: "PT Monex Investindo Futures", role: "Platform" },
    createdAt: "2026-06-10T03:00:00.000Z",
    outcome: {
      decision: "Diundang ke Musyawarah Berikutnya",
      notula: "Pialang meminta waktu menyiapkan data riwayat transaksi. Musyawarah ke-2 dijadwalkan setelah data lengkap.",
      reporterAttendance: "Hadir",
      respondentAttendance: "Hadir",
      recordedBy: "Ferry Hartono",
      recordedAt: "2026-06-12T05:10:00.000Z",
    },
  },
  {
    id: "MSY-SEED-187-2",
    ticket: "BPP-2026-000187",
    title: "Musyawarah Lanjutan Kendala Respons Platform #BPP-2026-000187",
    date: "2026-11-04",
    startTime: "10:00",
    endTime: "12:00",
    locationType: "Tautan Video Conference",
    locationDetail: "https://meet.bappebti.go.id/msy-187-2",
    agenda: "Pembahasan data riwayat transaksi dan usulan penyelesaian dari Pialang.",
    proposedBy: { name: "Ahmad Pratama", institution: "Bursa Berjangka Jakarta", role: "Bursa" },
    createdAt: "2026-10-20T03:00:00.000Z",
  },
  {
    id: "MSY-SEED-184-1",
    ticket: "BPP-2026-000184",
    title: "Musyawarah Mediasi Kendala Transaksi #BPP-2026-000184",
    date: "2026-11-03",
    startTime: "14:00",
    endTime: "15:30",
    locationType: "Kantor Pialang",
    locationDetail: "Kantor PT Bursa Digital Nusantara, Jakarta",
    agenda: "Status penarikan dana WD-88213471 yang tertahan dan jadwal pencairan.",
    proposedBy: { name: "Rina Kusuma", institution: "PT Bursa Digital Nusantara", role: "Platform" },
    createdAt: "2026-10-22T03:00:00.000Z",
  },
];
