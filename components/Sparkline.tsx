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

  const { d, meta, lastX, lastY } = useMemo(() => {
    const w = size.w;
    const h = size.h;
    const padX = 10;
    const padY = 16;
    if (points.length === 0) {
      return { d: "", meta: [] as PointMeta[], lastX: 0, lastY: 0 };
    }
    const min = Math.min(...points.map((p) => p.value));
    const max = Math.max(...points.map((p) => p.value));
    const span = max - min || 1;
    const stepX = (w - padX * 2) / Math.max(1, points.length - 1);
    const toY = (v: number) => padY + (1 - (v - min) / span) * (h - padY * 2);

    // Smooth cubic via Catmull-Rom to Bezier conversion
    const pts = points.map((p, i) => ({
      x: padX + i * stepX,
      y: toY(p.value),
    }));
    let path = "";
    pts.forEach((p, i) => {
      if (i === 0) {
        path += `M${p.x.toFixed(2)},${p.y.toFixed(2)}`;
        return;
      }
      const p0 = pts[i - 2] ?? pts[i - 1];
      const p1 = pts[i - 1];
      const p2 = p;
      const p3 = pts[i + 1] ?? p;
      const tension = 0.18;
      const c1x = p1.x + (p2.x - p0.x) * tension;
      const c1y = p1.y + (p2.y - p0.y) * tension;
      const c2x = p2.x - (p3.x - p1.x) * tension;
      const c2y = p2.y - (p3.y - p1.y) * tension;
      path += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(
        2,
      )},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    });

    const metaArr: PointMeta[] = pts.map((p, i) => ({
      x: p.x,
      y: p.y,
      date: points[i].date,
      value: points[i].value,
    }));

    return {
      d: path,
      meta: metaArr,
      lastX: metaArr[metaArr.length - 1].x,
      lastY: metaArr[metaArr.length - 1].y,
    };
  }, [points, size]);

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
            <stop offset="0%" stopColor="#4ECCA3" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4ECCA3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {d && (
          <path
            d={`${d} L${lastX},${size.h} L10,${size.h} Z`}
            fill="url(#spark-fill)"
          />
        )}

        {/* Line draw */}
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="#4ECCA3"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLen || undefined,
            strokeDashoffset: pathLen || undefined,
            animation: pathLen > 0 ? "spark-draw 1.5s ease-out forwards" : undefined,
          }}
        />

        {/* Hover guide */}
        {active && (
          <line
            x1={active.x}
            y1={16}
            x2={active.x}
            y2={size.h - 16}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="3 4"
          />
        )}

        {/* Hover point */}
        {active && (
          <g>
            <circle cx={active.x} cy={active.y} r={9} fill="#4ECCA3" opacity={0.22} />
            <circle
              cx={active.x}
              cy={active.y}
              r={4}
              fill="#FFFFFF"
              stroke="#4ECCA3"
              strokeWidth={1.6}
            />
          </g>
        )}

        {/* End point: 6px white center + 12px teal ring pulse */}
        {d && !active && (
          <g>
            <circle
              cx={lastX}
              cy={lastY}
              r={12}
              fill="rgba(78,204,163,0.3)"
              className="dot-ring"
            />
            <circle cx={lastX} cy={lastY} r={6} fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Glass tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl glass px-3 py-2 text-[11px]"
          style={{
            left: active.x,
            top: active.y - 10,
            whiteSpace: "nowrap",
          }}
        >
          <p className="text-white/55">
            {new Date(active.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="amount text-base text-[#F0EDE8] tabular-nums">
            {eur(active.value)}
          </p>
        </div>
      )}
    </div>
  );
}
