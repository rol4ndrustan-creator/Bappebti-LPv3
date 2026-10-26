# Bappebti LPv3 — Layanan Pengaduan

LPv3 is a copy of Bappebti-LPv2 (branch `claude/bappebti-review-redesign`). It adds the
**Mekanisme Penanganan Perselisihan Nasabah PBK** (the Bappebti dispute-handling flowchart).

## Mekanisme Penanganan Perselisihan Nasabah PBK

| Tahap | Pihak | Tenggat |
|---|---|---|
| Pengaduan online + unggah berkas → diteruskan otomatis | Sistem | – |
| Verifikasi materiil & formil | Bappebti | 2 hari kerja |
| Klarifikasi (paralel); bila tidak ada → dianggap menyetujui | Pialang | 1 hari kerja |
| Materiil tidak terpenuhi → ditolak & ditutup | Bappebti | – |
| Formil tidak terpenuhi → dikembalikan untuk perbaikan | Nasabah | 2 hari kerja |
| Disposisi → Musyawarah | Pialang | 21 hari kerja (+ maks. 14 hari) |
| Mediasi (jika musyawarah gagal) | Bursa | 21 hari kerja (+ maks. 14 hari) |
| Lapor hasil mediasi | Bursa → Bappebti | 1 hari kerja |
| Kesepakatan: < Rp100 juta dokumen kesepakatan, ≥ Rp100 juta akta perdamaian | Pialang / Bursa | – |
| Tidak sepakat → Pengadilan / BAKTI | Nasabah | BAKTI ≤ 20 hari kerja |

- Rules & transitions: `lib/dispute-workflow.ts` (`DISPUTE_RULES`)
- Business-day calendar: `lib/business-days.ts` (add yearly moveable holidays / cuti bersama to `HOLIDAYS_BY_DATE`)
- Demo data per stage: `lib/dispute-seed.ts`
- UI: tab **Penyelesaian Perselisihan** on every case detail (Bappebti, Platform, Ekosistem, Publik);
  queues at `/bappebti/pengaduan/perselisihan`, `/platform/musyawarah`, `/ekosistem/active/mediasi`;
  public explainer at `/publik/alur-penyelesaian`.

Assumptions (flowchart is ambiguous): exactly Rp100.000.000 is treated as *akta perdamaian*;
the "maks. 14 hari" extension is counted in calendar days.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
