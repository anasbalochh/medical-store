# MedStore — Pharmacy Management System

A full-stack pharmacy / medical-store POS + inventory system built for the Pakistan market.

**Stack:** React 18 + Vite + TailwindCSS · Express (Vercel serverless) · Prisma · PostgreSQL

## Features (all 7 phases shipped)

- **Auth & Roles** — JWT login, Owner / Pharmacist / Cashier
- **Master data** — Products (with generics, barcode, categories, tax config, schedule G), Suppliers, Customers
- **Purchases** — Multi-line supplier invoices, batch/expiry recorded per line, auto stock-in
- **Inventory** — Batch-level stock, FEFO (First-Expiry-First-Out), low-stock alerts, expiring-soon report, stock adjustments, stock-move ledger
- **POS / Sales** — Fast counter screen, live search, keyboard-first, GST calc, discount, cash / card / credit, print receipt
- **Prescriptions** — Rx notes + image URL linked to a sale
- **Customer ledger (khata)** — Auto-updated running balance, payment recording
- **Reports** — Dashboard KPIs, daily sales chart, top products, profit & margin
- **Settings** — Store info, GST rate, receipt footer, staff management

## Quick start

### 1. Prerequisites
- Node 18+ · A Postgres database (Vercel Postgres, Supabase, Neon, or local)

### 2. Install
```bash
npm install
cd client && npm install && cd ..
```

### 3. Configure
Copy `.env.example` to `.env` and set:
```env
DATABASE_URL="postgresql://user:pass@host:5432/medstore?sslmode=require"
JWT_SECRET="use-a-long-random-string"
```

### 4. Initialize DB
```bash
npx prisma migrate dev --name init
npm run seed
```
This creates the schema and a default owner:
- **Email:** `owner@store.pk`
- **Password:** `admin123`

### 5. Run locally
```bash
npm run dev
```
- Web: http://localhost:5173
- API: http://localhost:3000/api

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), click **New Project** and import the repo.
3. Add these environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Add a Postgres database — either **Vercel Postgres** (Storage tab) or point at Supabase / Neon.
5. Deploy. Vercel auto-detects `vercel.json` and:
   - Builds the React client to `client/dist`
   - Deploys `api/index.ts` as a serverless function
   - Serves the SPA and routes `/api/*` to the function

6. After first deploy, run migrations against production:
```bash
DATABASE_URL="prod-connection-string" npx prisma migrate deploy
DATABASE_URL="prod-connection-string" npm run seed
```

## Project structure

```
medical-store/
├── api/                    # Express app → Vercel serverless
│   ├── index.ts           # Single entry
│   ├── routes/            # auth, products, sales, purchases, ...
│   ├── middleware/
│   └── lib/               # prisma client, jwt
├── prisma/
│   ├── schema.prisma      # Full data model
│   └── seed.ts
├── client/                 # React SPA
│   ├── src/
│   │   ├── pages/         # Dashboard, POS, Products, ...
│   │   ├── components/    # Layout, Modal, PageHeader
│   │   ├── lib/           # api client, format helpers
│   │   └── store/         # zustand auth
│   └── vite.config.ts
├── vercel.json
└── package.json
```

## Pakistan-specific notes

- **PKR** currency by default (change in Settings)
- **17% GST** default rate, per-product taxable flag (most drugs are zero-rated)
- **NTN / CNIC** fields on suppliers & customers for tax-invoice compliance
- **Schedule G** flag on products for controlled drug tracking
- Receipt template shows store NTN and is Urdu-font compatible (add Noto Nastaliq Urdu via `index.html` for Urdu product names)

## Backup

Postgres dumps daily:
```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```
Automate via GitHub Actions or a cron on your Postgres provider.

## Roadmap

- Barcode webcam scanner (`html5-qrcode`)
- Prescription image upload (S3 / Supabase Storage)
- SMS receipt (Jazz/Ufone gateway)
- Multi-branch support
- Offline PWA mode for POS

## License

MIT
