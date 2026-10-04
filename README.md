<div align="center">

# Magic Portfolio

**A minimal, bilingual (EN/FA) developer portfolio with a Markdown blog, a full admin dashboard and one-click Vercel deployment — built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, MongoDB and next-intl.**

![Magic Portfolio Next — hero section](docs/images/banner.png)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-black)](https://ui.shadcn.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[English](README.md) · [فارسی](README.fa.md) · [Quick start](#quick-start-5-minutes) · [Deploy on Vercel](#deploy-on-vercel)

</div>

---

A portfolio that reads like a printed page: one monochrome palette, one heading rhythm, one card measure — in English and Persian, from the same codebase. Everything you see is data you edit in the dashboard; nothing is hardcoded.

## Table of contents

- [What is in the box](#what-is-in-the-box)
- [Preview](#preview)
- [Quick start (5 minutes)](#quick-start-5-minutes)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Demo content](#demo-content)
- [Buy me a coffee and payments](#buy-me-a-coffee-and-payments)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Design system](#design-system)
- [SEO and structured data](#seo-and-structured-data)
- [Customization](#customization)
- [Deploy on Vercel](#deploy-on-vercel)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## What is in the box

| Area | What you get |
| --- | --- |
| **Public site** | Hero, about, work experience, education, skills, projects, contact — plus a project archive with search and technology filters, project detail pages, a product catalogue with prices, search, category filters and product pages, a blog with tags, drafts and an RSS feed, and a buy-me-a-coffee page with five payment rails and a supporters wall. Which projects the home page shows is a dashboard setting. |
| **Admin dashboard** | Every content type at `/{locale}/dashboard`: profile, work experience, education, skills, projects, products, socials, a Markdown blog editor, the support options and the list of supporters with their confirmations. Validation, loading, error and empty states everywhere; image upload with in-browser cropping. |
| **Two languages** | English (default, `/`) and Persian (`/fa`) with real RTL: mirrored icons and arrows, Persian digits, Jalali (Solar Hijri) dates, and typography tuned for the Persian script. |
| **Strictly monochrome UI** | Black-and-white shadcn/ui tokens, light and dark themes, and CSS-only reveal animations that respect `prefers-reduced-motion`. |
| **Secure by default** | All admin APIs require a session; credentials live in server-only env vars with no demo or fallback accounts; every request body is validated with Zod on the server. |
| **SEO out of the box** | Per-page metadata, canonical + hreflang alternates, Open Graph / Twitter cards with a generated OG image, JSON-LD (`Person`, `CollectionPage`, `SoftwareApplication`, `Product` + `Offer`, `Blog`, `BlogPosting`, `BreadcrumbList`), localized sitemap, robots, RSS and a web manifest. |
| **Typed end to end** | Strict TypeScript, shared domain types, Mongoose models, ESLint (core-web-vitals) and one quality gate: `npm run verify`. |

## Quick start (5 minutes)

Prerequisites: **Node.js >= 20** and a MongoDB instance (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
# 1. Clone and install
git clone https://github.com/emiroow/magic-portfolio.git
cd magic-portfolio
npm install            # pnpm install works too

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local: set MONGODB_URI, NEXTAUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD

# 3. Load demo content (optional but recommended)
npm run seed                 # default persona: frontend
npm run seed -- --persona=backend --force   # pick another identity, resetting the DB

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the site serves `/en` and `/fa` from there.
The dashboard is at `/en/dashboard`. Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env.local` — sign-in is refused entirely if those variables are missing.

## Scripts

| Script               | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | Start the development server                         |
| `npm run build`      | Production build                                     |
| `npm run start`      | Serve the production build                           |
| `npm run seed`       | Insert demo content (skips if DB is not empty)       |
| `npm run seed:force` | Drop the database, then seed demo content            |
| `npm run seed:list`  | List the demo personas and their content counts      |
| `npm run lint`       | ESLint                                               |
| `npm run typecheck`  | `tsc --noEmit`                                       |
| `npm run format`     | Prettier over `src/**`                               |
| `npm run verify`     | Lint + typecheck + build — the CI/quality gate       |

## Environment variables

| Variable                         | Required | Description                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------------ |
| `MONGODB_URI`                    | Yes      | MongoDB connection string                                          |
| `NEXT_PUBLIC_SITE_URL`           | Yes      | Canonical site origin (e.g. `https://portfolio.example.com`)       |
| `NEXTAUTH_SECRET`                | Yes      | Session encryption key — `openssl rand -base64 32`                 |
| `NEXTAUTH_URL`                   | Prod     | Same origin as the app (NextAuth compatibility)                    |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes      | Dashboard credentials — required; no demo/fallback accounts        |
| `BLOB_READ_WRITE_TOKEN`          | Prod     | Vercel Blob token — required for image uploads in production       |
| `NEXT_PUBLIC_TWITTER_HANDLE`     | No       | `@handle` for Twitter cards                                        |
| `NEXT_PUBLIC_GA_ID`              | No       | Optional Google Analytics 4 ID                                     |
| `SEED_PERSONA`                   | No       | Demo identity to seed: `frontend`, `backend`, `fullstack`, `designer` |
| `SEED_IMAGES`                    | No       | `false` skips the placeholder cover/avatar URLs at seed time       |
| `ZARINPAL_MERCHANT_ID`           | No       | ZarinPal merchant id — enables the `gateway` mode for Iranian cards |
| `IDPAY_API_TOKEN` / `IDPAY_RESELLER_ID` | No | IDPay REST credentials — same, through IDPay                      |
| `STRIPE_SECRET_KEY`              | No       | Stripe secret key — card checkout in `usd`/`eur`                   |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | No   | PayPal REST app credentials — `usd`/`eur`                          |

## Demo content

`npm run seed` fills the site with **one persona** — a fictional professional whose profile, career history, projects, toolkit, contact links and writing all tell the same story. Switching persona rewrites every section consistently, so a fresh install can look like a front-end engineer, a back-end engineer, a full stack developer or a product designer.

| Persona     | Who                                                          |
| ----------- | ------------------------------------------------------------ |
| `frontend`  | Sara Mirzaei — front-end engineer, design systems, RTL work  |
| `backend`   | Kian Rahmani — back-end engineer, payments and event pipelines |
| `fullstack` | Alex Carter — full stack developer on small product teams     |
| `designer`  | Mina Rahimi — product designer, interfaces, systems and motion |

```bash
npm run seed:list                              # what is available
npm run seed -- --persona=designer --force     # reset the database and seed that identity
SEED_IMAGES=false npm run seed                 # no remote placeholder images, just the site's monograms
```

Notes on what gets written:

- **Both locales at once.** Every entry is authored in English and Persian with parallel documents, including Jalali dates on the `/fa` site.
- **Projects are case studies.** Each one carries a long-form Markdown body, a `featured` flag (three per persona lead the home row) and an explicit `createdAt`, so archives and the home section land in a sensible order.
- **The blog has a draft.** One post per persona ships unpublished, which is how the dashboard's draft state gets demonstrated.
- **A notice post comes first.** "About this demo content" is seeded as the newest post, so nobody mistakes invented metrics for real work.
- **Everything invented.** Company names, links, numbers and images are placeholders — fictional identities on `*.example.com` domains, with covers and portraits pulled from the picsum demo service. Replace the content from `/dashboard`; nothing here is meant to be quoted.
- **Add your own identity.** Drop a new module in `src/seed/personas/` exporting a `Persona` and register it in `src/seed/personas/index.ts` — every seed module reads from whatever persona it resolves.

> The site title and meta description are **not** environment variables — they are built from the profile document you edit in the dashboard, as `Name | Job Title | Portfolio` (in Persian: `نام | عنوان شغلی | سایت شخصی`).

## Buy me a coffee and payments

`/{locale}/support` is a standalone page, reachable from the hero button, the dock menu, the home section after the blog and the sitemap. The owner creates **support options** in the dashboard; each option is exactly one *rail*, which is what keeps the checkout dialog honest — it never shows a field that cannot take money.

| Rail | What happens | Needs |
| --- | --- | --- |
| `referral` | Hand-off to a creator-support platform: Buy Me a Coffee, Ko-fi, Patreon, GitHub Sponsors, Liberapay or Hamyato. The gift is completed and charged there. | Just the URL |
| `link` | A checkout page built in advance inside a gateway — a ZarinPal/IDPay payment link, a Stripe link or PayPal.me. | Just the URL |
| `card` | Card-to-card: card number, holder and IBAN with a server-generated QR, plus the supporter's own transfer reference. Confirmed by hand in the dashboard. | A card number or an IBAN |
| `crypto` | TRON (TRC-20), Ethereum (ERC-20), Bitcoin, TON, BNB Chain or Lightning: address plus QR, with a network warning before sending. | An address |
| `gateway` | A full in-site checkout: the site calls ZarinPal v4, IDPay REST, Stripe Checkout or PayPal Orders v2 itself, redirects the supporter, then **verifies** the payment server-to-server on the way back. | Gateway credentials in the environment |

Behaviour worth knowing:

- **Nothing is trusted from the browser.** The dialog sends a candidate amount; the server re-reads the option and refuses anything outside its own `minAmount`/`maxAmount`, and the currency is always the option's. An amount entered by hand cannot become a different charge.
- **Verification, not arrival.** A gateway redirect proves nothing; a gift is only marked `completed` after the verify/capture call succeeds. The callback is idempotent — a refreshed or replayed return trip cannot double-count a gift.
- **The supporters wall.** Each checkout records the supporter's name (or anonymous), message and their choice about being shown. Only `completed` records with the wall flag on appear publicly, and an anonymous name is dropped in the data layer so it never reaches the browser. Card-to-card and crypto gifts stay `pending` until the owner confirms them from the dashboard, where the reference is shown next to the amount.
- **QR codes are generated on the server** (`qrcode`, as a PNG data URL), so no third-party QR host is contacted and no supporter data leaves the site.
- **Unconfigured is invisible.** A `gateway` option whose keys are missing reports the reason at checkout and is flagged in the dashboard list; options with no destination at all are refused by validation before they can be saved.
- **Abuse guard.** The public endpoints are rate-limited per address, carry a honeypot field and cap message length; the amount, currency and destination always come from the stored option.
- **Iranian and international rails sit side by side.** The Persian site lists the Iranian rails first, the English site the international ones (`REGION_ORDER`), and both markets can be offered at once.

Demo options for every rail are seeded by `npm run seed`, with obvious placeholder destinations (`your-name`, an all-zero IBAN, `TExampleWalletAddress…`) that must be replaced in the dashboard before going live.

## Project structure

```
src/
├── app/
│   ├── [locale]/            # Localized routes (en default, fa with RTL)
│   │   ├── (client)/        # Home page (hero, about, experience, projects…)
│   │   ├── auth/            # Admin sign-in
│   │   ├── blog/            # Blog list, post pages and the RSS route
│   │   ├── projects/        # Project archive and /projects/[slug] pages
│   │   ├── products/        # Product catalogue and /products/[slug] pages
│   │   ├── support/         # Buy-me-a-coffee page (five rails + supporters wall)
│   │   └── dashboard/       # Admin dashboard (session protected)
│   ├── api/
│   │   ├── [lang]/          # Public JSON API (portfolio data, blog)
│   │   ├── [lang]/support/  # Public checkout, confirmation and gateway callback
│   │   ├── [lang]/admin/    # Guarded CRUD APIs (Zod validated) + uploads
│   │   ├── auth/            # NextAuth
│   │   └── og/              # Generated Open Graph image
│   └── layout.tsx           # Fonts, global metadata, analytics
├── components/
│   ├── dashboard/           # Admin sections (one file per resource)
│   ├── sections/            # Public home-page sections
│   ├── blog/ & projects/    # Listing views
│   ├── products/            # Catalogue grid, product card, price tag
│   ├── magicui/             # Blur-fade reveal
│   ├── support/             # Support cards, checkout dialog, wall, QR helpers
│   └── ui/                  # shadcn/ui primitives + shared listing parts
├── config/                  # NextAuth options + cached DB connection
├── constants/               # Route table used by the dock and the footer
├── hooks/                   # react-hook-form + react-query hooks
├── lib/                     # Data layer, Zod schemas, API helpers, payments, QR, rate-limit, utils
├── models/                  # Mongoose schemas
├── seed/                    # Demo content seeds (npm run seed)
│   └── personas/            # One fictional identity per persona, both locales
├── types/                   # Shared domain types
└── i18n/                    # next-intl routing & request config
```

## Architecture notes

- **Server reads, client writes.** Pages query Mongoose directly through `src/lib/data.ts` — no HTTP self-fetching. The public JSON API under `/api/{lang}` stays available for other clients, and the dashboard talks to `/api/{lang}/admin/*`.
- **One CRUD factory.** `src/lib/crud.ts` builds every admin endpoint: session guard, Zod validation, slug handling, `revalidatePath` after a write, and a uniform error shape.
- **Localized content, not translated content.** Every document carries a `lang` field, so English and Persian hold independent records — different wording, different dates, different project sets.
- **Uploads.** Development writes to `public/{type}/{lang}`; production uses Vercel Blob. Images are cropped in the browser before upload, and a cache-busting query keeps the preview fresh without polluting the stored URL.
- **Editing flow.** Each dashboard section owns one slide-in panel: opening it scrolls the section back into view (the panel always sits above the list), a save that lands closes it, `Escape` dismisses it, and a rejected save leaves it open so nothing typed is lost.
- **Home page selection.** `active` publishes a project to the site; `featured` curates the home section, which has three slots. Curated picks lead the row and any leftover slot is filled by the newest published project, so the section never renders half empty — and with nothing curated at all, the three newest published projects show. Manage it from the project row's pin button (it saves instantly and numbers the picks `صفحه اصلی · ۱`), or from the edit panel; either way the counter says how many slots are left, and a control that cannot be used says why — an unpublished project must be published first, and a fourth pick is refused while three are already pinned.
- **Data model.** `profile`, `work`, `education`, `skill`, `social`, `project`, `product`, `blog`, `donation` and `supporter` in `src/models`, mirrored by types in `src/types`. Projects support a slug, a long-form Markdown body, technology tags, home-page selection and a list of labelled resource links; products carry a price, a currency, a category, feature bullets and an availability flag; blog posts support tags, covers and a published/draft flag; donation options carry one payment mode with only that mode's credentials, and supporters record the gift, its state and what may be shown publicly.
- **Payments stay server-side.** `src/lib/payments.ts` holds the gateway adapters (ZarinPal v4, IDPay REST, Stripe Checkout, PayPal Orders v2) as plain `fetch` calls behind a timeout, and every amount is derived from the stored option. `src/lib/qr.ts` renders QR codes as PNG data URLs and `src/lib/rate-limit.ts` keeps the public write endpoints from being hammered.
- **Prices stay readable in both languages.** A product price is stored as a number plus a currency code, formatted with `Intl.NumberFormat` — Persian digits and separators on `/fa`, Latin on `/en` — and rendered inside a `<bdi dir="ltr">` run so grouping can never reverse inside an RTL sentence. `0` is shown as the localized “Free”, and the catalogue only offers a price ordering while every product sits on one scale (a single currency, or the rial/toman pair).

## Design system

- **Monochrome tokens.** All colour lives in the CSS variables in `src/app/globals.css`. Emphasis never comes from hue — only from border weight, surface contrast and inverted hover states.
- **One header language.** `SectionHeader` renders the ordinal + eyebrow + count line, the title, an optional description and a hairline that fades out in the reading direction. Home sections and standalone pages share it.
- **Shared listing parts.** `ListingToolbar` (search + facet chips), `FilterChip`, `EmptyPanel` and `Stack` keep the project archive, the product catalogue, the blog and the dashboard lists visually identical.
- **RTL is a first-class citizen.** Physical insets are avoided (`ps-*`/`pe-*`, `ms-*`/`me-*`, `text-start`, `start-*`/`end-*`), directional glyphs are mirrored with `rtl:-scale-x-100`, letter-spacing is neutralised in RTL because it breaks Persian joining, and Latin fragments inside Persian text are wrapped in `<bdi>` so bidirectional ordering stays correct. Dialogs and popovers mount outside the locale wrapper, so they inherit `<html dir>` and mirror through logical properties alone — no per-direction class lists. The Markdown editor runs in the library's own `direction="rtl"` mode, and its Latin-only font stack is overridden so the Persian typing surface keeps the site face.
- **Motion without a runtime.** Reveals are CSS animations (`reveal` / `reveal-view`) rendered server-side, so public pages ship no animation JavaScript and `prefers-reduced-motion` disables them entirely.

## SEO and structured data

| Surface | Detail |
| --- | --- |
| Metadata | Per-page title/description, canonical URL, `hreflang` alternates for both locales, Open Graph and Twitter cards. |
| OG images | `/api/og` renders a branded 1200×630 image per page and per language. |
| JSON-LD | `Person` and `BreadcrumbList` on the home page, `CollectionPage` on archives, `SoftwareApplication` on project pages, `Product` + `Offer` (price, ISO 4217 currency, stock availability) on product pages, `Blog` + `BlogPosting` on articles, and a `WebPage` with a `DonateAction` and one `Offer` per support option on `/support`. |
| Discovery | Localized `sitemap.ts`, `robots.ts`, RSS at `/blog/rss.xml`, and a web manifest for installability. |
| ISR | Public pages revalidate hourly; an admin write calls `revalidatePath`, so edits appear immediately. |

## Customization

- **Colors** — edit the CSS variables in `src/app/globals.css` (single source of truth for the monochrome theme).
- **Content** — everything is data-driven from MongoDB via the dashboard; re-run `npm run seed:force` to reset demo content, or pick another identity with `--persona=<id>` (see [Demo content](#demo-content)).
- **Navigation** — the floating dock, its tooltips and the dashboard footer all read from `NavbarRoutes` in `src/constants/global.ts`; one entry change updates all three.
- **Add a section** — create a model and types in `src/models` and `src/types`, expose it with `createAdminCrud` under `src/app/api/[lang]/admin/...`, add a data reader in `src/lib/data.ts`, then a section component under `src/components/sections`.
- **Languages** — translations live in `messages/en.json` and `messages/fa.json`; locales are configured in `src/i18n/routing.ts`.

## Deploy on Vercel

1. Push this repository to GitHub.
2. On [Vercel](https://vercel.com/new), import the repo.
3. Add the environment variables (see the table above). Use a MongoDB **Atlas** connection string.
4. To enable image uploads, create a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store — `BLOB_READ_WRITE_TOKEN` is injected automatically.
5. Deploy, then set `NEXT_PUBLIC_SITE_URL` to your final domain and redeploy once so metadata picks it up.

In production, uploads go to Vercel Blob; in development they are saved under `public/` — no extra setup for local work.

## Troubleshooting

| Symptom                                   | Fix                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| Home shows “No content yet”               | `MONGODB_URI` missing/incorrect — check `.env.local`, then `npm run seed` |
| Images fail in production                 | Set `BLOB_READ_WRITE_TOKEN` (Vercel Blob)                                 |
| Login redirects endlessly                 | `NEXTAUTH_URL` must match the deployed origin exactly                     |
| Sign-in always fails                      | `ADMIN_EMAIL` / `ADMIN_PASSWORD` must be set; there are no fallback accounts |
| Persian dates look Gregorian              | Node >= 20 with full ICU (the official builds include it)                 |
| `npm run seed` says file `.env.local` not found | Create `.env.local` first (it is required by the seed script)        |
| An `on-site payment` option fails at checkout | That gateway's keys are missing from `.env.local` — see the table above |
| A card or crypto option is missing from the page | Its card number / IBAN / address is empty in the dashboard; validation refuses to publish it |

## Contributing

Issues and pull requests are welcome. Please run `npm run verify` before submitting — it is the exact CI gate (lint + typecheck + build). Keep the visual language consistent: monochrome tokens, shared section headers, and RTL-safe spacing.

## License

[MIT](LICENSE) — free to use for your personal portfolio, commercially and in derivative templates.
