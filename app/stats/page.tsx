"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Pencil, Target } from "lucide-react";
import { useAccount, useTransactions } from "@/lib/store";
import { findCategory, type Transaction } from "@/lib/types";
import { eur } from "@/lib/format";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { DonutSvg } from "@/components/DonutSvg";
import { useSavingsGoal } from "@/lib/savingsGoal";

const PALETTE = [
  "#7B9B75",
  "#5F7D5A",
  "#E8C96B",
  "#C9A84C",
  "#3D2F1F",
  "#8A8A95",
  "#C47A6B",
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
function totals(list: Transaction[]) {
  let i = 0;
  let e = 0;
  list.forEach((t) => {
    if (t.type === "income") i += t.amount;
    else e += t.amount;
  });
  return { income: i, expense: e, balance: i - e };
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { month: "short" });
}

export default function StatsPage() {
  const { account, setAccount } = useAccount();
  const { txs, hydrated } = useTransactions();
  const { goal, setGoal, hydrated: goalHydrated } = useSavingsGoal();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

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

  // Savings rate
  const savings = cur.income - cur.expense;
  const savingsRate = cur.income > 0 ? (savings / cur.income) * 100 : 0;
  const savingsRatePrev =
    prev.income > 0 ? ((prev.income - prev.expense) / prev.income) * 100 : 0;
  const ratePoints = savingsRate - savingsRatePrev;

  const incomeDelta =
    prev.income > 0 ? ((cur.income - prev.income) / prev.income) * 100 : null;
  const expenseDelta =
    prev.expense > 0 ? ((cur.expense - prev.expense) / prev.expense) * 100 : null;

  // Donut data
  const catTotals = useMemo(() => {
    const m = new Map<string, number>();
    thisMonth
      .filter((t) => t.type === "expense")
      .forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return Array.from(m.entries())
      .map(([key, value]) => ({
        key,
        value,
        label: findCategory(account, key)?.label ?? key,
        emoji: findCategory(account, key)?.emoji ?? "💸",
      }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonth, account]);

  const donutData = useMemo(
    () =>
      catTotals.map((c, i) => ({
        key: c.key,
        value: c.value,
        color: PALETTE[i % PALETTE.length],
        label: c.label,
      })),
    [catTotals],
  );

  // 6-month evolution
  const months = useMemo(() => {
    const out: {
      label: string;
      date: Date;
      income: number;
      expense: number;
      isCurrent: boolean;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const s = startOfMonth(d);
      const e = endOfMonth(d);
      const t = totals(accountTxs.filter((x) => inRange(x, s, e)));
      out.push({
        label: monthLabel(d),
        date: d,
        income: t.income,
        expense: t.expense,
        isCurrent: i === 0,
      });
    }
    return out;
  }, [accountTxs, now]);

  const maxMonthValue = Math.max(
    ...months.flatMap((m) => [m.income, m.expense]),
    1,
  );

  // KPIs
  const dayOfMonth = Math.max(1, now.getDate());
  const daysInMonth = endOfMonth(now).getDate();
  const avgPerDay = cur.expense / dayOfMonth;
  const projection = avgPerDay * daysInMonth;
  const biggest = useMemo(() => {
    return thisMonth
      .filter((t) => t.type === "expense")
      .reduce<Transaction | null>(
        (acc, t) => (acc == null || t.amount > acc.amount ? t : acc),
        null,
      );
  }, [thisMonth]);
  const txCount = thisMonth.length;

  // Savings goal progress
  const goalPct = goal > 0 ? Math.max(0, Math.min(100, (Math.max(0, savings) / goal) * 100)) : 0;

  const currentMonthName = now.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const prevMonthName = lastStart.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-xl px-5 pt-6 pb-32">
        <p className="text-[#3D2F1F]/45 text-sm text-center mt-20">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full border border-[#3D2F1F]/10 bg-white/60 hover:bg-white/70 press text-[#3D2F1F]/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#3D2F1F]">Statistiques</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* Résumé du mois en cours */}
      <section className="mt-6 card-lg p-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="label">Résumé · {currentMonthName}</p>
        </div>

        <div className="flex items-center gap-5">
          {/* Circular gauge */}
          <CircularGauge value={Math.max(0, Math.min(100, savingsRate))} />

          <div className="min-w-0 flex-1">
            <p className="label">Taux d&apos;épargne</p>
            <p
              className="amount text-4xl tabular-nums mt-1"
              style={{
                color: savingsRate >= 0 ? "#7B9B75" : "#C47A6B",
                textShadow:
                  savingsRate >= 0
                    ? "0 0 24px rgba(123,155,117,0.3)"
                    : "0 0 24px rgba(196,122,107,0.25)",
              }}
            >
              {savingsRate.toFixed(1)}%
            </p>
            <div className="mt-1">
              <DeltaBadge value={ratePoints} suffix="pt" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryCell
            label="Revenus"
            value={cur.income}
            color="#7B9B75"
          />
          <SummaryCell
            label="Dépenses"
            value={cur.expense}
            color="#C47A6B"
          />
          <SummaryCell
            label="Épargne"
            value={Math.max(0, savings)}
            color="#3D2F1F"
            amountSign="+"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <CompareChip label="Revenus vs M-1" delta={incomeDelta} />
          <CompareChip
            label="Dépenses vs M-1"
            delta={expenseDelta}
            invert
          />
        </div>
      </section>

      {/* Répartition des dépenses — Donut SVG natif */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-4">Répartition · {currentMonthName}</p>
        {donutData.length === 0 ? (
          <p className="text-sm text-[#3D2F1F]/45 py-8 text-center">
            Aucune dépense ce mois-ci
          </p>
        ) : (
          <div className="flex items-center gap-5">
            <DonutSvg
              data={donutData}
              size={160}
              thickness={22}
              centerLabel="Total"
              centerValue={eur(cur.expense)}
            />
            <ul className="flex-1 space-y-2 text-sm min-w-0">
              {catTotals.slice(0, 6).map((c, i) => {
                const pct = cur.expense > 0 ? (c.value / cur.expense) * 100 : 0;
                const top = i < 3;
                return (
                  <li key={c.key} className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: PALETTE[i % PALETTE.length] }}
                    />
                    <span
                      className={`truncate ${
                        top ? "text-[#3D2F1F] font-medium" : "text-[#3D2F1F]/70"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </span>
                    <span className="ml-auto shrink-0 tabular-nums text-xs text-[#3D2F1F]/55">
                      {pct.toFixed(0)}% · {eur(c.value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Évolution mensuelle — bar chart 6 derniers mois */}
      <section className="mt-5 card-lg p-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="label">Évolution · 6 mois</p>
          <div className="flex items-center gap-3 text-[10px] text-[#3D2F1F]/55 uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "#7B9B75" }}
              />
              Rev
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "#C47A6B" }}
              />
              Dép
            </span>
          </div>
        </div>
        <MonthBars months={months} max={maxMonthValue} />
      </section>

      {/* Indicateurs clés */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-4">Indicateurs · {currentMonthName}</p>
        <div className="grid grid-cols-2 gap-3">
          <Kpi
            label="Moy/jour"
            value={eur(avgPerDay)}
            hint={`sur ${dayOfMonth}j`}
          />
          <Kpi
            label="Plus grosse dépense"
            value={biggest ? eur(biggest.amount) : "—"}
            hint={
              biggest
                ? findCategory(biggest.account, biggest.category)?.label
                : "Aucune"
            }
          />
          <Kpi label="Transactions" value={String(txCount)} hint="ce mois" />
          <Kpi
            label="Projection fin du mois"
            value={eur(projection)}
            hint="au rythme actuel"
            accent={projection > cur.income && cur.income > 0 ? "red" : "neutral"}
          />
        </div>
      </section>

      {/* Objectif d'épargne */}
      <section className="mt-5 card-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label inline-flex items-center gap-1.5">
            <Target size={11} /> Objectif d&apos;épargne
          </p>
          <button
            onClick={() => {
              setGoalInput(goal > 0 ? String(goal) : "");
              setEditingGoal(true);
            }}
            className="text-[11px] text-[#3D2F1F]/55 inline-flex items-center gap-1 hover:text-[#3D2F1F] press"
          >
            <Pencil size={11} /> {goal > 0 ? "Modifier" : "Définir"}
          </button>
        </div>

        {editingGoal ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = parseFloat(goalInput);
              setGoal(isFinite(n) && n > 0 ? n : 0);
              setEditingGoal(false);
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="Ex: 500"
              className="flex-1 rounded-full border border-[#3D2F1F]/10 bg-white/60 px-4 py-2.5 text-sm placeholder:text-[#3D2F1F]/45 focus:outline-none focus:border-[#7B9B75]/40 text-[#3D2F1F]"
            />
            <button
              type="submit"
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#F5EBDD]"
              style={{ background: "#7B9B75" }}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditingGoal(false)}
              className="rounded-full border border-[#3D2F1F]/10 px-3 py-2.5 text-sm text-[#3D2F1F]/70"
            >
              ✕
            </button>
          </form>
        ) : goal <= 0 ? (
          <p className="text-sm text-[#3D2F1F]/55">
            Définis un objectif mensuel pour suivre ta progression.
          </p>
        ) : goalHydrated ? (
          <>
            <p className="text-sm text-[#3D2F1F]">
              <span className="amount text-xl">{eur(Math.max(0, savings))}</span>
              <span className="text-[#3D2F1F]/55">
                {" "}
                / {eur(goal)} · {goalPct.toFixed(0)}%
              </span>
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${goalPct}%`,
                  background:
                    "linear-gradient(90deg, rgba(123,155,117,0.9), rgba(123,155,117,0.5))",
                  boxShadow: "0 0 14px rgba(123,155,117,0.4)",
                }}
              />
            </div>
            {goalPct >= 100 && (
              <p className="text-xs mt-2 text-[#7B9B75]">
                Objectif atteint ✓ Bravo !
              </p>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}

/* ----- SVG Circular Gauge ----- */
function CircularGauge({ value }: { value: number }) {
  const size = 92;
  const stroke = 10;
  const r = size / 2 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7B9B75" />
            <stop offset="100%" stopColor="#5F7D5A" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: "drop-shadow(0 0 10px rgba(123,155,117,0.55))",
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="amount text-xl tabular-nums">{Math.round(value)}%</span>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  color,
  amountSign,
}: {
  label: string;
  value: number;
  color: string;
  amountSign?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/55 p-3">
      <p className="label">{label}</p>
      <p
        className="amount mt-1.5 text-lg tabular-nums"
        style={{ color }}
      >
        {amountSign ?? ""}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}

function CompareChip({
  label,
  delta,
  invert = false,
}: {
  label: string;
  delta: number | null;
  invert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/55 p-3 flex items-center justify-between">
      <p className="text-[11px] text-[#3D2F1F]/55">{label}</p>
      <DeltaBadge value={delta} suffix="%" invert={invert} />
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
      <span className="text-[11px] text-[#3D2F1F]/45 inline-flex items-center gap-1">
        <Minus size={12} /> n/a
      </span>
    );
  }
  const neutral = Math.abs(value) < 0.05;
  const positive = invert ? value < 0 : value > 0;
  const color = neutral
    ? "rgba(255,255,255,0.5)"
    : positive
    ? "#7B9B75"
    : "#C47A6B";
  const bg = neutral
    ? "rgba(255,255,255,0.05)"
    : positive
    ? "rgba(123,155,117,0.12)"
    : "rgba(196,122,107,0.12)";
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

/* ----- Native SVG Month Bars ----- */
function MonthBars({
  months,
  max,
}: {
  months: {
    label: string;
    income: number;
    expense: number;
    isCurrent: boolean;
  }[];
  max: number;
}) {
  const barH = 110;
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 h-[130px]">
        {months.map((m, i) => {
          const inH = Math.max(2, (m.income / max) * barH);
          const exH = Math.max(2, (m.expense / max) * barH);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 relative"
            >
              {m.isCurrent && (
                <span
                  aria-hidden
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#7B9B75",
                    boxShadow: "0 0 8px rgba(123,155,117,0.75)",
                  }}
                />
              )}
              <div
                className="flex items-end gap-1 w-full justify-center"
                style={{ height: barH }}
              >
                <div
                  className="rounded-t-md"
                  style={{
                    width: "42%",
                    height: inH,
                    background:
                      "linear-gradient(180deg, rgba(123,155,117,1) 0%, rgba(123,155,117,0.55) 100%)",
                    boxShadow: m.isCurrent
                      ? "0 0 12px rgba(123,155,117,0.5)"
                      : undefined,
                    transition: "height 800ms cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: `${i * 40}ms`,
                    opacity: m.isCurrent ? 1 : 0.85,
                  }}
                />
                <div
                  className="rounded-t-md"
                  style={{
                    width: "42%",
                    height: exH,
                    background:
                      "linear-gradient(180deg, rgba(196,122,107,1) 0%, rgba(196,122,107,0.55) 100%)",
                    boxShadow: m.isCurrent
                      ? "0 0 12px rgba(196,122,107,0.45)"
                      : undefined,
                    transition: "height 800ms cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: `${i * 40 + 50}ms`,
                    opacity: m.isCurrent ? 1 : 0.85,
                  }}
                />
              </div>
              <span
                className={`text-[11px] uppercase tracking-wider ${
                  m.isCurrent ? "text-[#3D2F1F]" : "text-[#3D2F1F]/55"
                }`}
              >
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----- KPI cell ----- */
function Kpi({
  label,
  value,
  hint,
  accent = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "neutral" | "green" | "red";
}) {
  const colors =
    accent === "green"
      ? { c: "#7B9B75", shadow: "0 0 18px rgba(123,155,117,0.25)" }
      : accent === "red"
      ? { c: "#C47A6B", shadow: "0 0 18px rgba(196,122,107,0.22)" }
      : { c: "#3D2F1F", shadow: "none" };
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/55 p-4">
      <p className="label">{label}</p>
      <p
        className="amount mt-1.5 text-xl tabular-nums"
        style={{ color: colors.c, textShadow: colors.shadow }}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-[#3D2F1F]/45 mt-1">{hint}</p>}
    </div>
  );
}
