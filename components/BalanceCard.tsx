"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { eur } from "@/lib/format";

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
  return (
    <section className="relative overflow-hidden rounded-3xl glass p-6 sm:p-8">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-accent-gold/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Solde Total</p>
        <motion.h1
          key={balance}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="metallic-text mt-3 text-5xl sm:text-6xl font-semibold tabular-nums"
        >
          {eur(balance)}
        </motion.h1>

        <div className="mt-6 flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={onAddIncome}
            className="shine-btn flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium hover:brightness-110 active:scale-[0.98] transition"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-green/20 text-accent-green">
              <ArrowDownLeft size={16} />
            </span>
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="shine-btn flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium hover:brightness-110 active:scale-[0.98] transition"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-red/20 text-accent-red">
              <ArrowUpRight size={16} />
            </span>
            Dépenser
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 w-full">
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
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-3 text-left">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          tone === "green" ? "text-accent-green" : "text-accent-red"
        }`}
      >
        {tone === "green" ? "+" : "−"}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}
