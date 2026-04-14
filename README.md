# Trace Finance

Modern dark-themed personal & business finance tracker built with Next.js 14, TypeScript, and Tailwind CSS. Add income/expenses in one click. Data is stored locally in your browser (no backend required).

## Features

- Switch between **Perso** and **Pro** accounts
- One-click "Recevoir" / "Dépenser" with a touch-friendly numeric keypad
- Categorized transactions with emoji icons
- 14-day net evolution chart
- Top expense categories breakdown
- Smooth animations (Framer Motion) and a fintech-style glassy dark UI

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep the defaults (Next.js framework auto-detected) and click **Deploy**.

No environment variables are needed — data is stored in `localStorage`.

## Tech

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide icons
