# Credit Card Manager

A personal finance web app to manage credit cards, loans, EMIs, and transactions.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Radix UI + shadcn/ui components
- Supabase Auth + Postgres

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 in your browser.

## Supabase Setup

1. Create a free Supabase project.
2. Open SQL Editor and run the script in `supabase/schema.sql`.
3. In Supabase Auth settings, enable Email/Password sign-in.
4. Copy credentials to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Deployment (Free)

1. Push this repository to GitHub.
2. Import the repo into Vercel (Hobby/free plan).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project environment variables.
4. Deploy.

## Quality Commands

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm run build
```

## Project Structure

- `app/`: App Router pages and layout
- `components/`: Feature and UI components
- `lib/context/DataContext.tsx`: App data store (Supabase-backed)
- `lib/supabase/client.ts`: Browser Supabase client
- `middleware.ts`: Route protection based on Supabase auth session
- `supabase/schema.sql`: Database schema + RLS policies
- `lib/utils/`: Domain calculations, formatting, and validation helpers
- `types/`: Shared TypeScript types

## Notes

- Data is user-scoped in Supabase with Row Level Security.
- CVV is intentionally not collected/stored.
