# Kappa Web

Frontend for Kappa — an AI content engine for Indian D2C brands. One input, 30 days of on-brand content across Instagram, Twitter, LinkedIn, ads, and email.

## Stack

- Next.js 14 (App Router), TypeScript
- Tailwind CSS v4
- Shadcn UI
- react-hook-form + zod for forms
- lucide-react for icons

## Setup

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

None required for local development (no API calls yet).

## Pages

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/start` | 2-step intake form |
| `/dashboard` | Campaign list (stub, no auth) |
| `/dashboard/jobs/[id]` | Job detail with 30 content pieces (stub) |
| `/admin` | Admin placeholder |
| `/privacy` | Privacy policy (coming soon) |
| `/terms` | Terms of service (coming soon) |
