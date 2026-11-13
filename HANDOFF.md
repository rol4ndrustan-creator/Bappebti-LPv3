# Handoff — Bappebti Layanan Pengaduan (LPv3)

Paste the "Prompt for the new chat" section into a new Claude Code session that has the repo `rol4ndrustan-creator/Bappebti-LPv3` attached.

## Prompt for the new chat

You are continuing work on **Bappebti-LPv3**, a clickable prototype of the Bappebti (Indonesian commodity futures regulator) complaint-handling system, built for PT Capio Teknologi Indonesia. The user writes in Indonesian and sends numbered "LIST REVISI" batches; reply in Indonesian. Revisi 10–16 are done, pushed and deployed. The latest commit on `main` is `3ce8a12`.

**Repos & deploy**
- Work only in `rol4ndrustan-creator/Bappebti-LPv3`, branch `main`. Pushing to `main` runs `.github/workflows/deploy.yml` and publishes to https://rol4ndrustan-creator.github.io/Bappebti-LPv3/
- Never modify `Bappebti-LPv2` (the older copy the user wants kept intact).
- No pull requests unless asked. No model names in commits or code.
- Commit messages end with the attribution trailer the session gives you.

**Stack**
- Next.js 16.2 App Router with `output: "export"` and basePath `/Bappebti-LPv3`. Read `node_modules/next/dist/docs/` before using Next APIs, because this version differs from older ones (see AGENTS.md).
- React 19, TypeScript, Tailwind v4, lucide-react, radix-style components in `components/ui/*`.
- jsPDF 4 for PDFs, fflate for XLSX exports.
- No backend. All data is mock data in `lib/mock-data.ts`, plus localStorage stores in `lib/mock-service/*`. Stores use a `subscribe`/`emitChange`/`getVersion` event bus read through `useSyncExternalStore`.
- `useClock()` returns null during prerender, which avoids hydration mismatches.

**Portals and demo roles**
- Roles are defined in `DEMO_USERS` in `lib/permissions.ts`. The active role is stored in localStorage under `bappebti-demo-role`.
- Internal login flag: `bappebti-internal-authed`. Public login flag: `bappebti-publik-authed`.

| Portal | Route | Demo user | Accent |
|---|---|---|---|
| Publik | `/publik` | andra | Emerald (#0D5C3A) |
| Bappebti | `/bappebti` | dewi | Navy |
| Pialang | `/platform` (URL kept from the old "Platform" name) | ferry | Maroon |
| Ekosistem Active | `/ekosistem/active` | galih; Bursa / Kliring / Custody sub-roles via `?peran=` | — |
| Ekosistem Pasif | `/ekosistem/pengawas` (URL kept from the old "Pengawas" name) | wulan / lina | — |

- `ViewerGroup` values: "User" | "Bappebti" | "Pialang" | "EkosistemActive" | "EkosistemPengawas".
- The old Bursa, Kliring and Asosiasi portals are removed from navigation; their URLs redirect.
- Portal accent colours come from `[data-portal=...]` rules in `app/globals.css`. The `navy` utilities resolve to each portal's own accent.

**Core model**
- `lib/ticket-lifecycle.ts` holds `deriveLifecycle(lc, params, now)`. It is pure: the status is derived from the stored record, so it is never saved directly.
- Statuses: Menunggu Verifikasi Pialang, Triase Bappebti, Perlu Perbaikan Berkas, Pengajuan Reject, Rejected, Proses Musyawarah, Proses Mediasi Bursa, Diajukan Penyelesaian, Close Resolusi, Close Auto, Masa Pengajuan Arbitrase, Selesai Non-Arbitrase, Proses Arbitrase BAKTI, Close Arbitrase.
- Seeds live in `lib/lifecycle-seed.ts`; dates are relative to now, so every status can always be demoed. Actions live in `lib/lifecycle-actions.ts`. Business parameters (SLAs and similar) are in `lib/mock-service/params-store.ts`.
- Reject reasons: there are exactly 3, and the PDF evidence is mandatory. They are listed as `REJECT_REASONS` in `components/shared/ticket-lifecycle.tsx` and reused by `CLOSE_ADMINISTRATIVE_REASONS` in `lib/case-actions.ts`.

**Key UI components**
- `components/shared/ticket-lifecycle.tsx`: the lifecycle panel, the Pialang verification step, the reject dialog and `LifecycleTracker`.
- `components/shared/kasus-detail-client.tsx`: the internal case detail page.
- `components/shared/member-assignment-panel.tsx`: the "Anggota Pasar yang Dilibatkan" panel with its 3-step modal. Listing tables show members read-only via `MemberChips` from `member-link-cell.tsx`.
- `components/shared/ticket-link.tsx`: renders ticket numbers as links. Use it in every complaint table.
- `components/ui/table.tsx`: shared table with a horizontal-scroll wrapper. Portal shells need `min-w-0` so wide tables stay inside their card.
- `components/publik/public-shell.tsx`: public header, account menu and footer. `app/publik/layout.tsx` wraps every `/publik` page in this shell; its `PUBLIC_PATHS` lists the pages that need no login.
- Public pages: landing at `app/publik/page.tsx` (Revisi 15 design system: emerald, slate, amber; Plus Jakarta Sans; desktop stepper and mobile timeline), `/publik/cek-pengaduan` and `/publik/bantuan`.

**Testing workflow**
1. Run `npx tsc --noEmit -p .` and `npx eslint lib components app --quiet`.
2. Run `npm run build`, which produces `out/`.
3. Serve `out/` with a tiny static server at `http://localhost:4310/Bappebti-LPv3` and drive it with Playwright (pre-installed; `require('playwright')`).
4. Test at viewport widths 375, 768 and 1280, and check that `document.documentElement.scrollWidth` is never larger than the viewport width.
5. Before a role-dependent page loads, set the role flags: `localStorage.setItem('bappebti-demo-role','dewi')` and `localStorage.setItem('bappebti-internal-authed','1')`. Public pages need `'andra'` and `bappebti-publik-authed`.

**Open items / things the user must supply**
- Official logo: `public/images/logo/logo-kemendag-bappebti.png` (Kemendag + Bappebti lockup, cropped from the user's image, transparent background). `InstitutionLogos` in `public-shell.tsx` renders it. A vector original would be sharper if the user can supply one.
- `/publik/bantuan` shows the official contacts (email humas.bappebti@kemendag.go.id, SMS/WA 0811-1109-901, phones (021) 35289028/27/110/109).
- The user's "Project Knowledge" files (`design-system-guidelines.md`, `responsive-rules.md`, `component-patterns.md`) are not in the repo. Revisi 15 followed the rules as pasted in chat:
  - Colours: primary emerald #0D5C3A / #064E3B, accent amber, neutral slate.
  - Layout: mobile-first, no truncated text at 375px.
  - Responsive steps: max-w-7xl containers; at most 2 columns on tablet.
- The eye-icon Aksi column was removed (Revisi 17); ticket numbers are the link to the detail page.

**Next step:** wait for the user's next "LIST REVISI" and implement it. After each batch: test, commit, push to `main`, confirm the GitHub Actions deploy, and report in Indonesian.

## Revision history (short)
- Revisi 10: confirmation modal for public replies, email option, sender labels, watermarked PDF download.
- Revisi 11: musyawarah (meeting) module, user & role management per portal, complaint source, audit logs, dashboards hidden for Bursa/Kliring/Asosiasi.
- Revisi 12: unified ticket lifecycle, Pialang verification, Bappebti review gate, resolution offers, BAKTI arbitration, parameters page with XLSX/PDF export.
- Revisi 13: "Platform" renamed "Pialang", Pihak yang Dilaporkan, KTP at registration, triage when the Pialang is unknown, SLA day labels, revision requests, mediation.
- Revisi 14: 3 standard reject remarks; "Ekosistem Pasif" wording; public portal redesign; member assignment panel; Bursa/Kliring/Asosiasi removed from navigation.
- Revisi 15: public landing page per the government-portal design system; demo bar wraps on mobile.
- Revisi 16: tables contained with horizontal scroll, ticket numbers as links, read-only MEMBER column in the Pialang listing.
- Revisi 17: "Tanpa Pialang User ID" menu hidden (URL redirects to Triase Pengaduan); internal case detail consolidated into one status banner (`CaseStatusExplanation` with `facts`/`notes`/`primary`/`secondary`, fed by `TicketLifecycleControls` render-prop and `useMemberAssignment`); "Siklus Tiket" and member cards no longer rendered; duplicate "Tugaskan / Alihkan Penanggung Jawab" button removed; official logo and contacts; eye-icon column removed.
