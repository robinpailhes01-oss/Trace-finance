"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
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
        const cat =
          findCategory(t.account, t.category)?.label.toLowerCase() ?? "";
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
    <main className="mx-auto max-w-xl px-5 pb-28 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] press text-white/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#F0EDE8]">Historique</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      <div className="mt-7 relative">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          className="w-full rounded-full border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-[#4ECCA3]/30"
        />
      </div>

      <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
        {(
          [
            { key: "all", label: "Tout" },
            { key: "income", label: "Revenus" },
            { key: "expense", label: "Dépenses" },
          ] as { key: Filter; label: string }[]
        ).map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 ${
                active ? "text-[#4ECCA3]" : "text-white/55"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(78,204,163,0.15)" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative font-semibold">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="stat-card stat-card-green p-4">
          <p className="label">Revenus</p>
          <p
            className="amount mt-2 text-xl num-green tabular-nums"
            style={{ textShadow: "0 0 20px rgba(78,204,163,0.3)" }}
          >
            +{eur(totals.i).replace("€", "")}€
          </p>
        </div>
        <div className="stat-card stat-card-red p-4">
          <p className="label">Dépenses</p>
          <p
            className="amount mt-2 text-xl num-red tabular-nums"
            style={{ textShadow: "0 0 20px rgba(255,107,107,0.25)" }}
          >
            −{eur(totals.e).replace("€", "")}€
          </p>
        </div>
      </div>

      <section className="mt-7 space-y-7">
        {groups.length === 0 && (
          <div className="card p-10 text-center text-white/50 text-sm">
            Aucune transaction
          </div>
        )}
        <AnimatePresence initial={false}>
          {groups.map((g) => (
            <motion.div key={g.date} layout>
              <p
                className="mb-3 uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  opacity: 0.3,
                  fontWeight: 500,
                }}
              >
                {labelFor(g.date)}
              </p>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {g.items.map((t, i) => (
                    <SwipeRow key={t.id} tx={t} onRemove={remove} index={i} />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </main>
  );
}

function SwipeRow({
  tx,
  onRemove,
  index,
}: {
  tx: Transaction;
  onRemove: (id: string) => void;
  index: number;
}) {
  const cat = findCategory(tx.account, tx.category);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-100, -40, 0], [0.55, 0.25, 0]);
  const bg = useTransform(bgOpacity, (v) => `rgba(255,107,107,${v})`);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5"
        style={{ background: bg }}
      >
        <Trash2 size={16} className="text-[#FF6B6B]" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.18}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onRemove(tx.id);
          else x.set(0);
        }}
        className="card relative flex items-center gap-3 px-4 py-3.5 cursor-grab active:cursor-grabbing"
      >
        <div
          className={`h-9 w-9 shrink-0 rounded-full grid place-items-center text-base ${
            tx.type === "income"
              ? "bg-[rgba(78,204,163,0.12)] text-[#4ECCA3]"
              : "bg-[rgba(255,107,107,0.12)] text-[#FF6B6B]"
          }`}
        >
          {cat?.emoji ?? "💸"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#F0EDE8] truncate">
            {tx.note?.length ? tx.note : cat?.label ?? "Transaction"}
          </p>
          <p className="text-[11px] text-white/45 mt-0.5">{cat?.label}</p>
        </div>
        <p
          className={`text-base tabular-nums ${
            tx.type === "income" ? "num-green" : "num-red"
          }`}
        >
          {tx.type === "income" ? "+" : "−"}
          {eur(tx.amount)}
        </p>
      </motion.div>
    </motion.li>
  );
}
