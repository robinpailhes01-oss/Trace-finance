"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transaction } from "@/lib/types";
import { eur } from "@/lib/format";

interface PointMeta {
  x: number;
  y: number;
  date: string;
  value: number;
}

export function Sparkline({
  txs,
  days = 30,
  height = 180,
}: {
  txs: Transaction[];
  days?: number;
  height?: number;
}) {
  const points = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const labels: string[] = [];
    const series: number[] = new Array(days).fill(0);
    const idx = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      const iso = d.toISOString().slice(0, 10);
      labels.push(iso);
      idx.set(iso, i);
    }
    txs.forEach((t) => {
      const k = t.date.slice(0, 10);
      const i = idx.get(k);
      if (i == null) return;
      series[i] += t.type === "income" ? t.amount : -t.amount;
    });
    let acc = 0;
    const cum = series.map((v) => (acc += v));
    return labels.map((iso, i) => ({ date: iso, value: cum[i] }));
  }, [txs, days]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 600, h: height });
  const [pathLen, setPathLen] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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

  const { d, meta, lastX, lastY, scaleY } = useMemo(() => {
    const w = size.w;
    const h = size.h;
    const padX = 8;
    const padY = 14;
    if (points.length === 0) {
      return { d: "", meta: [] as PointMeta[], lastX: 0, lastY: 0, scaleY: 0 };
    }
    const min = Math.min(...points.map((p) => p.value));
    const max = Math.max(...points.map((p) => p.value));
    const span = max - min || 1;
    const stepX = (w - padX * 2) / Math.max(1, points.length - 1);
    const toY = (v: number) => padY + (1 - (v - min) / span) * (h - padY * 2);

    let path = "";
    const m: PointMeta[] = [];
    points.forEach((p, i) => {
      const x = padX + i * stepX;
      const y = toY(p.value);
      m.push({ x, y, date: p.date, value: p.value });
      if (i === 0) {
        path += `M${x.toFixed(2)},${y.toFixed(2)}`;
      } else {
        const prevX = padX + (i - 1) * stepX;
        const prevY = toY(points[i - 1].value);
        const mx = (prevX + x) / 2;
        const my = (prevY + y) / 2;
        path += ` Q${prevX.toFixed(2)},${prevY.toFixed(2)} ${mx.toFixed(2)},${my.toFixed(2)}`;
        if (i === points.length - 1) path += ` T${x.toFixed(2)},${y.toFixed(2)}`;
      }
    });

    return {
      d: path,
      meta: m,
      lastX: m[m.length - 1].x,
      lastY: m[m.length - 1].y,
      scaleY: span,
    };
  }, [points, size]);

  // Path length for draw animation
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
    }
  }, [d]);

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (meta.length === 0) return;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < meta.length; i++) {
      const dist = Math.abs(meta[i].x - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  };

  const handleLeave = () => setHoverIdx(null);

  const active = hoverIdx != null ? meta[hoverIdx] : null;

  return (
    <div ref={wrapperRef} className="relative w-full" style={{ height }}>
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0 w-full h-full overflow-visible"
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={handleLeave}
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ECCA3" stopOpacity="0.28" />
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
            d={`${d} L${lastX},${size.h} L8,${size.h} Z`}
            fill="url(#spark-fill)"
            opacity={0.95}
          />
        )}

        {/* Line — draw animation */}
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="#4ECCA3"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
            animation: pathLen > 0 ? "spark-draw 1.4s ease-out forwards" : undefined,
          }}
        />

        {/* Hover guide */}
        {active && (
          <line
            x1={active.x}
            y1={14}
            x2={active.x}
            y2={size.h - 14}
            stroke="#ffffff15"
            strokeDasharray="3 4"
          />
        )}

        {/* Hover point */}
        {active && (
          <g>
            <circle cx={active.x} cy={active.y} r={7} fill="#4ECCA3" opacity={0.18} />
            <circle
              cx={active.x}
              cy={active.y}
              r={3.5}
              fill="#0A0A0F"
              stroke="#4ECCA3"
              strokeWidth={1.6}
            />
          </g>
        )}

        {/* End-point glow (only when no hover) */}
        {d && !active && (
          <g
            className="dot-pulse"
            style={{ transformOrigin: `${lastX}px ${lastY}px` }}
          >
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

      {/* Tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 bg-[#12121A]/95 px-2.5 py-1.5 text-[11px] backdrop-blur"
          style={{
            left: active.x,
            top: active.y - 8,
            whiteSpace: "nowrap",
          }}
        >
          <p className="text-white/55">
            {new Date(active.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
          <p className="amount text-sm text-[#F0EDE8] tabular-nums">
            {eur(active.value)}
          </p>
        </div>
      )}
    </div>
  );
}
