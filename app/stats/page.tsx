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
  "#d4c5a0",
  "#4ade80",
  "#f87171",
  "#93c5fd",
  "#c4b5fd",
  "#fbbf24",
  "#fb7185",
  "#34d399",
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
    // group by week (or by ~equal buckets), up to ~6 buckets
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
    <main className="mx-auto max-w-xl px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold">Statistiques</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* Period selector */}
      <div className="mt-5 inline-flex glass rounded-full p-1 text-sm">
        {PERIODS.map((p) => {
          const active = period === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`relative px-3.5 py-1.5 rounded-full transition-colors ${
                active ? "text-black" : "text-white/60"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="mt-5 rounded-3xl glass p-5">
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-sm font-medium">Évolution du solde</p>
          <p className="text-xs text-white/40">
            Cumul net · {income - expense >= 0 ? "+" : ""}
            {eur(income - expense)}
          </p>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gstats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "#ffffff20" }}
                contentStyle={{
                  background: "#131316",
                  border: "1px solid #ffffff15",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#ffffff80" }}
                formatter={(v: number) => [eur(v), "Cumul"]}
              />
              <Area
                type="monotone"
                dataKey="running"
                stroke="#4ade80"
                strokeWidth={2}
                fill="url(#gstats)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income vs Expense bars */}
      <div className="mt-5 rounded-3xl glass p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-medium">Revenus vs Dépenses</p>
          <p className="text-xs text-white/40">Sur la période</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-accent-green/10 border border-accent-green/20 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/50">
              Revenus
            </p>
            <p className="mt-1 text-lg font-semibold text-accent-green tabular-nums">
              +{eur(income).replace("€", "")}€
            </p>
          </div>
          <div className="rounded-2xl bg-accent-red/10 border border-accent-red/20 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/50">
              Dépenses
            </p>
            <p className="mt-1 text-lg font-semibold text-accent-red tabular-nums">
              −{eur(expense).replace("€", "")}€
            </p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCompare} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#ffffff60", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#ffffff40", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "#ffffff08" }}
                contentStyle={{
                  background: "#131316",
                  border: "1px solid #ffffff15",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, name) => [eur(v), name as string]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#ffffff80" }}
                iconType="circle"
              />
              <Bar dataKey="Revenus" fill="#4ade80" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#f87171" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut */}
      <div className="mt-5 rounded-3xl glass p-5">
        <p className="text-sm font-medium mb-3">Répartition des dépenses</p>
        {donut.length === 0 ? (
          <p className="text-sm text-white/40 py-6 text-center">
            Aucune dépense sur la période
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-48 w-48 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {donut.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#131316",
                      border: "1px solid #ffffff15",
                      borderRadius: 12,
                      fontSize: 12,
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
                  <p className="text-[10px] uppercase tracking-wider text-white/40">
                    Total
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {eur(expense)}
                  </p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm min-w-0">
              {donut.slice(0, 6).map((d, i) => (
                <li key={d.key} className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate text-white/80">
                    {d.emoji} {d.label}
                  </span>
                  <span className="ml-auto tabular-nums text-white/60 shrink-0">
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
