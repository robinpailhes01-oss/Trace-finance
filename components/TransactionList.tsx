"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
      <div className="card p-10 text-center text-white/50 text-sm">
        Aucune transaction pour l&apos;instant.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {txs.map((t) => (
          <Row key={t.id} tx={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function Row({
  tx,
  onRemove,
}: {
  tx: Transaction;
  onRemove: (id: string) => void;
}) {
  const cat = findCategory(tx.account, tx.category);
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-100, -40, 0], [0.5, 0.2, 0]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: [
          "rgba(78,204,163,0.2)",
          "rgba(78,204,163,0)",
        ],
        transition: {
          y: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3 },
          backgroundColor: { duration: 0.6, times: [0, 1] },
        },
      }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
      className="relative"
    >
      {/* Delete hint behind on swipe */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5"
        style={{
          background: useTransform(
            bgOpacity,
            (v) => `rgba(255,107,107,${v})`,
          ),
        }}
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
        className="relative card flex items-center gap-3 px-4 py-3.5 cursor-grab active:cursor-grabbing"
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
          <p className="text-[11px] text-white/45 mt-0.5">
            {cat?.label} · {formatRelative(tx.date)}
          </p>
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
