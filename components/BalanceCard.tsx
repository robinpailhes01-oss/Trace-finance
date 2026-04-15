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
    <section className="card-lg p-7 sm:p-9 relative overflow-hidden">
      <div className="relative flex flex-col items-center text-center">
        <p className="label">Solde Total</p>

        <h1 className="amount amount-hero mt-5 tabular-nums">
          {eur(animated)}
        </h1>

        <div className="mt-8 flex items-center gap-3 w-full max-w-sm">
          <button
            onClick={onAddIncome}
            className="btn-glass btn-glass-green flex-1 inline-flex items-center justify-center gap-2.5 py-3 text-sm"
          >
            <span className="icon-circle-green h-6 w-6 grid place-items-center rounded-full">
              <ArrowDownLeft size={12} strokeWidth={2.6} />
            </span>
            Recevoir
          </button>
          <button
            onClick={onAddExpense}
            className="btn-glass btn-glass-red flex-1 inline-flex items-center justify-center gap-2.5 py-3 text-sm"
          >
            <span className="icon-circle-red h-6 w-6 grid place-items-center rounded-full">
              <ArrowUpRight size={12} strokeWidth={2.6} />
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
      const t = setTimeout(() => setFlash(false), 360);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className={`stat-card ${
        tone === "green" ? "stat-card-green" : "stat-card-red"
      } p-4 text-left ${
        flash ? (tone === "green" ? "flash-green" : "flash-red") : ""
      }`}
    >
      <p className="label">{label}</p>
      <p
        className={`amount mt-2 text-2xl tabular-nums ${
          tone === "green" ? "text-positive" : "text-negative"
        }`}
        style={{
          textShadow:
            tone === "green"
              ? "0 0 20px rgba(78,204,163,0.3)"
              : "0 0 20px rgba(255,107,107,0.25)",
        }}
      >
        {tone === "green" ? "+" : "−"}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}
