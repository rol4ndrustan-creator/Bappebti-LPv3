# Bappebti LPv3 — Layanan Pengaduan

LPv3 is a copy of Bappebti-LPv2 (branch `claude/bappebti-review-redesign`), extended through
List Revisi 10–13. User-facing text says "Pialang"; routes (`/platform/...`) and internal codes keep their original names.

## Siklus Tiket (List Revisi 12)

The former "Perselisihan PBK" tab/menus were removed; every ticket now follows one lifecycle
(`lib/ticket-lifecycle.ts`, actions in `lib/lifecycle-actions.ts`):

| Status | Meaning |
|---|---|
| Triase Bappebti | Reporter did not know the Pialang; Bappebti assigns it (Revisi 13) |
| Perlu Perbaikan Berkas | Pialang/Bappebti asked the reporter to fix documents; review SLA restarts after the fix |
| Menunggu Verifikasi Pialang | New ticket in the Pialang's *Verifikasi Komplain Baru* queue (auto-approved after SLA Review Pialang) |
| Pengajuan Reject → Rejected | Pialang rejected (reason + PDF); Bappebti *Verifikasi Ditolak Pialang* approves (Rejected) or returns it (forced musyawarah) |
| Proses Musyawarah | Meetings scheduled/edited/cancelled; outcome *Tidak Sepakat* opens the arbitration window |
| Proses Mediasi Bursa | Musyawarah failed and was escalated to Bursa mediation; Sepakat → resolution offer, Tidak Sepakat → arbitration window |
| Diajukan Penyelesaian → Close Resolusi / Close Auto | Pialang resolution offer; nasabah agrees, or no response within the configured deadline |
| Masa Pengajuan Arbitrase → Proses Arbitrase BAKTI → Close Arbitrase | Nasabah files BAKTI arbitration H+1 … 20 business days; BAKTI verifies, records hearings, issues verdict |
| Selesai Non-Arbitrase | Window lapsed; Bappebti cover letter for Pengadilan Negeri (PDF) |

Parameters (SLA Review Pialang, SLA Penyelesaian, Kedaluwarsa 730 hari, Jendela Arbitrase 20 HK,
Tenggat Persetujuan Resolusi) live at `/admin/konfigurasi/parameter`. Demo lifecycle data is
generated relative to the current date (`lib/lifecycle-seed.ts`); pialang officials are simulated
"Profiling Bappebti" data (`lib/pialang-profiles.ts`).

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

## List Revisi 14

- Reject remarks limited to three standard reasons (issue resolved / issue being processed / already in court or arbitration) with mandatory PDF evidence; the court/police question is removed.
- "Ekosistem Pengawas" is now labelled "Ekosistem Pasif".
- Public portal redesigned: institutional header (logos in `public/images/logo/` are placeholders — replace with the official files using the same names), landing page, `/publik/cek-pengaduan` tracking, `/publik/bantuan`, account menu and footer.
- Case detail has an "Anggota Pasar yang Dilibatkan" panel with a 3-step assignment modal.
- Bursa/Kliring/Asosiasi dashboards removed from navigation; their URLs redirect to Ekosistem Active / Pasif.
