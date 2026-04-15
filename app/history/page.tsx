"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useTransactions } from "@/lib/store";
import { findCategory, type Transaction, type TxType } from "@/lib/types";
import { eur } from "@/lib/format";
import { AccountSwitcher } from "@/components/AccountSwitcher";

type Filter = "all" | TxType;

function groupByDay(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  txs.forEach((t) => {
    const day = t.date.slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(t);
    map.set(day, arr);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([date, items]) => ({ date, items }));
}

function labelFor(dayIso: string) {
  const d = new Date(dayIso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Aujourd'hui";
  if (d.getTime() === yesterday.getTime()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HistoryPage() {
  const { account, setAccount } = useAccount();
  const { txs, remove } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs
      .filter((t) => t.account === account)
      .filter((t) => (filter === "all" ? true : t.type === filter))
      .filter((t) => {
        if (!q) return true;
        const cat = findCategory(t.account, t.category)?.label.toLowerCase() ?? "";
        return (t.note ?? "").toLowerCase().includes(q) || cat.includes(q);
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [txs, account, filter, query]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const totals = useMemo(() => {
    let i = 0;
    let e = 0;
    filtered.forEach((t) => {
      if (t.type === "income") i += t.amount;
      else e += t.amount;
    });
    return { i, e };
  }, [filtered]);

  return (
    <main className="mx-auto max-w-xl px-4 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full bg-white/[0.04] border border-line hover:bg-white/10 press"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold">Historique</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      <div className="mt-5 relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par description ou catégorie"
          className="w-full rounded-full bg-white/[0.04] border border-line pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25"
        />
      </div>

      <div className="mt-3 inline-flex rounded-full border border-line bg-white/[0.03] p-1 text-sm">
        {([
          { key: "all", label: "Tout" },
          { key: "income", label: "Revenus" },
          { key: "expense", label: "Dépenses" },
        ] as { key: Filter; label: string }[]).map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative px-4 py-1.5 rounded-full transition-colors ${
                active ? "text-bg" : "text-white/55"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-white/85"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative font-semibold">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            Revenus
          </p>
          <p className="amount mt-1 text-xl text-positive tabular-nums">
            +{eur(totals.i).replace("€", "")}€
          </p>
        </div>
        <div className="card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            Dépenses
          </p>
          <p className="amount mt-1 text-xl text-negative tabular-nums">
            −{eur(totals.e).replace("€", "")}€
          </p>
        </div>
      </div>

      <section className="mt-6 space-y-6">
        {groups.length === 0 && (
          <div className="card p-8 text-center text-white/50 text-sm">
            Aucune transaction
          </div>
        )}
        <AnimatePresence initial={false}>
          {groups.map((g) => (
            <motion.div key={g.date} layout>
              <p className="text-[11px] uppercase tracking-wider text-white/45 mb-2">
                {labelFor(g.date)}
              </p>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {g.items.map((t) => {
                    const cat = findCategory(t.account, t.category);
                    return (
                      <motion.li
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        className="group flex items-center gap-3 card px-4 py-3"
                      >
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full grid place-items-center text-lg ${
                            t.type === "income"
                              ? "bg-accent-green/15 ring-1 ring-accent-green/25"
                              : "bg-white/5 ring-1 ring-white/5"
                          }`}
                        >
                          {cat?.emoji ?? "💸"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {t.note?.length ? t.note : cat?.label ?? "Transaction"}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">{cat?.label}</p>
                        </div>
                        <p
                          className={`amount text-lg tabular-nums ${
                            t.type === "income" ? "text-positive" : "text-white"
                          }`}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {eur(t.amount)}
                        </p>
                        <button
                          onClick={() => remove(t.id)}
                          className="h-8 w-8 grid place-items-center rounded-full bg-white/5 hover:bg-accent-red/20 hover:text-accent-red press"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </main>
  );
}
