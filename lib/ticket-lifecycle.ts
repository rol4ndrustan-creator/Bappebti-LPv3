// Aturan siklus tiket (List Revisi 12). Fungsi murni: status diturunkan dari
// catatan siklus + parameter bisnis + waktu saat ini, sehingga transisi
// otomatis (auto-approve, Close Auto, Selesai Non-Arbitrase) tidak perlu job.

import { BusinessParams, TicketLifecycle, TicketStatus } from "./types";
import { addBusinessDays, addCalendarDays, businessDaysBetween } from "./business-days";

export const TICKET_STATUS_TONE: Record<TicketStatus, "navy" | "amber" | "green" | "red" | "muted"> = {
  "Triase Bappebti": "navy",
  "Perlu Perbaikan Berkas": "amber",
  "Menunggu Verifikasi Pialang": "navy",
  "Pengajuan Reject": "amber",
  Rejected: "red",
  "Proses Musyawarah": "amber",
  "Proses Mediasi Bursa": "amber",
  "Diajukan Penyelesaian": "navy",
  "Close Resolusi": "green",
  "Close Auto": "muted",
  "Masa Pengajuan Arbitrase": "amber",
  "Proses Arbitrase BAKTI": "navy",
  "Close Arbitrase": "green",
  "Selesai Non-Arbitrase": "muted",
};

export const CLOSED_TICKET_STATUSES: TicketStatus[] = ["Rejected", "Close Resolusi", "Close Auto", "Close Arbitrase", "Selesai Non-Arbitrase"];

export interface LifecycleView {
  lc: TicketLifecycle;
  status: TicketStatus;
  isClosed: boolean;
  /** Batas review Pialang (auto-approve setelahnya). */
  pialangDeadline: Date;
  autoApproved: boolean;
  /** Batas SLA penyelesaian kasus & sisa hari (negatif = terlewati). */
  slaDeadline: Date;
  slaRemainingDays: number;
  /** Tawaran resolusi yang sedang menunggu respons nasabah. */
  pendingOffer?: TicketLifecycle["resolutionOffers"][number];
  resolutionDeadline?: Date;
  /** Jendela arbitrase H+1 s/d H+N hari kerja. */
  arbitrationWindow?: { start: Date; end: Date; active: boolean; remainingBusinessDays: number };
  /** Umur perkara sejak tanggal kejadian melebihi batas kedaluwarsa. */
  expired: boolean;
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function deriveLifecycle(lc: TicketLifecycle, p: BusinessParams, now: Date): LifecycleView {
  const submitted = new Date(lc.submittedAt);
  const triagePending = !!lc.triage && !lc.triage.assignedPialang;
  const revisionPending = !!lc.revisionRequest && !lc.revisionRequest.resolvedAt;
  // SLA review Pialang dihitung sejak tiket sampai ke Pialang: setelah triase / perbaikan berkas terakhir.
  const reviewStart = [lc.submittedAt, lc.triage?.at, lc.revisionRequest?.resolvedAt]
    .filter((x): x is string => !!x)
    .map((x) => new Date(x))
    .reduce((a, b) => (b > a ? b : a));
  const pialangDeadline = addBusinessDays(reviewStart, p.slaReviewPialangBusinessDays);
  const slaDeadline = addCalendarDays(submitted, p.slaPenyelesaianDays);
  const slaRemainingDays = Math.ceil((dayStart(slaDeadline).getTime() - dayStart(now).getTime()) / 86_400_000);
  const autoApproved = !lc.pialangReview && !triagePending && !revisionPending && !lc.bappebtiRejection && now > pialangDeadline;
  const expired = !!lc.incidentDate && (now.getTime() - new Date(`${lc.incidentDate}T00:00:00+07:00`).getTime()) / 86_400_000 > p.kedaluwarsaDays;

  const accepted = lc.resolutionOffers.find((o) => o.response === "Setuju");
  const last = lc.resolutionOffers[lc.resolutionOffers.length - 1];
  const pendingOffer = last && !last.response ? last : undefined;
  const resolutionDeadline = pendingOffer ? addCalendarDays(new Date(pendingOffer.at), p.resolutionResponseDays) : undefined;

  let arbitrationWindow: LifecycleView["arbitrationWindow"];
  if (lc.musyawarahFailedAt) {
    const failed = new Date(lc.musyawarahFailedAt);
    const start = dayStart(addBusinessDays(failed, 1));
    const end = addBusinessDays(dayStart(failed), p.arbitrationWindowBusinessDays + 1);
    arbitrationWindow = { start, end, active: now >= start && now < end, remainingBusinessDays: Math.max(0, businessDaysBetween(now, end)) };
  }

  let status: TicketStatus;
  const a = lc.arbitration;
  if (a?.verdict) status = "Close Arbitrase";
  else if (a && a.verification?.decision === "Ditolak") status = "Selesai Non-Arbitrase";
  else if (a) status = "Proses Arbitrase BAKTI";
  else if (accepted) status = "Close Resolusi";
  else if (pendingOffer && resolutionDeadline && now > resolutionDeadline) status = "Close Auto";
  else if (pendingOffer) status = "Diajukan Penyelesaian";
  else if (arbitrationWindow) status = now >= arbitrationWindow.end ? "Selesai Non-Arbitrase" : "Masa Pengajuan Arbitrase";
  else if (lc.mediation) status = "Proses Mediasi Bursa";
  else if (lc.bappebtiRejection || lc.bappebtiReview?.decision === "Setujui Penolakan") status = "Rejected";
  else if (lc.bappebtiReview?.decision === "Kembalikan ke Pialang") status = "Proses Musyawarah";
  else if (lc.pialangReview?.decision === "Ditolak") status = "Pengajuan Reject";
  else if (lc.pialangReview?.decision === "Disetujui" || autoApproved) status = "Proses Musyawarah";
  else if (revisionPending) status = "Perlu Perbaikan Berkas";
  else if (triagePending) status = "Triase Bappebti";
  else status = "Menunggu Verifikasi Pialang";

  return {
    lc,
    status,
    isClosed: CLOSED_TICKET_STATUSES.includes(status),
    pialangDeadline,
    autoApproved,
    slaDeadline,
    slaRemainingDays,
    pendingOffer,
    resolutionDeadline,
    arbitrationWindow,
    expired,
  };
}

/** Penjelasan kartu status (apa, siapa, tindakan, batas waktu) berdasarkan siklus tiket. */
export function lifecycleExplanation(
  v: LifecycleView,
  c: { platform: string },
  viewer: "public" | "internal",
  fmt: (d: Date) => string
): { what: string; who: string; action: string; deadline: string; actionRequiredFromViewer: boolean } {
  const pub = viewer === "public";
  const sla = `SLA penyelesaian kasus berakhir ${fmt(v.slaDeadline)} WIB.`;
  switch (v.status) {
    case "Triase Bappebti":
      return {
        what: "Pelapor belum mengetahui nama Pialang. Tiket berada di antrean triase Bappebti untuk dianalisis dan diteruskan ke Pialang terkait.",
        who: "Bappebti.",
        action: pub ? "Tidak ada tindakan yang diperlukan dari Anda saat ini." : "Bappebti menganalisis pengaduan lalu menugaskan (assign) ke Pialang terkait.",
        deadline: sla,
        actionRequiredFromViewer: !pub,
      };
    case "Perlu Perbaikan Berkas":
      return {
        what: `Berkas pengaduan perlu diperbaiki: ${v.lc.revisionRequest?.note ?? "-"}`,
        who: "Nasabah (pelapor).",
        action: pub ? "Tindakan Anda diperlukan — kirim perbaikan berkas melalui kartu Perbaikan Berkas." : "Menunggu perbaikan berkas dari nasabah.",
        deadline: "SLA review Pialang dihitung ulang setelah perbaikan diterima.",
        actionRequiredFromViewer: pub,
      };
    case "Proses Mediasi Bursa":
      return {
        what: v.lc.mediation?.outcome === "Sepakat"
          ? `Mediasi oleh ${v.lc.mediation.bursa} mencapai kesepakatan; menunggu tawaran resolusi dari Pialang.`
          : `Musyawarah tidak mencapai kesepakatan. Perselisihan dimediasi oleh Bursa (${v.lc.mediation?.bursa ?? "-"}).`,
        who: v.lc.mediation?.outcome === "Sepakat" ? `Pialang — ${c.platform}.` : `Bursa — ${v.lc.mediation?.bursa ?? "-"}.`,
        action: pub ? "Hadiri jadwal mediasi yang diinformasikan Bursa." : "Bursa mencatat hasil mediasi (Sepakat / Tidak Sepakat).",
        deadline: sla,
        actionRequiredFromViewer: !pub,
      };
    case "Menunggu Verifikasi Pialang":
      return {
        what: `Komplain baru sedang diverifikasi oleh Pialang (${c.platform}).`,
        who: `Pialang — ${c.platform}.`,
        action: pub ? "Tidak ada tindakan yang diperlukan dari Anda saat ini." : "Pialang menyetujui (lanjut musyawarah) atau menolak komplain dengan alasan & bukti PDF.",
        deadline: `Batas review Pialang ${fmt(v.pialangDeadline)} WIB; jika terlewati komplain otomatis disetujui.`,
        actionRequiredFromViewer: !pub,
      };
    case "Pengajuan Reject":
      return {
        what: `Pialang mengajukan penolakan komplain (${v.lc.pialangReview?.reason ?? "-"}). Bappebti sedang meninjau keputusan tersebut.`,
        who: "Bappebti.",
        action: pub ? "Tidak ada tindakan yang diperlukan dari Anda saat ini." : "Bappebti: Kembalikan ke Pialang (wajib musyawarah) atau Setujui Penolakan.",
        deadline: sla,
        actionRequiredFromViewer: !pub,
      };
    case "Rejected":
      return {
        what: "Penolakan Pialang telah disetujui Bappebti. Pengaduan ditolak permanen.",
        who: "Tidak ada pihak yang wajib bertindak.",
        action: pub ? "Anda dapat mengajukan komplain baru bila terdapat fakta atau bukti baru." : "Tidak ada tindakan lanjutan.",
        deadline: "Proses telah berakhir.",
        actionRequiredFromViewer: false,
      };
    case "Proses Musyawarah":
      return {
        what: v.autoApproved
          ? "Komplain disetujui otomatis (SLA review Pialang terlewati) dan masuk tahap musyawarah Nasabah–Pialang."
          : "Pengaduan dalam tahap musyawarah antara Nasabah dan Pialang.",
        who: `Pialang — ${c.platform} (penyelenggara musyawarah).`,
        action: pub ? "Hadiri jadwal musyawarah pada tab Musyawarah. Tawaran resolusi akan tampil pada tab Solusi." : "Jadwalkan musyawarah dan ajukan tawaran resolusi kepada nasabah.",
        deadline: sla,
        actionRequiredFromViewer: !pub,
      };
    case "Diajukan Penyelesaian":
      return {
        what: `Pialang (${c.platform}) telah mengajukan tawaran resolusi damai kepada nasabah.`,
        who: "Nasabah (pelapor).",
        action: pub ? "Tindakan Anda diperlukan — setujui atau tolak tawaran resolusi pada tab Solusi." : "Menunggu persetujuan nasabah atas tawaran resolusi.",
        deadline: v.resolutionDeadline ? `Tanggapan paling lambat ${fmt(v.resolutionDeadline)} WIB; tanpa respons tiket ditutup otomatis (Close Auto).` : sla,
        actionRequiredFromViewer: pub,
      };
    case "Masa Pengajuan Arbitrase":
      return {
        what: "Musyawarah/mediasi berakhir Tidak Sepakat. Nasabah dapat mengajukan penyelesaian melalui arbitrase BAKTI.",
        who: "Nasabah (pelapor).",
        action: pub ? "Ajukan penyelesaian melalui arbitrase (BAKTI) bila diinginkan." : "Menunggu keputusan nasabah untuk mendaftar arbitrase.",
        deadline: v.arbitrationWindow
          ? `Jendela arbitrase berakhir ${fmt(new Date(v.arbitrationWindow.end.getTime() - 1))} WIB; tanpa pendaftaran status menjadi Selesai Non-Arbitrase.`
          : sla,
        actionRequiredFromViewer: pub && !!v.arbitrationWindow?.active,
      };
    case "Proses Arbitrase BAKTI":
      return {
        what: "Perkara sedang diproses melalui arbitrase BAKTI (Proses Penyelesaian Khusus).",
        who: "BAKTI.",
        action: pub ? "Ikuti jadwal sidang yang ditetapkan BAKTI." : "BAKTI memverifikasi permohonan, mencatat sidang, dan menerbitkan putusan akhir.",
        deadline: sla,
        actionRequiredFromViewer: false,
      };
    case "Selesai Non-Arbitrase":
      return {
        what: "Jendela arbitrase berakhir tanpa pendaftaran. Status: Selesai Non-Arbitrase.",
        who: "Tidak ada pihak yang wajib bertindak.",
        action: pub ? "Unduh surat pengantar Bappebti untuk pendaftaran gugatan ke Pengadilan Negeri." : "Surat pengantar Pengadilan Negeri telah tersedia bagi nasabah.",
        deadline: "Proses di portal telah berakhir.",
        actionRequiredFromViewer: false,
      };
    default:
      return {
        what:
          v.status === "Close Resolusi"
            ? "Nasabah menyetujui tawaran resolusi damai. Pengaduan selesai (Close Resolusi)."
            : v.status === "Close Auto"
              ? "Nasabah tidak menanggapi tawaran resolusi hingga batas waktu. Tiket ditutup otomatis (Close Auto)."
              : `Putusan akhir arbitrase BAKTI telah diterbitkan: ${v.lc.arbitration?.verdict?.decision ?? "-"} (Close Arbitrase).`,
        who: "Tidak ada pihak yang wajib bertindak.",
        action: "Tidak ada tindakan lanjutan.",
        deadline: "Proses telah berakhir.",
        actionRequiredFromViewer: false,
      };
  }
}

/**
 * Sisa SLA dalam satuan hari kerja saja (List Revisi 13 #7):
 * "Sisa N Hari Kerja" · "Hari Terakhir (Hari Ini)" · "Lewat SLA (Overdue X Hari)".
 */
export function slaDaysLabel(deadline: Date, now: Date): { label: string; tone: "green" | "amber" | "red" } {
  const n = businessDaysBetween(now, deadline);
  if (now > deadline) return { label: `Lewat SLA (Overdue ${Math.max(1, -n)} Hari)`, tone: "red" };
  if (n <= 0) return { label: "Hari Terakhir (Hari Ini)", tone: "amber" };
  return { label: `Sisa ${n} Hari Kerja`, tone: n === 1 ? "amber" : "green" };
}
