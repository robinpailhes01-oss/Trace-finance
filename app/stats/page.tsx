"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import { useAccount, useTransactions } from "@/lib/store";
import { findCategory } from "@/lib/types";
import { eur } from "@/lib/format";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { Sparkline } from "@/components/Sparkline";

type Period = "7" | "14" | "30" | "90";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7", label: "7J" },
  { key: "14", label: "14J" },
  { key: "30", label: "30J" },
  { key: "90", label: "3M" },
];

const DONUT_COLORS = [
  "#4ECCA3",
  "#2DB4A0",
  "#E8C96B",
  "#C9A84C",
  "#F0EDE8",
  "#8A8A95",
  "#FF6B6B",
  "#55555F",
];

export default function StatsPage() {
  const { account, setAccount } = useAccount();
  const { txs } = useTransactions();
  const [period, setPeriod] = useState<Period>("30");

  const filtered = useMemo(() => {
    const days = parseInt(period, 10);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));
    return txs.filter(
      (t) => t.account === account && new Date(t.date) >= since,
    );
  }, [txs, account, period]);

  const { income, expense } = useMemo(() => {
    let i = 0;
    let e = 0;
    filtered.forEach((t) => {
      if (t.type === "income") i += t.amount;
      else e += t.amount;
    });
    return { income: i, expense: e };
  }, [filtered]);

  const donut = useMemo(() => {
    const map = new Map<string, number>();
    filtered
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map.entries())
      .map(([key, value]) => ({
        key,
        value,
        label: findCategory(account, key)?.label ?? key,
        emoji: findCategory(account, key)?.emoji ?? "💸",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, account]);

  const weeklyCompare = useMemo(() => {
    const days = parseInt(period, 10);
    const buckets = Math.min(6, Math.max(2, Math.ceil(days / 7)));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const out: { label: string; Revenus: number; Dépenses: number }[] = [];
    const bucketSize = Math.ceil(days / buckets);
    for (let i = buckets - 1; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * bucketSize);
      const start = new Date(end);
      start.setDate(end.getDate() - (bucketSize - 1));
      const label = `${start.toLocaleDateString("fr-FR", {
        day: "numeric",
      })}–${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
      const entry = { label, Revenus: 0, Dépenses: 0 };
      filtered.forEach((t) => {
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0);
        if (d >= start && d <= end) {
          if (t.type === "income") entry.Revenus += t.amount;
          else entry.Dépenses += t.amount;
        }
      });
      out.push(entry);
    }
    return out;
  }, [filtered, period]);

  const max = Math.max(...weeklyCompare.flatMap((b) => [b.Revenus, b.Dépenses]), 1);

  return (
    <main className="mx-auto max-w-xl px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] press text-white/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#F0EDE8]">Statistiques</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* Period pills */}
      <div className="mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 ${
                active ? "text-[#4ECCA3]" : "text-white/55"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(78,204,163,0.15)" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative font-semibold">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trend */}
      <div className="mt-5 card-lg p-6">
        <div className="flex items-baseline justify-between mb-3">
          <p className="label">Évolution</p>
          <p
            className={`amount text-base tabular-nums ${
              income - expense >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {income - expense >= 0 ? "+" : ""}
            {eur(income - expense)}
          </p>
        </div>
        <Sparkline key={period} txs={filtered} days={parseInt(period, 10)} height={150} />
      </div>

      {/* Income vs Expense — animated bars */}
      <div className="mt-5 card-lg p-6">
        <p className="label mb-4">Revenus vs Dépenses</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="stat-card stat-card-green p-4">
            <p className="label">Revenus</p>
            <p
              className="amount mt-2 text-xl num-green tabular-nums"
              style={{ textShadow: "0 0 20px rgba(78,204,163,0.3)" }}
            >
              +{eur(income).replace("€", "")}€
            </p>
          </div>
          <div className="stat-card stat-card-red p-4">
            <p className="label">Dépenses</p>
            <p
              className="amount mt-2 text-xl num-red tabular-nums"
              style={{ textShadow: "0 0 20px rgba(255,107,107,0.25)" }}
            >
              −{eur(expense).replace("€", "")}€
            </p>
          </div>
        </div>

        <ul className="space-y-4">
          {weeklyCompare.map((b, idx) => (
            <li key={b.label}>
              <div className="flex items-center justify-between text-[11px] text-white/55 mb-1.5">
                <span>{b.label}</span>
                <span className="tabular-nums">
                  <span className="text-[#4ECCA3]">+{eur(b.Revenus).replace("€", "")}€</span>
                  <span className="mx-2 text-white/30">·</span>
                  <span className="text-[#FF6B6B]">−{eur(b.Dépenses).replace("€", "")}€</span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.Revenus / max) * 100}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.06 * idx,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(78,204,163,0.9), rgba(78,204,163,0.4))",
                      boxShadow: "0 0 12px rgba(78,204,163,0.35)",
                    }}
                  />
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.Dépenses / max) * 100}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.06 * idx + 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,107,107,0.9), rgba(255,107,107,0.4))",
                      boxShadow: "0 0 12px rgba(255,107,107,0.3)",
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Donut */}
      <div className="mt-5 card-lg p-6">
        <p className="label mb-4">Répartition des dépenses</p>
        {donut.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">
            Aucune dépense sur la période
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {donut.map((_, i) => (
                      <radialGradient
                        key={i}
                        id={`donut-g-${i}`}
                        cx="50%"
                        cy="50%"
                        r="65%"
                      >
                        <stop offset="60%" stopColor={DONUT_COLORS[i % DONUT_COLORS.length]} stopOpacity={1} />
                        <stop offset="100%" stopColor={DONUT_COLORS[i % DONUT_COLORS.length]} stopOpacity={0.6} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={donut}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                    animationBegin={0}
                    animationDuration={900}
                  >
                    {donut.map((_, i) => (
                      <Cell key={i} fill={`url(#donut-g-${i})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(18,18,26,0.85)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#F0EDE8",
                      padding: "8px 12px",
                      backdropFilter: "blur(16px)",
                    }}
                    formatter={(v: number, _, item: any) => [
                      eur(v),
                      item?.payload?.label ?? "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <p className="label">Total</p>
                  <p className="amount text-base tabular-nums mt-1">{eur(expense)}</p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-sm min-w-0">
              {donut.slice(0, 6).map((d, i) => (
                <li key={d.key} className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate text-[#F0EDE8]">
                    {d.emoji} {d.label}
                  </span>
                  <span className="ml-auto tabular-nums text-white/55 shrink-0 text-xs">
                    {eur(d.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
