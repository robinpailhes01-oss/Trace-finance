# Trace Finance

Dark-themed personal & business finance tracker built with Next.js 14, TypeScript, and Tailwind CSS. Data is stored locally in your browser (no backend, no account).

## Features

- Switch between Perso / Pro accounts
- One-click Recevoir / Dépenser with a touch keypad
- Categorized transactions with emojis
- Interactive 7/14/30/90 day sparkline
- Monthly savings rate, donut, 6-month bars, KPIs
- CSV / JSON import & export
- Smooth animations (Framer Motion)

## Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. No env vars needed — click **Deploy**.

## Tech

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS, Framer Motion, Recharts, Lucide icons
- Data stored in `localStorage`
