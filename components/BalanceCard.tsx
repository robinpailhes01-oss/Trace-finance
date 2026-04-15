"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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

  return (
    <section className="card-lg p-6 sm:p-8 relative overflow-hidden">
      {/* Subtle inner glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-72 -translate-y-1/2 rounded-full bg-[#4ECCA3]/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        <p className="label">Solde Total</p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="amount amount-hero mt-5 tabular-nums"
        >
          {eur(animated)}
        </motion.h1>

        <div className="mt-8 flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={onAddIncome}
            className="btn-pill btn-pill-green flex-1 inline-flex items-center justify-center gap-2.5 py-3 text-sm"
          >
            <span className="icon-circle-green h-7 w-7 grid place-items-center rounded-full">
              <ArrowDownLeft size={14} strokeWidth={2.4} />
            </span>
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="btn-pill btn-pill-red flex-1 inline-flex items-center justify-center gap-2.5 py-3 text-sm"
          >
            <span className="icon-circle-red h-7 w-7 grid place-items-center rounded-full">
              <ArrowUpRight size={14} strokeWidth={2.4} />
            </span>
            Dépenser
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 w-full">
          <FlashStat label="Revenus" value={income} tone="green" />
          <FlashStat label="Dépenses" value={expense} tone="red" />
        </div>
      </div>
    </section>
  );
}

function FlashStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red";
}) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 350);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className={`rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 text-left ${
        flash ? (tone === "green" ? "flash-green" : "flash-red") : ""
      }`}
    >
      <p className="label">{label}</p>
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
