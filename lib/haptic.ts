"use client";

export function haptic(pattern: number | number[] = 10) {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & {
    vibrate?: (p: number | number[]) => boolean;
  };
  if (typeof nav.vibrate === "function") {
    try {
      nav.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
