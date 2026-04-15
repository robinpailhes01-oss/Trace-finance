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
          className="h-10 w-10 grid place-items-center rounded-full bg-white/5 hover:bg-white/10"
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
          className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      <div className="mt-3 inline-flex glass rounded-full p-1 text-sm">
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
              className={`relative px-3.5 py-1.5 rounded-full transition-colors ${
                active ? "text-black" : "text-white/60"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl glass p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Revenus</p>
          <p className="mt-1 text-lg font-semibold text-accent-green tabular-nums">
            +{eur(totals.i).replace("€", "")}€
          </p>
        </div>
        <div className="rounded-2xl glass p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Dépenses</p>
          <p className="mt-1 text-lg font-semibold text-accent-red tabular-nums">
            −{eur(totals.e).replace("€", "")}€
          </p>
        </div>
      </div>

      <section className="mt-6 space-y-6">
        {groups.length === 0 && (
          <div className="rounded-2xl glass p-8 text-center text-white/50 text-sm">
            Aucune transaction
          </div>
        )}
        <AnimatePresence initial={false}>
          {groups.map((g) => (
            <motion.div key={g.date} layout>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">
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
                        className="group flex items-center gap-3 rounded-2xl glass px-4 py-3"
                      >
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full grid place-items-center text-lg ${
                            t.type === "income"
                              ? "bg-accent-green/15"
                              : "bg-white/5"
                          }`}
                        >
                          {cat?.emoji ?? "💸"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {t.note?.length ? t.note : cat?.label ?? "Transaction"}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {cat?.label}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            t.type === "income" ? "text-accent-green" : "text-white"
                          }`}
                        >
                          {t.type === "income" ? "+" : "−"}
                          {eur(t.amount)}
                        </p>
                        <button
                          onClick={() => remove(t.id)}
                          className="h-8 w-8 grid place-items-center rounded-full bg-white/5 hover:bg-accent-red/20 hover:text-accent-red transition"
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
