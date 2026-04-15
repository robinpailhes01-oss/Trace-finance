"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAccount, useTransactions } from "@/lib/store";
import { findCategory } from "@/lib/types";
import { eur } from "@/lib/format";
import { AccountSwitcher } from "@/components/AccountSwitcher";

type Period = "7" | "14" | "30" | "90";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7", label: "7j" },
  { key: "14", label: "14j" },
  { key: "30", label: "30j" },
  { key: "90", label: "3 mois" },
];

const DONUT_COLORS = [
  "#F0EDE8",
  "#4ECCA3",
  "#FF6B6B",
  "#C9A84C",
  "#8A8A95",
  "#3A3A4A",
  "#E8C96B",
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

  const trend = useMemo(() => {
    const days = parseInt(period, 10);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const out: { date: string; label: string; running: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        running: 0,
      });
    }
    const idx = new Map(out.map((b, i) => [b.date, i]));
    const net = new Array(out.length).fill(0);
    filtered.forEach((t) => {
      const k = t.date.slice(0, 10);
      const i = idx.get(k);
      if (i == null) return;
      net[i] += t.type === "income" ? t.amount : -t.amount;
    });
    let acc = 0;
    out.forEach((b, i) => {
      acc += net[i];
      b.running = acc;
    });
    return out;
  }, [filtered, period]);

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

  return (
    <main className="mx-auto max-w-xl px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full hairline-strong hover:bg-white/[0.03] press text-muted"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-cream">Statistiques</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      <div className="mt-7 inline-flex rounded-full hairline-strong p-0.5 text-xs">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 ${
                active ? "text-bg" : "text-muted"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 rounded-full bg-cream"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative font-medium">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 card-lg p-6"
      >
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Évolution
          </p>
          <p className="amount text-base tabular-nums">
            {income - expense >= 0 ? "+" : ""}
            {eur(income - expense)}
          </p>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gstats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ECCA3" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#4ECCA3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "#2A2A3A", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "#12121A",
                  border: "1px solid #1E1E28",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#F0EDE8",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#8A8A95" }}
                formatter={(v: number) => [eur(v), "Cumul"]}
              />
              <Area
                type="monotone"
                dataKey="running"
                stroke="#4ECCA3"
                strokeWidth={1.5}
                fill="url(#gstats)"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#4ECCA3",
                  strokeWidth: 1.5,
                  fill: "#0A0A0F",
                }}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Income vs Expense bars */}
      <div className="mt-5 card-lg p-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Revenus vs Dépenses
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              Revenus
            </p>
            <p className="amount mt-2 text-xl text-positive tabular-nums">
              +{eur(income).replace("€", "")}€
            </p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
              Dépenses
            </p>
            <p className="amount mt-2 text-xl text-negative tabular-nums">
              −{eur(expense).replace("€", "")}€
            </p>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCompare} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E28" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8A8A95", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#55555F", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#ffffff05" }}
                contentStyle={{
                  background: "#12121A",
                  border: "1px solid #1E1E28",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "#F0EDE8",
                  padding: "8px 12px",
                }}
                formatter={(v: number, name) => [eur(v), name as string]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#8A8A95" }} iconType="circle" />
              <Bar dataKey="Revenus" fill="#4ECCA3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut */}
      <div className="mt-5 card-lg p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-muted mb-4">
          Répartition
        </p>
        {donut.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">
            Aucune dépense sur la période
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donut.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#12121A",
                      border: "1px solid #1E1E28",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#F0EDE8",
                      padding: "8px 12px",
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
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                    Total
                  </p>
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
                  <span className="truncate text-cream">
                    {d.emoji} {d.label}
                  </span>
                  <span className="ml-auto tabular-nums text-muted shrink-0 text-xs">
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
