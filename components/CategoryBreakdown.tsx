"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { eur } from "@/lib/format";
import { findCategory, type Transaction } from "@/lib/types";

export function CategoryBreakdown({ txs }: { txs: Transaction[] }) {
  const items = useMemo(() => {
    const totals = new Map<string, number>();
    txs
      .filter((t) => t.type === "expense")
      .forEach((t) =>
        totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount),
      );
    const arr = Array.from(totals.entries()).map(([key, value]) => ({
      key,
      value,
    }));
    arr.sort((a, b) => b.value - a.value);
    const max = Math.max(...arr.map((a) => a.value), 1);
    return arr.slice(0, 5).map((a) => ({ ...a, pct: a.value / max }));
  }, [txs]);

  if (items.length === 0) return null;

  return (
    <div className="card-lg p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-muted mb-5">
        Top dépenses
      </p>
      <ul className="space-y-4">
        {items.map((it, idx) => {
          const cat = findCategory(txs[0]?.account ?? "perso", it.key);
          return (
            <li key={it.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-cream">
                  <span className="mr-2">{cat?.emoji ?? "💸"}</span>
                  {cat?.label ?? it.key}
                </span>
                <span className="amount text-base tabular-nums">
                  {eur(it.value)}
                </span>
              </div>
              <div className="mt-2 h-px w-full bg-line overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, it.pct * 100)}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.06 * idx,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-[2px] -mt-px rounded-full bg-cream"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
