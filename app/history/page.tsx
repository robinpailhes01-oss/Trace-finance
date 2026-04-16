"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Inbox } from "lucide-react";
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
import { Toast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

type Filter = "all" | TxType;

function groupByDay(list: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  list.forEach((t) => {
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
  const { txs, remove, hydrated } = useTransactions();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(false);

  const handleRemove = (id: string) => {
    remove(id);
    setToast(true);
    setTimeout(() => setToast(false), 1500);
  };

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
    <main className="mx-auto max-w-xl px-5 pb-32 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full border border-[#3D2F1F]/10 bg-white/60 hover:bg-white/70 press text-[#3D2F1F]/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#3D2F1F]">Historique</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* Search */}
      <div className="mt-7 relative">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2F1F]/45"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          className="w-full rounded-full border border-[#3D2F1F]/10 bg-white/60 pl-10 pr-4 py-3 text-sm placeholder:text-[#3D2F1F]/45 focus:outline-none focus:border-[#7B9B75]/30 text-[#3D2F1F]"
        />
      </div>

      {/* Filter pills */}
      <div className="mt-4 inline-flex rounded-full border border-[#3D2F1F]/10 bg-white/60 p-0.5 text-xs">
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
                active ? "text-[#7B9B75]" : "text-[#3D2F1F]/55"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="filter-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(123,155,117,0.15)" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <span className="relative font-semibold">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="stat-card stat-card-green p-4">
          <p className="label">Revenus</p>
          <p
            className="amount mt-2 text-xl num-green tabular-nums"
            style={{ textShadow: "0 0 20px rgba(123,155,117,0.3)" }}
          >
            +{eur(totals.i).replace("€", "")}€
          </p>
        </div>
        <div className="stat-card stat-card-red p-4">
          <p className="label">Dépenses</p>
          <p
            className="amount mt-2 text-xl num-red tabular-nums"
            style={{ textShadow: "0 0 20px rgba(196,122,107,0.25)" }}
          >
            −{eur(totals.e).replace("€", "")}€
          </p>
        </div>
      </div>

      {/* List */}
      <section className="mt-7">
        {!hydrated ? (
          <div className="card p-10 text-center text-[#3D2F1F]/45 text-sm">
            Chargement…
          </div>
        ) : groups.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-white/65 grid place-items-center mb-3 border border-[#3D2F1F]/10">
              <Inbox size={20} className="text-[#3D2F1F]/45" strokeWidth={1.6} />
            </div>
            <p className="text-sm font-medium text-[#3D2F1F]">
              Aucune transaction
            </p>
            <p className="text-xs text-[#3D2F1F]/45 mt-1">
              {query
                ? "Aucun résultat pour cette recherche"
                : "Ajoute ta première transaction depuis l'accueil"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g, gi) => (
              <div key={g.date}>
                {gi > 0 && (
                  <div
                    aria-hidden
                    className="mb-4 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                    }}
                  />
                )}
                <div
                  className="sticky top-0 z-10 -mx-5 px-5 py-2 mb-2 uppercase"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.65)",
                    background:
                      "linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.8) 70%, rgba(10,10,15,0) 100%)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  {labelFor(g.date)}
                </div>
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {g.items.map((t, i) => (
                      <SwipeRow
                        key={t.id}
                        tx={t}
                        onRemove={handleRemove}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <Toast open={toast} message="Transaction supprimée" tone="red" />
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
  const bg = useTransform(bgOpacity, (v) => `rgba(196,122,107,${v})`);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -120, transition: { duration: 0.25 } }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.03, 0.2),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5"
        style={{ background: bg }}
      >
        <Trash2 size={16} className="text-[#C47A6B]" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.18}
        style={{ x, touchAction: "pan-y" }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) {
            haptic([10, 30, 20]);
            onRemove(tx.id);
          } else {
            x.set(0);
          }
        }}
        className="card relative flex items-center gap-3 px-4 py-3.5 cursor-grab active:cursor-grabbing"
      >
        <div
          className={`h-10 w-10 shrink-0 rounded-full grid place-items-center text-lg ${
            tx.type === "income"
              ? "bg-[rgba(123,155,117,0.12)] text-[#7B9B75]"
              : "bg-[rgba(196,122,107,0.12)] text-[#C47A6B]"
          }`}
        >
          {cat?.emoji ?? "💸"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#3D2F1F] truncate">
            {tx.note?.length ? tx.note : cat?.label ?? "Transaction"}
          </p>
          <p className="text-[11px] text-[#3D2F1F]/45 mt-0.5">{cat?.label}</p>
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
