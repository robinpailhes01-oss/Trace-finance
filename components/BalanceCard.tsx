"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { eur } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";

export function BalanceCard({
  balance,
  income,
  expense,
  onAddIncome,
  onAddExpense,
}: {
  balance: number;
  income: number;
  expense: number;
  onAddIncome: () => void;
  onAddExpense: () => void;
}) {
  const animated = useCountUp(balance);
  const display = eur(animated);

  return (
    <section className="relative overflow-hidden card-lg sheen p-7 sm:p-9">
      {/* Ambient halo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
          Solde total
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`amount mt-3 text-6xl sm:text-7xl tabular-nums ${
            balance >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {display}
        </motion.h1>

        <div className="mt-7 flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={onAddIncome}
            className="btn-green press flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
          >
            <ArrowDownLeft size={16} strokeWidth={2.5} />
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="btn-red press flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
          >
            <ArrowUpRight size={16} strokeWidth={2.5} />
            Dépenser
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 w-full">
          <Stat label="Revenus" value={income} tone="green" />
          <Stat label="Dépenses" value={expense} tone="red" />
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red";
}) {
  return (
    <div className="card p-4 text-left">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p
        className={`amount mt-1.5 text-2xl tabular-nums ${
          tone === "green" ? "text-positive" : "text-negative"
        }`}
      >
        {tone === "green" ? "+" : "−"}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}
