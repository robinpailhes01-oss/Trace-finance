"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export function useSavingsGoal() {
  const [goal, setGoalState] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setHydrated(true);
          return;
        }
        const { data, error } = await supabase
          .from("savings_goals")
          .select("amount")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data) {
          const raw = data.amount as number | string;
          const n = typeof raw === "string" ? parseFloat(raw) : raw;
          setGoalState(isFinite(n) ? n : 0);
        }
      } catch (e) {
        console.error("[savings-goal] load failed", e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setGoal = useCallback(async (v: number) => {
    setGoalState(v);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("savings_goals").upsert(
        {
          user_id: user.id,
          amount: v,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.error("[savings-goal] save failed", e);
    }
  }, []);

  return { goal, setGoal, hydrated };
}
