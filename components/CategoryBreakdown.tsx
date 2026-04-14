"use client";

import { useMemo } from "react";
import { eur } from "@/lib/format";
import { findCategory, type Transaction } from "@/lib/types";

export function CategoryBreakdown({ txs }: { txs: Transaction[] }) {
  const items = useMemo(() => {
    const totals = new Map<string, number>();
    txs
      .filter((t) => t.type === "expense")
      .forEach((t) => totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount));
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
    <div className="rounded-3xl glass p-5">
      <p className="text-sm font-medium mb-3">Top dépenses</p>
      <ul className="space-y-2.5">
        {items.map((it) => {
          const cat = findCategory(txs[0]?.account ?? "perso", it.key);
          return (
            <li key={it.key}>
              <div className="flex items-center justify-between text-sm">
                <span>
                  <span className="mr-2">{cat?.emoji ?? "💸"}</span>
                  {cat?.label ?? it.key}
                </span>
                <span className="text-white/70 tabular-nums">{eur(it.value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-gold to-white/80"
                  style={{ width: `${Math.max(8, it.pct * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
