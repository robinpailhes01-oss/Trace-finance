"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction } from "@/lib/types";

export function Sparkline({
  txs,
  days = 30,
  height = 140,
}: {
  txs: Transaction[];
  days?: number;
  height?: number;
}) {
  const points = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const series: number[] = new Array(days).fill(0);
    const idx = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      idx.set(d.toISOString().slice(0, 10), i);
    }
    txs.forEach((t) => {
      const k = t.date.slice(0, 10);
      const i = idx.get(k);
      if (i == null) return;
      series[i] += t.type === "income" ? t.amount : -t.amount;
    });
    // cumulative
    let acc = 0;
    return series.map((v) => (acc += v));
  }, [txs, days]);

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 600, h: height });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(200, rect.width), h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // Compute svg path
  const { d, lastX, lastY, minY, maxY } = useMemo(() => {
    const w = size.w;
    const h = size.h;
    const pad = 8;
    if (points.length === 0) {
      return { d: "", lastX: 0, lastY: 0, minY: 0, maxY: 0 };
    }
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const stepX = (w - pad * 2) / Math.max(1, points.length - 1);
    const toY = (v: number) =>
      pad + (1 - (v - min) / span) * (h - pad * 2);
    let path = "";
    points.forEach((v, i) => {
      const x = pad + i * stepX;
      const y = toY(v);
      if (i === 0) path += `M${x.toFixed(2)},${y.toFixed(2)}`;
      else {
        // smooth with simple quadratic midpoints
        const prevX = pad + (i - 1) * stepX;
        const prevY = toY(points[i - 1]);
        const mx = (prevX + x) / 2;
        const my = (prevY + y) / 2;
        path += ` Q${prevX.toFixed(2)},${prevY.toFixed(2)} ${mx.toFixed(2)},${my.toFixed(2)}`;
        if (i === points.length - 1) path += ` T${x.toFixed(2)},${y.toFixed(2)}`;
      }
    });
    const lx = pad + (points.length - 1) * stepX;
    const ly = toY(points[points.length - 1]);
    return { d: path, lastX: lx, lastY: ly, minY: min, maxY: max };
  }, [points, size]);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
    }
  }, [d]);

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height }}>
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ECCA3" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4ECCA3" stopOpacity="0" />
          </linearGradient>
          <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        {d && (
          <path
            d={`${d} L${lastX},${size.h} L${size.w && 8},${size.h} Z`}
            fill="url(#spark-fill)"
            opacity={0.9}
          />
        )}

        {/* Line with draw-on animation via stroke-dashoffset */}
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="#4ECCA3"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
            animation: pathLen > 0 ? "spark-draw 1.4s ease-out forwards" : undefined,
          }}
        />

        {/* Glowing end-point */}
        {d && (
          <g className="dot-pulse" style={{ transformOrigin: `${lastX}px ${lastY}px` }}>
            <circle cx={lastX} cy={lastY} r={6} fill="#4ECCA3" opacity={0.22} />
            <circle
              cx={lastX}
              cy={lastY}
              r={3}
              fill="#4ECCA3"
              filter="url(#dot-glow)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
