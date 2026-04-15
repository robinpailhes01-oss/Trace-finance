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
    <section className="py-10 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
          Solde total
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="amount mt-5 text-[64px] sm:text-[88px] leading-none tabular-nums"
        >
          {display}
        </motion.h1>

        <div className="mt-10 flex items-center gap-3">
          <button
            onClick={onAddIncome}
            className="pill press inline-flex items-center gap-2.5 px-5 py-3 text-sm font-medium"
          >
            <span className="dot-green h-6 w-6 grid place-items-center rounded-full">
              <ArrowDownLeft size={13} strokeWidth={2.5} />
            </span>
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="pill press inline-flex items-center gap-2.5 px-5 py-3 text-sm font-medium"
          >
            <span className="dot-red h-6 w-6 grid place-items-center rounded-full">
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </span>
            Dépenser
          </button>
        </div>
      </div>

      {/* Subtle stats row */}
      <div className="mt-10 grid grid-cols-2 gap-3 max-w-md mx-auto">
        <Stat label="Revenus" value={income} tone="green" />
        <Stat label="Dépenses" value={expense} tone="red" />
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
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p
        className={`amount mt-2 text-2xl tabular-nums ${
          tone === "green" ? "text-positive" : "text-negative"
        }`}
      >
        {tone === "green" ? "+" : "−"}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}
