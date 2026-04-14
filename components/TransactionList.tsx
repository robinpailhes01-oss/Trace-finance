"use client";

import { motion } from "framer-motion";
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
      <div className="rounded-2xl glass p-8 text-center text-white/50 text-sm">
        Aucune transaction. Ajoute ta première en un clic.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {txs.map((t) => {
        const cat = findCategory(t.account, t.category);
        return (
          <motion.li
            key={t.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="group flex items-center gap-3 rounded-2xl glass px-4 py-3 hover:bg-white/[0.05] transition"
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
                {cat?.label} · {formatRelative(t.date)}
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
              onClick={() => onRemove(t.id)}
              className="opacity-0 group-hover:opacity-100 transition h-8 w-8 grid place-items-center rounded-full bg-white/5 hover:bg-accent-red/20 hover:text-accent-red"
              aria-label="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
