# Trace Finance

Modern dark-themed personal & business finance tracker built with Next.js 14, TypeScript, Tailwind CSS, and Supabase. Add income/expenses in one click. Multi-user — each person signs in with an email magic link and sees only their own data.

## Features

- **Authentication** via Supabase email magic link (no password to remember)
- Switch between **Perso** and **Pro** accounts
- One-click "Recevoir" / "Dépenser" with a touch-friendly numeric keypad
- Categorized transactions with emoji icons
- 14–90-day net evolution chart (interactive tooltip, period chips)
- Top expense categories breakdown + donut + 6-month bars
- Monthly savings rate gauge + month-over-month comparison
- CSV / JSON import & export
- Smooth animations (Framer Motion) and a fintech-style glassy dark UI
- Data stored in Postgres (Supabase) with Row Level Security

## Setup

### 1. Supabase project

1. Create a project on [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run:

```sql
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account text not null check (account in ('perso','pro')),
  type text not null check (type in ('income','expense')),
  amount numeric not null,
  category text not null,
  note text,
  date timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists idx_tx_user_date on transactions(user_id, date desc);

alter table transactions enable row level security;
create policy "read own tx"   on transactions for select using (auth.uid() = user_id);
create policy "insert own tx" on transactions for insert with check (auth.uid() = user_id);
create policy "update own tx" on transactions for update using (auth.uid() = user_id);
create policy "delete own tx" on transactions for delete using (auth.uid() = user_id);

create table if not exists savings_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  amount numeric default 0,
  updated_at timestamptz default now()
);
alter table savings_goals enable row level security;
create policy "goal rw" on savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

3. **Authentication → URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs (Add URL for each):
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`

4. **Authentication → Providers → Email**: make sure it's enabled (default).

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these in Supabase → Project Settings → API.

### 3. Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Add both env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Project Settings → Environment Variables** (for Production, Preview, and Development).
4. **Deploy**.
5. Update the Site URL / Redirect URLs in Supabase to match your Vercel domain.

Share the Vercel URL with anyone — each person signs in with their own email and gets a private, isolated account.

## Tech

- Next.js 14 (App Router) + React 18 + TypeScript
- Supabase (Postgres + Auth + Row Level Security) via `@supabase/supabase-js` & `@supabase/ssr`
- Tailwind CSS, Framer Motion, Recharts, Lucide icons
