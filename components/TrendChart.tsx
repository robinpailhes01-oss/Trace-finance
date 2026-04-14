"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/lib/types";
import { eur } from "@/lib/format";

export function TrendChart({ txs }: { txs: Transaction[] }) {
  const data = useMemo(() => {
    const days = 14;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const buckets: { date: string; label: string; net: number; running: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        net: 0,
        running: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.date, i]));
    txs.forEach((t) => {
      const k = t.date.slice(0, 10);
      const i = idx.get(k);
      if (i == null) return;
      buckets[i].net += t.type === "income" ? t.amount : -t.amount;
    });
    let acc = 0;
    buckets.forEach((b) => {
      acc += b.net;
      b.running = acc;
    });
    return buckets;
  }, [txs]);

  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-sm font-medium">Évolution · 14 jours</p>
        <p className="text-xs text-white/40">Cumul net</p>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#ffffff20" }}
              contentStyle={{
                background: "#131316",
                border: "1px solid #ffffff15",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#ffffff80" }}
              formatter={(v: number) => [eur(v), "Cumul"]}
            />
            <Area
              type="monotone"
              dataKey="running"
              stroke="#4ade80"
              strokeWidth={2}
              fill="url(#g)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
