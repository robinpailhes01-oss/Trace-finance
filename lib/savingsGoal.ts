"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "trace.savings-goal.v1";

export function useSavingsGoal() {
  const [goal, setGoalState] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setGoalState(parseFloat(raw) || 0);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const setGoal = useCallback((v: number) => {
    setGoalState(v);
    try {
      window.localStorage.setItem(KEY, String(v));
    } catch {
      // ignore
    }
  }, []);

  return { goal, setGoal, hydrated };
}
