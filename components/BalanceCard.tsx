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
  transfers = 0,
  onAddIncome,
  onAddExpense,
}: {
  balance: number;
  income: number;
  expense: number;
  transfers?: number;
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
            type="button"
            onClick={onAddIncome}
            className="flex-1 inline-flex items-center justify-center gap-2.5 min-h-[48px] py-3 text-sm font-medium rounded-full active:scale-95 transition-transform duration-150"
            style={{
              background: "rgba(123,155,117,0.18)",
              border: "1px solid rgba(123,155,117,0.3)",
              color: "#3D2F1F",
            }}
          >
            <span className="icon-circle-green h-7 w-7 grid place-items-center rounded-full">
              <ArrowDownLeft size={14} strokeWidth={2.4} />
            </span>
            Recevoir
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="flex-1 inline-flex items-center justify-center gap-2.5 min-h-[48px] py-3 text-sm font-medium rounded-full active:scale-95 transition-transform duration-150"
            style={{
              background: "rgba(196,122,107,0.18)",
              border: "1px solid rgba(196,122,107,0.3)",
              color: "#3D2F1F",
            }}
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
        {transfers > 0 && (
          <div className="mt-3 w-full">
            <FlashStat label="Épargne / Invest" value={transfers} tone="gold" />
          </div>
        )}
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
  tone: "green" | "red" | "gold";
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
        tone === "green" ? "stat-card-green" : tone === "red" ? "stat-card-red" : ""
      } p-4 text-left ${
        flash ? (tone === "green" ? "flash-green" : tone === "red" ? "flash-red" : "") : ""
      }`}
    >
      <p className="label">{label}</p>
      <p
        className="amount mt-2 text-2xl tabular-nums"
        style={{
          color: tone === "green" ? "var(--c-sage-deep)" : tone === "red" ? "var(--c-terra-deep)" : "#B89855",
        }}
      >
        {tone === "green" ? "+" : tone === "gold" ? "" : "−"}
        {eur(value).replace("€", "")}€
      </p>
    </div>
  );
}
