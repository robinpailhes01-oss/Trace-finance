"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAccount, useTransactions } from "@/lib/store";
import { findCategory, type Transaction } from "@/lib/types";
import { eur } from "@/lib/format";
import { AccountSwitcher } from "@/components/AccountSwitcher";

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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function inRange(t: Transaction, from: Date, to: Date) {
  const dt = new Date(t.date);
  return dt >= from && dt <= to;
}

function totals(filtered: Transaction[]) {
  let i = 0;
  let e = 0;
  filtered.forEach((t) => {
    if (t.type === "income") i += t.amount;
    else e += t.amount;
  });
  return { income: i, expense: e, balance: i - e };
}

export default function StatsPage() {
  const { account, setAccount } = useAccount();
  const { txs } = useTransactions();

  const accountTxs = useMemo(
    () => txs.filter((t) => t.account === account),
    [txs, account],
  );

  const now = useMemo(() => new Date(), []);
  const thisStart = useMemo(() => startOfMonth(now), [now]);
  const thisEnd = useMemo(() => endOfMonth(now), [now]);
  const lastStart = useMemo(
    () => startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    [now],
  );
  const lastEnd = useMemo(() => endOfMonth(lastStart), [lastStart]);

  const thisMonth = useMemo(
    () => accountTxs.filter((t) => inRange(t, thisStart, thisEnd)),
    [accountTxs, thisStart, thisEnd],
  );
  const lastMonth = useMemo(
    () => accountTxs.filter((t) => inRange(t, lastStart, lastEnd)),
    [accountTxs, lastStart, lastEnd],
  );

  const cur = useMemo(() => totals(thisMonth), [thisMonth]);
  const prev = useMemo(() => totals(lastMonth), [lastMonth]);

  // Savings rate = (income - expense) / income * 100
  const savingsRate = cur.income > 0 ? ((cur.income - cur.expense) / cur.income) * 100 : 0;
  const savingsRatePrev =
    prev.income > 0 ? ((prev.income - prev.expense) / prev.income) * 100 : 0;
  const ratePoints = savingsRate - savingsRatePrev;

  // Donut: category breakdown of expenses this month
  const donut = useMemo(() => {
    const map = new Map<string, number>();
    thisMonth
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
  }, [thisMonth, account]);

  // Top expenses: horizontal bars
  const topBars = useMemo(() => {
    const arr = donut.slice(0, 6);
    const max = Math.max(...arr.map((a) => a.value), 1);
    return arr.map((a) => ({ ...a, pct: a.value / max }));
  }, [donut]);

  // Month-over-month income/expense comparison
  const incomeDelta = prev.income > 0 ? ((cur.income - prev.income) / prev.income) * 100 : null;
  const expenseDelta = prev.expense > 0 ? ((cur.expense - prev.expense) / prev.expense) * 100 : null;

  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prevLabel = lastStart.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-6">
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

      {/* Savings rate card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 card-lg p-6"
      >
        <div className="flex items-baseline justify-between">
          <p className="label">Taux d&apos;épargne · {monthLabel}</p>
          <DeltaBadge value={ratePoints} suffix="pt" />
        </div>
        <p
          className="amount mt-3 text-5xl tabular-nums"
          style={{
            color: savingsRate >= 0 ? "#4ECCA3" : "#FF6B6B",
            textShadow:
              savingsRate >= 0
                ? "0 0 24px rgba(78,204,163,0.3)"
                : "0 0 24px rgba(255,107,107,0.25)",
          }}
        >
          {savingsRate.toFixed(1)}%
        </p>
        <p className="text-[12px] text-white/55 mt-1">
          {cur.income > 0
            ? `Tu mets de côté ${eur(Math.max(0, cur.income - cur.expense))} ce mois-ci`
            : "Pas encore de revenus enregistrés ce mois-ci"}
        </p>

        {/* Visual bar */}
        <div className="mt-5 h-2 w-full rounded-full overflow-hidden bg-white/[0.05]">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(0, Math.min(100, savingsRate))}%`,
            }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(78,204,163,0.9), rgba(78,204,163,0.5))",
              boxShadow: "0 0 14px rgba(78,204,163,0.45)",
            }}
          />
        </div>
      </motion.section>

      {/* Income vs Expense — month over month */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 card-lg p-6"
      >
        <p className="label mb-4">vs {prevLabel}</p>
        <div className="grid grid-cols-2 gap-3">
          <CompareCard
            label="Revenus"
            value={cur.income}
            prev={prev.income}
            delta={incomeDelta}
            tone="green"
          />
          <CompareCard
            label="Dépenses"
            value={cur.expense}
            prev={prev.expense}
            delta={expenseDelta}
            tone="red"
            invertDelta
          />
        </div>
      </motion.section>

      {/* Top dépenses — horizontal bars */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 card-lg p-6"
      >
        <p className="label mb-4">Top dépenses · {monthLabel}</p>
        {topBars.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">
            Aucune dépense ce mois-ci
          </p>
        ) : (
          <ul className="space-y-4">
            {topBars.map((b, i) => (
              <li key={b.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#F0EDE8]">
                    <span className="mr-2">{b.emoji}</span>
                    {b.label}
                  </span>
                  <span className="amount text-base tabular-nums">
                    {eur(b.value)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(6, b.pct * 100)}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.06 * i,
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
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* Donut */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 card-lg p-6"
      >
        <p className="label mb-4">Répartition par catégorie</p>
        {donut.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">
            Aucune dépense sur ce mois
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
                        <stop
                          offset="60%"
                          stopColor={DONUT_COLORS[i % DONUT_COLORS.length]}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={DONUT_COLORS[i % DONUT_COLORS.length]}
                          stopOpacity={0.6}
                        />
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
                  <p className="amount text-base tabular-nums mt-1">
                    {eur(cur.expense)}
                  </p>
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
      </motion.section>
    </main>
  );
}

function CompareCard({
  label,
  value,
  prev,
  delta,
  tone,
  invertDelta = false,
}: {
  label: string;
  value: number;
  prev: number;
  delta: number | null;
  tone: "green" | "red";
  invertDelta?: boolean;
}) {
  const accent = tone === "green" ? "#4ECCA3" : "#FF6B6B";
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="label">{label}</p>
      <p
        className="amount mt-2 text-xl tabular-nums"
        style={{
          color: accent,
          textShadow:
            tone === "green"
              ? "0 0 18px rgba(78,204,163,0.3)"
              : "0 0 18px rgba(255,107,107,0.25)",
        }}
      >
        {tone === "green" ? "+" : "−"}
        {eur(value).replace("€", "")}€
      </p>
      <div className="mt-2">
        <DeltaBadge value={delta} suffix="%" invert={invertDelta} />
      </div>
      <p className="text-[10px] text-white/40 mt-1.5 tabular-nums">
        Mois préc. · {eur(prev)}
      </p>
    </div>
  );
}

function DeltaBadge({
  value,
  suffix,
  invert = false,
}: {
  value: number | null;
  suffix: "%" | "pt";
  invert?: boolean;
}) {
  if (value == null) {
    return (
      <span className="text-[11px] text-white/40 inline-flex items-center gap-1">
        <Minus size={12} /> n/a
      </span>
    );
  }
  // Without invert: positive value = green, negative = red
  // With invert (e.g. expenses): positive growth = red
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const color = neutral ? "rgba(255,255,255,0.5)" : positive ? "#4ECCA3" : "#FF6B6B";
  const bg = neutral
    ? "rgba(255,255,255,0.05)"
    : positive
    ? "rgba(78,204,163,0.12)"
    : "rgba(255,107,107,0.12)";
  const Icon = neutral ? Minus : value > 0 ? TrendingUp : TrendingDown;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className="text-[11px] font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      <Icon size={11} strokeWidth={2.4} />
      {sign}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}
