"use client";

import { useMemo } from "react";

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
  label: string;
}

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
) {
  // Guard: near-full circle cannot be drawn as a single arc (large-arc-flag)
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  const s = ((startDeg - 90) * Math.PI) / 180;
  const e = ((endDeg - 90) * Math.PI) / 180;
  const p1 = polar(cx, cy, rOuter, s);
  const p2 = polar(cx, cy, rOuter, e);
  const p3 = polar(cx, cy, rInner, e);
  const p4 = polar(cx, cy, rInner, s);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export function DonutSvg({
  data,
  size = 180,
  thickness = 24,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = rOuter - thickness;
  const gap = 2; // degrees of gap between slices

  const slices = useMemo(() => {
    if (total <= 0) return [] as { path: string; color: string; key: string }[];
    let current = 0;
    return data.map((d) => {
      const portion = d.value / total;
      const sweep = portion * 360;
      // apply gap shortening; never smaller than 0
      const start = current + gap / 2;
      const end = Math.min(current + sweep - gap / 2, 360 - gap / 2);
      current += sweep;
      return {
        key: d.key,
        color: d.color,
        path: arcPath(cx, cy, rOuter, rInner, start, end),
      };
    });
  }, [data, total, cx, cy, rOuter, rInner]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          {slices.map((s) => (
            <radialGradient key={s.key} id={`donut-${s.key}`} cx="50%" cy="50%" r="60%">
              <stop offset="65%" stopColor={s.color} stopOpacity={1} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.55} />
            </radialGradient>
          ))}
        </defs>

        {total <= 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={thickness}
            fill="none"
          />
        ) : (
          slices.map((s, i) => (
            <path
              key={s.key}
              d={s.path}
              fill={`url(#donut-${s.key})`}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animation: `donut-in 700ms ${i * 50}ms cubic-bezier(0.22,1,0.36,1) both`,
              }}
            />
          ))
        )}
      </svg>

      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            {centerLabel && <p className="label">{centerLabel}</p>}
            {centerValue && (
              <p className="amount text-base tabular-nums mt-1">{centerValue}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
