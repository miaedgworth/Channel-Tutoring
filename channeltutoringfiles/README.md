# Channel Tutoring

A full-stack platform connecting Guernsey students/parents with GCSE and
A-Level tutors — bookings, payments (Stripe Connect), messaging, and an
admin backend for oversight and safeguarding.

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js (Auth.js v5) — email/password, roles `client` / `tutor` / `admin`
- **Payments:** Stripe Connect (Express accounts), flat platform fee per session
- **Email:** Resend (transactional email + newsletter)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in real values (a Postgres connection
string is required at minimum to run locally; Stripe/Resend keys are only
needed to exercise payments/email).

```bash
cp .env.example .env
```

### 3. Set up the database

```bash
npm run db:migrate   # creates tables from prisma/schema.prisma
npm run db:seed       # creates an admin, a sample tutor, and a sample client
```

Seeded accounts (for local testing only — change/remove before going live):

| Role   | Email                          | Password        |
| ------ | ------------------------------- | ---------------- |
| Admin  | admin@channeltutoring.gg        | AdminPass123!    |
| Tutor  | tutor@channeltutoring.gg        | TutorPass123!    |
| Client | client@channeltutoring.gg       | ClientPass123!   |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
prisma/schema.prisma        Database schema (all models)
prisma/seed.ts               Seed script (admin/tutor/client demo accounts)
src/app/                     Routes (App Router)
  (auth)/                    Login, register, password reset
  (marketing)/                Public marketing + legal pages
  dashboard/                  Client dashboard
  tutor-dashboard/             Tutor dashboard
  admin/                       Admin dashboard
  api/                         API routes (auth, bookings, stripe, messages...)
src/components/               Shared React components
src/lib/                      Server-side helpers (auth, prisma, stripe, email...)
```

## Payments & payouts

Channel Tutoring retains a flat platform fee (`PLATFORM_FEE_PENCE`, default
£15) on every completed session via Stripe Connect's
`application_fee_amount`. Tutors onboard a Stripe Express account and
receive the remainder directly; a per-tutor ledger (`TutorLedgerEntry`)
tracks earnings, fees and payouts.

## Deployment

- **App:** Vercel
- **Database:** any managed Postgres (Supabase, Neon, Railway)
- Remember to point the Stripe webhook at `/api/stripe/webhook` and set
  `STRIPE_WEBHOOK_SECRET` in production.
