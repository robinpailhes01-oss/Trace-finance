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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-lg p-5"
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-semibold">Évolution · 14 jours</p>
        <p className="text-[11px] text-white/45 uppercase tracking-wider">
          Cumul net
        </p>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ECCA3" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#4ECCA3" stopOpacity={0} />
              </linearGradient>
              <filter id="trend-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#4ECCA360", strokeDasharray: "4 4" }}
              contentStyle={{
                background: "#12121A",
                border: "1px solid #2A2A3E",
                borderRadius: 12,
                fontSize: 12,
                color: "#f5f5f7",
              }}
              labelStyle={{ color: "#ffffff70" }}
              formatter={(v: number) => [eur(v), "Cumul"]}
            />
            <Area
              type="monotone"
              dataKey="running"
              stroke="#4ECCA3"
              strokeWidth={2.5}
              fill="url(#trend-fill)"
              filter="url(#trend-glow)"
              dot={false}
              activeDot={{
                r: 5,
                stroke: "#4ECCA3",
                strokeWidth: 2,
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
