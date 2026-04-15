"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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
    const buckets: { date: string; label: string; running: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        running: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.date, i]));
    const net = new Array(buckets.length).fill(0);
    txs.forEach((t) => {
      const k = t.date.slice(0, 10);
      const i = idx.get(k);
      if (i == null) return;
      net[i] += t.type === "income" ? t.amount : -t.amount;
    });
    let acc = 0;
    buckets.forEach((b, i) => {
      acc += net[i];
      b.running = acc;
    });
    return buckets;
  }, [txs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card-lg p-6"
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs text-muted uppercase tracking-[0.22em]">
          14 jours
        </p>
        <p className="text-xs text-muted">Cumul net</p>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ECCA3" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#4ECCA3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#2A2A3A", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#12121A",
                border: "1px solid #1E1E28",
                borderRadius: 10,
                fontSize: 12,
                color: "#F0EDE8",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#8A8A95" }}
              formatter={(v: number) => [eur(v), "Cumul"]}
            />
            <Area
              type="monotone"
              dataKey="running"
              stroke="#4ECCA3"
              strokeWidth={1.5}
              fill="url(#trend-fill)"
              dot={false}
              activeDot={{
                r: 4,
                stroke: "#4ECCA3",
                strokeWidth: 1.5,
                fill: "#0A0A0F",
              }}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
