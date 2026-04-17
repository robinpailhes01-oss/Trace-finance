"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkline } from "@/components/Sparkline";
import type { Transaction } from "@/lib/types";
import { eur } from "@/lib/format";

type Period = "7" | "14" | "30" | "90" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7", label: "7J" },
  { key: "14", label: "14J" },
  { key: "30", label: "30J" },
  { key: "90", label: "3M" },
  { key: "all", label: "Tout" },
];

export function TrendChart({ txs }: { txs: Transaction[] }) {
  const [period, setPeriod] = useState<Period>("30");

  // Determine days to display: fixed for preset periods, dynamic for "all"
  const days = useMemo(() => {
    if (period !== "all") return parseInt(period, 10);
    if (txs.length === 0) return 30;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let oldest = now.getTime();
    txs.forEach((t) => {
      const d = new Date(t.date).getTime();
      if (d < oldest) oldest = d;
    });
    const diff = Math.ceil(
      (now.getTime() - oldest) / (1000 * 60 * 60 * 24),
    );
    return Math.max(7, Math.min(diff + 1, 730)); // cap at 2 years
  }, [period, txs]);

  const delta = useMemo(() => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));
    let net = 0;
    txs.forEach((t) => {
      if (new Date(t.date) < since) return;
      net += t.type === "income" ? t.amount : -t.amount;
    });
    return net;
  }, [txs, days]);

  return (
    <div className="card-lg p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
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

        <div className="inline-flex rounded-full border border-[#3D2F1F]/10 bg-white/55 p-0.5 text-[11px] flex-wrap">
          {PERIODS.map((p) => {
            const active = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`relative px-2.5 py-1 rounded-full transition-colors duration-200 ${
                  active ? "text-[#F5EBDD]" : "text-[#3D2F1F]/55"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="trend-period-pill"
                    className="absolute inset-0 rounded-full bg-[#3D2F1F]"
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
      <div className="pb-3">
        <Sparkline key={`${period}-${txs.length}`} txs={txs} days={days} height={180} />
      </div>
    </div>
  );
}
