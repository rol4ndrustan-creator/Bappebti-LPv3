// Data contoh Mekanisme Penanganan Perselisihan Nasabah PBK — satu atau lebih
// kasus untuk setiap tahap pada bagan alir, relatif terhadap MOCK_NOW
// (15 Jun 2026, 15:30). Digabungkan ke CASES di lib/mock-data.ts.

import { DisputeRecord, DisputeStage, OwnerType } from "./types";

export const DISPUTE_SEED: Record<string, DisputeRecord> = {
  // Verifikasi paralel baru dimulai — Pialang masih dalam tenggat 1 hari kerja.
  "BPP-2026-000194": {
    stage: "VERIFIKASI",
    submittedAt: "15 Jun 2026, 14:30",
    bappebtiVerification: {},
    pialangClarification: {},
  },
  // Pialang melewati tenggat 1 hari kerja tanpa klarifikasi → dianggap menyetujui.
  "BPP-2026-000191": {
    stage: "VERIFIKASI",
    submittedAt: "14 Jun 2026, 09:30",
    bappebtiVerification: {},
    pialangClarification: {},
  },
  // Pialang sudah menyampaikan klarifikasi; menunggu hasil verifikasi Bappebti.
  "BPP-2026-000190": {
    stage: "VERIFIKASI",
    submittedAt: "13 Jun 2026, 16:00",
    bappebtiVerification: {},
    pialangClarification: {
      respondedAt: "15 Jun 2026, 10:20",
      respondedBy: "Indra Kusnadi",
      note: "Deposit tercatat pada rekening penampung tanggal 13 Jun 2026; kontrak & data akun valid, pengaduan tidak daluarsa.",
    },
  },
  // Syarat formil belum terpenuhi (ID pengguna platform tidak dicantumkan).
  "BPP-2026-000199": {
    stage: "PERBAIKAN_FORMIL",
    submittedAt: "15 Jun 2026, 16:20",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Tidak Terpenuhi",
      verifiedAt: "15 Jun 2026, 16:40",
      verifiedBy: "Dewi Anjani",
      note: "ID pengguna platform dan bukti transfer belum dilampirkan.",
    },
    pialangClarification: {},
    formilReturnedAt: "15 Jun 2026, 16:40",
  },
  // Syarat materiil tidak terpenuhi → ditolak & ditutup.
  "BPP-2026-000192": {
    stage: "DITOLAK_MATERIIL",
    submittedAt: "14 Jun 2026, 12:00",
    bappebtiVerification: {
      materiil: "Tidak Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "15 Jun 2026, 10:00",
      verifiedBy: "Dewi Anjani",
      note: "Pemblokiran akun terkait proses pembaruan KYC, bukan perselisihan transaksi antara nasabah dan pialang.",
    },
    pialangClarification: {
      respondedAt: "15 Jun 2026, 09:10",
      respondedBy: "Yoga Pratama",
      note: "Akun dibekukan sementara karena dokumen identitas kedaluwarsa; nasabah telah diberi tahu melalui email.",
    },
    closedAt: "15 Jun 2026, 10:00",
  },
  // Musyawarah Pialang berjalan.
  "BPP-2026-000184": {
    stage: "MUSYAWARAH",
    submittedAt: "12 Jun 2026, 09:14",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "12 Jun 2026, 11:02",
      verifiedBy: "Sistem Verifikasi",
    },
    pialangClarification: {
      respondedAt: "12 Jun 2026, 15:00",
      respondedBy: "Rina Kusuma",
      note: "Transaksi penarikan WD-88213471 valid dan masih dalam proses bank kustodian.",
    },
    dispositionAt: "12 Jun 2026, 11:05",
    musyawarah: { startedAt: "12 Jun 2026, 11:05" },
  },
  "BPP-2026-000186": {
    stage: "MUSYAWARAH",
    submittedAt: "13 Jun 2026, 10:05",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "15 Jun 2026, 09:00",
      verifiedBy: "Dewi Anjani",
    },
    pialangClarification: {
      respondedAt: "15 Jun 2026, 08:45",
      respondedBy: "Tim CS PT Pintu Kemana Saja",
      note: "Selisih saldo sedang direkonsiliasi dengan lembaga kliring.",
    },
    dispositionAt: "15 Jun 2026, 09:00",
    musyawarah: { startedAt: "15 Jun 2026, 09:00" },
  },
  // Musyawarah diperpanjang; Pialang tidak klarifikasi → dianggap menyetujui.
  "BPP-2026-000187": {
    stage: "MUSYAWARAH",
    submittedAt: "09 Jun 2026, 09:00",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "10 Jun 2026, 10:00",
      verifiedBy: "Dewi Anjani",
    },
    pialangClarification: {},
    dispositionAt: "10 Jun 2026, 10:00",
    musyawarah: { startedAt: "10 Jun 2026, 10:00", extendedDays: 14 },
  },
  // Musyawarah gagal → Mediasi Bursa berjalan.
  "BPP-2026-000193": {
    stage: "MEDIASI_BURSA",
    submittedAt: "07 Jun 2026, 10:00",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "08 Jun 2026, 14:00",
      verifiedBy: "Bambang Setiawan",
    },
    pialangClarification: {
      respondedAt: "08 Jun 2026, 09:30",
      respondedBy: "Tim Kepatuhan PT Monex Investindo Futures",
      note: "Keterlambatan disebabkan antrean verifikasi internal; kontrak nasabah aktif.",
    },
    dispositionAt: "08 Jun 2026, 14:00",
    musyawarah: { startedAt: "08 Jun 2026, 14:00", endedAt: "12 Jun 2026, 16:00", outcome: "Tidak Tercapai" },
    mediasi: { startedAt: "12 Jun 2026, 16:00" },
  },
  // Mediasi selesai (sepakat) — Bursa wajib lapor ke Bappebti dalam 1 hari kerja.
  "BPP-2026-000195": {
    stage: "LAPOR_HASIL_MEDIASI",
    submittedAt: "12 Jun 2026, 11:00",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "12 Jun 2026, 13:00",
      verifiedBy: "Dewi Anjani",
    },
    pialangClarification: {
      respondedAt: "12 Jun 2026, 12:30",
      respondedBy: "Indra Kusnadi",
      note: "Dana pasca penutupan akun masih tercatat di rekening terpisah.",
    },
    dispositionAt: "12 Jun 2026, 13:00",
    musyawarah: { startedAt: "12 Jun 2026, 13:00", endedAt: "12 Jun 2026, 17:00", outcome: "Tidak Tercapai" },
    mediasi: { startedAt: "12 Jun 2026, 17:00", endedAt: "15 Jun 2026, 09:00", outcome: "Sepakat" },
    agreement: {
      forum: "Mediasi",
      value: 89_000_000,
      documentType: "Dokumen Kesepakatan",
      submitter: "Bursa Aset Kripto Indonesia",
    },
  },
  // Musyawarah tercapai ≥ Rp100 juta → Pialang wajib menyampaikan akta perdamaian.
  "BPP-2026-000185": {
    stage: "PENYAMPAIAN_KESEPAKATAN",
    submittedAt: "10 Jun 2026, 13:21",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "11 Jun 2026, 09:00",
      verifiedBy: "Bambang Setiawan",
    },
    pialangClarification: {
      respondedAt: "11 Jun 2026, 08:30",
      respondedBy: "Yoga Pratama",
      note: "Transaksi TX-77451209 terindikasi akses tidak sah; data kontrak nasabah valid.",
    },
    dispositionAt: "11 Jun 2026, 09:00",
    musyawarah: { startedAt: "11 Jun 2026, 09:00", endedAt: "15 Jun 2026, 11:00", outcome: "Tercapai" },
    agreement: {
      forum: "Musyawarah",
      value: 158_000_000,
      documentType: "Akta Perdamaian",
      submitter: "PT Crypto Indonesia Berkat",
    },
  },
  // Mediasi tidak sepakat — nasabah memilih Pengadilan/BAKTI (≤ 20 hari kerja).
  "BPP-2026-000189": {
    stage: "PILIHAN_PENYELESAIAN",
    submittedAt: "11 Jun 2026, 08:40",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "11 Jun 2026, 13:00",
      verifiedBy: "Bambang Setiawan",
    },
    pialangClarification: {
      respondedAt: "11 Jun 2026, 16:00",
      respondedBy: "Tim Legal PT Rifan Financindo Berjangka",
      note: "Pialang menolak keterlibatan dalam penawaran robot trading pihak ketiga.",
    },
    dispositionAt: "11 Jun 2026, 13:00",
    musyawarah: { startedAt: "11 Jun 2026, 13:00", endedAt: "12 Jun 2026, 10:00", outcome: "Tidak Tercapai" },
    mediasi: { startedAt: "12 Jun 2026, 10:00", endedAt: "15 Jun 2026, 10:00", outcome: "Tidak Sepakat", reportedAt: "15 Jun 2026, 13:00" },
    forumChoice: { explainedAt: "15 Jun 2026, 13:00" },
  },
  // Selesai melalui musyawarah < Rp100 juta (dokumen kesepakatan).
  "BPP-2026-000196": {
    stage: "SELESAI",
    submittedAt: "05 Jun 2026, 10:00",
    bappebtiVerification: {
      materiil: "Terpenuhi",
      formil: "Terpenuhi",
      verifiedAt: "05 Jun 2026, 14:00",
      verifiedBy: "Dewi Anjani",
    },
    pialangClarification: {
      respondedAt: "05 Jun 2026, 13:00",
      respondedBy: "Tim CS PT Monex Investindo Futures",
      note: "Biaya transaksi tercatat ganda akibat gangguan sistem.",
    },
    dispositionAt: "05 Jun 2026, 14:00",
    musyawarah: { startedAt: "05 Jun 2026, 14:00", endedAt: "09 Jun 2026, 10:00", outcome: "Tercapai" },
    agreement: {
      forum: "Musyawarah",
      value: 350_000,
      documentType: "Dokumen Kesepakatan",
      submitter: "PT Monex Investindo Futures",
      documentName: "Dokumen Kesepakatan BPP-2026-000196.pdf",
      submittedAt: "09 Jun 2026, 11:20",
    },
    closedAt: "09 Jun 2026, 11:20",
  },
};

/** Pemilik tindakan awal per tahap untuk data contoh (selaras dengan DISPUTE_STAGES). */
export const DISPUTE_SEED_OWNER: Record<DisputeStage, OwnerType> = {
  VERIFIKASI: "Bappebti",
  PERBAIKAN_FORMIL: "Pelapor",
  DITOLAK_MATERIIL: "Bappebti",
  MUSYAWARAH: "Platform",
  MEDIASI_BURSA: "Bursa",
  LAPOR_HASIL_MEDIASI: "Bursa",
  PENYAMPAIAN_KESEPAKATAN: "Platform",
  PILIHAN_PENYELESAIAN: "Pelapor",
  PENGADILAN_BAKTI: "Pelapor",
  SELESAI: "Bappebti",
};
