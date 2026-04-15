"use client";

import { useMemo } from "react";
import { Sparkline } from "@/components/Sparkline";
import type { Transaction } from "@/lib/types";
import { eur } from "@/lib/format";

export function TrendChart({ txs }: { txs: Transaction[] }) {
  const { delta, days } = useMemo(() => {
    const d = 30;
    let net = 0;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (d - 1));
    txs.forEach((t) => {
      if (new Date(t.date) < since) return;
      net += t.type === "income" ? t.amount : -t.amount;
    });
    return { delta: net, days: d };
  }, [txs]);

  return (
    <div className="card-lg p-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="label">Évolution · {days}j</p>
        <p className="amount text-base tabular-nums">
          {delta >= 0 ? "+" : ""}
          {eur(delta)}
        </p>
      </div>
      <Sparkline txs={txs} days={days} height={140} />
    </div>
  );
}
