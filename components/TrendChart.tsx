"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/Sparkline";
import type { Transaction } from "@/lib/types";
import { eur } from "@/lib/format";

type Period = "7" | "14" | "30" | "90";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7", label: "7J" },
  { key: "14", label: "14J" },
  { key: "30", label: "30J" },
  { key: "90", label: "3M" },
];

export function TrendChart({ txs }: { txs: Transaction[] }) {
  const [period, setPeriod] = useState<Period>("30");

  const delta = useMemo(() => {
    const d = parseInt(period, 10);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (d - 1));
    let net = 0;
    txs.forEach((t) => {
      if (new Date(t.date) < since) return;
      net += t.type === "income" ? t.amount : -t.amount;
    });
    return net;
  }, [txs, period]);

  return (
    <div className="card-lg p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label">Évolution</p>
          <p
            className={`amount mt-1 text-xl tabular-nums ${
              delta >= 0 ? "text-positive" : "text-negative"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {eur(delta)}
          </p>
        </div>

        <div className="inline-flex rounded-full border border-white/8 bg-white/[0.02] p-0.5 text-[11px]">
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`relative px-2.5 py-1 rounded-full transition-colors duration-200 ${
                  active ? "text-[#0A0A0F]" : "text-white/55"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="trend-period-pill"
                    className="absolute inset-0 rounded-full bg-[#F0EDE8]"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                <span className="relative font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Re-mount sparkline on period change so the draw animation re-plays */}
      <Sparkline key={period} txs={txs} days={parseInt(period, 10)} height={160} />
    </div>
  );
}
