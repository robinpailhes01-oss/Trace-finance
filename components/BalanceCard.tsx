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
    <section className="py-10 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <p className="label">Total Balance</p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="amount amount-hero mt-6 tabular-nums"
        >
          {eur(animated)}
        </motion.h1>

        <div className="mt-10 flex items-center gap-3">
          <button
            onClick={onAddIncome}
            className="pill-dark inline-flex items-center gap-2.5 px-5 py-3 text-sm font-medium"
          >
            <ArrowDownLeft size={16} strokeWidth={1.8} className="icon-muted" />
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="pill-dark inline-flex items-center gap-2.5 px-5 py-3 text-sm font-medium"
          >
            <ArrowUpRight size={16} strokeWidth={1.8} className="icon-muted" />
            Dépenser
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 max-w-md mx-auto">
        <FlashStat label="Revenus" value={income} tone="green" />
        <FlashStat label="Dépenses" value={expense} tone="red" />
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
      className={`card p-4 text-left ${
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
