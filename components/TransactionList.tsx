"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { eur, formatRelative } from "@/lib/format";
import { findCategory, type Transaction } from "@/lib/types";

export function TransactionList({
  txs,
  onRemove,
}: {
  txs: Transaction[];
  onRemove: (id: string) => void;
}) {
  if (txs.length === 0) {
    return (
      <div className="card p-10 text-center text-muted text-sm">
        Aucune transaction pour l&apos;instant.
      </div>
    );
  }

  return (
    <ul className="card divide-y divide-line overflow-hidden">
      <AnimatePresence initial={false}>
        {txs.map((t) => {
          const cat = findCategory(t.account, t.category);
          return (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="group flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.015]"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#0F0F16] hairline grid place-items-center text-base">
                {cat?.emoji ?? "💸"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cream truncate">
                  {t.note?.length ? t.note : cat?.label ?? "Transaction"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {cat?.label} · {formatRelative(t.date)}
                </p>
              </div>
              <p
                className={`amount text-lg tabular-nums ${
                  t.type === "income" ? "text-positive" : "text-cream"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {eur(t.amount)}
              </p>
              <button
                onClick={() => onRemove(t.id)}
                className="opacity-0 group-hover:opacity-100 transition h-7 w-7 grid place-items-center rounded-full hover:bg-accent-red/15 hover:text-accent-red press text-muted"
                aria-label="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
