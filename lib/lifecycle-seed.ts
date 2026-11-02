// Data contoh siklus tiket (List Revisi 12), relatif terhadap waktu saat ini
// agar setiap status — termasuk transisi otomatis — selalu dapat didemokan.

import { TicketLifecycle } from "./types";
import { getPialangOfficials } from "./pialang-profiles";
import { CASES } from "./mock-data";

type SeedSpec = (ago: (days: number, hours?: number) => string) => Partial<TicketLifecycle>;

const BAPPEBTI = "Bappebti";

const SPECS: Record<string, SeedSpec> = {
  // Menunggu Verifikasi Pialang
  "BPP-2026-000194": (ago) => ({ submittedAt: ago(0, 3) }),
  "BPP-2026-000198": (ago) => ({ submittedAt: ago(0, 5) }),
  "BPP-2026-000199": (ago) => ({ submittedAt: ago(0, 2) }),
  // Pengajuan Reject — menunggu review Bappebti
  "BPP-2026-000191": (ago) => ({
    submittedAt: ago(2),
    pialangReview: {
      decision: "Ditolak",
      reason: "Pengaduan sedang aktif diproses di kanal lain",
      document: "Bukti proses kanal lain - BPP-2026-000191.pdf",
      note: "Nasabah telah mengajukan keluhan yang sama melalui layanan pengaduan internal dan sedang ditangani.",
      by: "Rina Kusuma",
      institution: "PT Bursa Digital Nusantara",
      at: ago(1),
    },
  }),
  // Rejected permanen
  "BPP-2026-000190": (ago) => ({
    submittedAt: ago(7),
    pialangReview: {
      decision: "Ditolak",
      reason: "Pengaduan sudah pernah diproses",
      document: "Berita acara penyelesaian sebelumnya.pdf",
      note: "Kasus deposit yang sama telah diselesaikan pada pengaduan sebelumnya.",
      by: "Indra Kusnadi",
      institution: "PT Indodax Nasional Indonesia",
      at: ago(6),
    },
    bappebtiReview: {
      decision: "Setujui Penolakan",
      note: "Bukti penyelesaian sebelumnya valid. Nasabah dapat mengajukan komplain baru bila ada fakta baru.",
      by: "Dewi Anjani",
      institution: BAPPEBTI,
      at: ago(4),
    },
  }),
  // Proses Musyawarah
  "BPP-2026-000184": (ago) => ({
    submittedAt: ago(9),
    pialangReview: { decision: "Disetujui", by: "Rina Kusuma", institution: "PT Bursa Digital Nusantara", at: ago(8) },
  }),
  "BPP-2026-000186": (ago) => ({ submittedAt: ago(6) }), // disetujui otomatis (SLA review Pialang terlewati)
  "BPP-2026-000187": (ago) => ({
    submittedAt: ago(20),
    pialangReview: { decision: "Disetujui", by: "Tim CS Monex", institution: "PT Monex Investindo Futures", at: ago(19) },
  }),
  "BPP-2026-000193": (ago) => ({
    submittedAt: ago(14),
    pialangReview: {
      decision: "Ditolak",
      reason: "Pengaduan sudah pernah diproses",
      document: "Surat tanggapan sebelumnya.pdf",
      by: "Tim Kepatuhan Monex",
      institution: "PT Monex Investindo Futures",
      at: ago(13),
    },
    bappebtiReview: {
      decision: "Kembalikan ke Pialang",
      note: "Bukti tidak menunjukkan penyelesaian substantif. Wajib dilanjutkan ke musyawarah.",
      by: "Bambang Setiawan",
      institution: BAPPEBTI,
      at: ago(11),
    },
  }),
  // Diajukan Penyelesaian
  "BPP-2026-000188": (ago) => ({
    submittedAt: ago(10),
    pialangReview: { decision: "Disetujui", by: "Indra Kusnadi", institution: "PT Indodax Nasional Indonesia", at: ago(9) },
    resolutionOffers: [
      {
        id: "OFR-188-1",
        text: "Penutupan akun diproses paling lambat 3 hari kerja dan seluruh saldo dikembalikan ke rekening terdaftar nasabah.",
        by: "Indra Kusnadi",
        institution: "PT Indodax Nasional Indonesia",
        at: ago(2),
      },
    ],
  }),
  // Close Resolusi
  "BPP-2026-000196": (ago) => ({
    submittedAt: ago(25),
    pialangReview: { decision: "Disetujui", by: "Tim CS Monex", institution: "PT Monex Investindo Futures", at: ago(24) },
    resolutionOffers: [
      {
        id: "OFR-196-1",
        text: "Pengembalian biaya transaksi ganda sebesar Rp350.000 ke rekening nasabah.",
        amount: 350_000,
        by: "Tim CS Monex",
        institution: "PT Monex Investindo Futures",
        at: ago(20),
        response: "Setuju",
        respondedAt: ago(19),
      },
    ],
  }),
  // Close Auto — nasabah tidak merespons tawaran resolusi
  "BPP-2026-000197": (ago) => ({
    submittedAt: ago(30),
    pialangReview: { decision: "Disetujui", by: "Yoga Pratama", institution: "PT Crypto Indonesia Berkat", at: ago(29) },
    resolutionOffers: [
      {
        id: "OFR-197-1",
        text: "Penjelasan tertulis atas transaksi yang tidak dikenali beserta bukti otorisasi OTP.",
        by: "Yoga Pratama",
        institution: "PT Crypto Indonesia Berkat",
        at: ago(12),
      },
    ],
  }),
  // Masa Pengajuan Arbitrase (musyawarah Tidak Sepakat)
  "BPP-2026-000195": (ago) => ({
    submittedAt: ago(30),
    pialangReview: { decision: "Disetujui", by: "Indra Kusnadi", institution: "PT Indodax Nasional Indonesia", at: ago(29) },
    musyawarahFailedAt: ago(3),
  }),
  // Selesai Non-Arbitrase — jendela arbitrase berakhir
  "BPP-2026-000192": (ago) => ({
    submittedAt: ago(75),
    pialangReview: { decision: "Disetujui", by: "Yoga Pratama", institution: "PT Crypto Indonesia Berkat", at: ago(74) },
    musyawarahFailedAt: ago(45),
  }),
  // Proses Arbitrase BAKTI (tahap sidang)
  "BPP-2026-000189": (ago) => ({
    submittedAt: ago(40),
    pialangReview: { decision: "Disetujui", by: "Tim Legal Rifan", institution: "PT Rifan Financindo Berjangka", at: ago(39) },
    legalProceeding: { answer: "Ya", document: "Laporan Polisi LP-B-1234-VI-2026.pdf", by: "Tim Legal Rifan", institution: "PT Rifan Financindo Berjangka", at: ago(39) },
    musyawarahFailedAt: ago(12),
    arbitration: {
      institution: "BAKTI",
      formFile: "Formulir Registrasi BAKTI - Ahmad Sutrisno.pdf",
      submittedAt: ago(8),
      submittedBy: "Ahmad Sutrisno",
      verification: { decision: "Disetujui", note: "Berkas permohonan lengkap.", by: "Wulan Kartika", institution: "BAKTI", at: ago(6) },
      hearings: [
        {
          id: "HRG-189-1",
          date: ago(3).slice(0, 10),
          number: "BAKTI/SDG/2026/0142",
          notula: "Sidang pertama: pembacaan permohonan dan tanggapan Pialang. Majelis meminta bukti aliran dana.",
          document: "Berita Acara Sidang 1 - BPP-2026-000189.pdf",
          by: "Wulan Kartika",
          institution: "BAKTI",
          at: ago(3),
        },
      ],
    },
  }),
  // Close Arbitrase
  "BPP-2026-000185": (ago) => ({
    submittedAt: ago(70),
    pialangReview: { decision: "Disetujui", by: "Yoga Pratama", institution: "PT Crypto Indonesia Berkat", at: ago(69) },
    musyawarahFailedAt: ago(50),
    arbitration: {
      institution: "BAKTI",
      formFile: "Formulir Registrasi BAKTI - Melisa Hartono.pdf",
      submittedAt: ago(45),
      submittedBy: "Melisa Hartono",
      verification: { decision: "Disetujui", note: "Berkas permohonan lengkap.", by: "Wulan Kartika", institution: "BAKTI", at: ago(44) },
      hearings: [
        {
          id: "HRG-185-1",
          date: ago(30).slice(0, 10),
          number: "BAKTI/SDG/2026/0098",
          notula: "Pemeriksaan bukti transaksi tanpa otorisasi.",
          document: "Berita Acara Sidang 1 - BPP-2026-000185.pdf",
          by: "Wulan Kartika",
          institution: "BAKTI",
          at: ago(30),
        },
        {
          id: "HRG-185-2",
          date: ago(15).slice(0, 10),
          number: "BAKTI/SDG/2026/0121",
          notula: "Pembacaan kesimpulan para pihak.",
          document: "Berita Acara Sidang 2 - BPP-2026-000185.pdf",
          by: "Wulan Kartika",
          institution: "BAKTI",
          at: ago(15),
        },
      ],
      verdict: {
        decision: "Disetujui Sebagian Permintaan",
        notes: "Pialang wajib mengembalikan 60% dari nilai transaksi tanpa otorisasi.",
        document: "Putusan Arbitrase BAKTI - BPP-2026-000185.pdf",
        by: "Wulan Kartika",
        institution: "BAKTI",
        at: ago(10),
      },
    },
  }),
};

export function lifecycleSeed(ticket: string, now: Date): TicketLifecycle {
  const ago = (days: number, hours = 0) => new Date(now.getTime() - days * 86_400_000 - hours * 3_600_000).toISOString();
  const c = CASES.find((x) => x.ticket === ticket);
  const officials = getPialangOfficials(c?.platform ?? "");
  const wpb = officials.filter((o) => o.position === "Wakil Pialang Berjangka (WPB)");
  const respondent = wpb.length ? { position: wpb[0].position, name: wpb[0].name } : undefined;
  const spec = (SPECS[ticket] ?? ((a) => ({ submittedAt: a(5) })))(ago);
  const submittedAt = spec.submittedAt ?? ago(5);
  const incident = new Date(new Date(submittedAt).getTime() - 4 * 86_400_000);
  return {
    incidentDate: incident.toISOString().slice(0, 10),
    incidentDateLog: [],
    respondent,
    resolutionOffers: [],
    ...spec,
    submittedAt,
  };
}
