# SilicaRegister Pro

**Australian silica compliance management for construction PCBUs.**

Cloud-based SaaS for tracking silica-exposed workers, QR-code check-ins, RPE fit-test records, air monitoring uploads, and 1-click audit-pack PDF generation — aligned with SafeWork Australia's Respirable Crystalline Silica Code of Practice (2020).

---

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript       |
| Styling     | Tailwind CSS, shadcn/ui                   |
| Database    | Supabase (PostgreSQL + RLS)               |
| Auth        | Supabase Auth (magic link / OTP)          |
| Storage     | Supabase Storage (PDFs, certificates)     |
| PDF         | @react-pdf/renderer (server-side)         |
| Billing     | Stripe (subscriptions + webhooks)         |
| Deployment  | Vercel                                    |

---

## Project Structure

```
silica-register-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Magic-link sign-in
│   │   └── signup/page.tsx         # Trial sign-up (creates org on callback)
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard + sidebar shell
│   │   ├── page.tsx                # Dashboard home (stats + compliance alerts)
│   │   ├── workers/
│   │   │   ├── page.tsx            # Worker register table
│   │   │   └── new/page.tsx        # Add worker form
│   │   ├── sites/
│   │   │   ├── page.tsx            # Sites grid + QR links
│   │   │   ├── new/page.tsx        # Add site form
│   │   │   └── [id]/page.tsx       # Site detail + QR display + event log
│   │   ├── fit-tests/
│   │   │   ├── page.tsx            # Fit-test register + compliance overview
│   │   │   └── new/page.tsx        # Add fit-test record + certificate upload
│   │   ├── monitoring/page.tsx     # Air monitoring uploads (modal upload)
│   │   └── reports/page.tsx        # Audit Pack generator UI
│   ├── check-in/[siteId]/page.tsx  # Public QR check-in page (no auth)
│   ├── api/
│   │   ├── check-in/route.ts       # POST — log exposure event (service role)
│   │   ├── check-out/route.ts      # POST — close exposure event
│   │   ├── audit-pack/route.ts     # GET  — generate + stream audit pack PDF
│   │   └── webhooks/stripe/route.ts # POST — handle Stripe subscription events
│   └── auth/callback/route.ts      # OAuth / magic-link callback + org setup
├── components/
│   ├── sidebar.tsx                 # Dashboard navigation sidebar
│   ├── check-in/
│   │   └── check-in-form.tsx       # 3-step QR check-in flow (mobile-first)
│   └── sites/
│       └── qr-display.tsx          # QR code canvas + download button
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server + service-role Supabase clients
│   │   └── database.types.ts       # Full TypeScript database types
│   └── pdf/
│       └── audit-pack.tsx          # react-pdf Audit Pack document component
├── middleware.ts                   # Route protection (Supabase SSR)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema, RLS, triggers, indexes
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/your-org/silica-register-pro.git
cd silica-register-pro
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_FOUNDING_BETA=price_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_PRO=price_...

NEXT_PUBLIC_APP_URL=https://your-production-domain.com.au
```

### 3. Run database migrations

In the Supabase dashboard → **SQL Editor**, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

Or using the Supabase CLI:

```bash
supabase db push
```

### 4. Create Supabase Storage buckets

In the Supabase dashboard → **Storage**, create two buckets:

| Bucket name    | Public? | Purpose                              |
|----------------|---------|--------------------------------------|
| `certificates` | Yes     | RPE fit-test certificate PDFs/images |
| `monitoring`   | Yes     | Air monitoring report uploads        |

### 5. Configure Supabase Auth

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.com.au`
- **Redirect URLs**: `https://your-domain.com.au/auth/callback`

Enable **Email (magic link)** provider under Authentication → Providers.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stripe Setup

### Create products and prices

In the Stripe dashboard, create a product **SilicaRegister Pro** with four recurring monthly prices:

| Plan           | Price/month | Price ID env var              |
|----------------|-------------|-------------------------------|
| Founding Beta  | $99         | `STRIPE_PRICE_FOUNDING_BETA`  |
| Starter        | $149        | `STRIPE_PRICE_STARTER`        |
| Growth         | $249        | `STRIPE_PRICE_GROWTH`         |
| Pro            | $449        | `STRIPE_PRICE_PRO`            |

### Configure webhook

1. In Stripe → **Developers → Webhooks**, create an endpoint:
   - URL: `https://your-domain.com.au/api/webhooks/stripe`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`

2. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

### Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Deployment (Vercel)

```bash
vercel --prod
```

Set all environment variables in the Vercel project settings (same as `.env.local`).

### Recommended Vercel settings

- **Framework**: Next.js
- **Node.js version**: 18.x
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Function max duration**: 60s (for audit pack PDF generation — requires Pro plan)

---

## Key Features

### QR Code Check-In (No App Required)

Workers scan a site QR code with any phone camera. The mobile-optimised page lets them select their name, task activity, RPE type, and controls used — no login required. Data is submitted via the `/api/check-in` route using a Supabase service role client.

**URL format**: `https://your-domain.com.au/check-in/{qr_token}`

The `qr_token` is a random 16-byte hex string, not the site UUID — safe to expose publicly.

### Audit Pack PDF Generation

`GET /api/audit-pack?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD[&site_id=uuid]`

Streams a PDF containing:
1. Cover page with organisation details
2. Silica Worker Register with fit-test compliance status
3. Exposure Event Log for the selected period
4. Fit-Test Register with expiry dates and certificate links
5. Air Monitoring Uploads register

Built with `@react-pdf/renderer` running server-side. Generation typically takes 2–5 seconds depending on data volume.

### Multi-Tenant Isolation (Row Level Security)

All tables are protected by Supabase RLS policies using the `my_org_id()` helper function. No data from other organisations is ever returned, even if the Supabase anon key is exposed.

Service-role queries (check-in API, audit pack) bypass RLS — these routes perform their own organisation verification before writing.

---

## Database Schema Overview

```
organisations  ──┬── profiles (users)
                 ├── sites ──── worker_sites ──── workers
                 ├── exposure_events
                 ├── fit_tests
                 ├── monitoring_uploads
                 └── audit_log

Views:
  worker_fit_test_status   — compliance status per worker (current/expiring/overdue/no_record)
  worker_exposure_summary  — total events + hours per worker
```

---

## Plan Limits

| Plan          | Workers | Sites | Price/month |
|---------------|---------|-------|-------------|
| Founding Beta | 50      | 5     | $99 AUD     |
| Starter       | 25      | 3     | $149 AUD    |
| Growth        | 100     | 10    | $249 AUD    |
| Pro           | 500     | 50    | $449 AUD    |

---

## Compliance Reference

SilicaRegister Pro is designed to help PCBUs meet obligations under:

- **Work Health and Safety Regulations 2011** (Cth) — Reg 50 (health monitoring), Reg 44–48 (airborne contaminants)
- **Managing the Risks of Respirable Crystalline Silica from Engineered Stone in the Workplace** — Safe Work Australia Code of Practice (2020)
- **AS/NZS 1715:2009** — Selection, use and maintenance of respiratory protective equipment
- **Crystalline Silica WES** — 0.05 mg/m³ as TWA (Safe Work Australia, effective 1 July 2020)

> SilicaRegister Pro is a compliance aid tool. It does not constitute legal advice. PCBUs remain responsible for ensuring their compliance obligations are met.

---

## Contributing

PRs welcome. Please open an issue first for significant changes.

## License

Proprietary — © 2026 SilicaRegister Pro. All rights reserved.
