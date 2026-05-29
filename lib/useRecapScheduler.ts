"use client";

import { useEffect } from "react";
import type { Transaction } from "./types";
import {
  buildRecapPayload,
  loadRecapSettings,
  markSent,
  shouldSendToday,
} from "./recap";

export function useRecapScheduler(txs: Transaction[], hydrated: boolean) {
  useEffect(() => {
    if (!hydrated) return;

    const settings = loadRecapSettings();
    if (!settings?.email) return;

    async function trySend(type: "weekly" | "monthly") {
      if (!settings) return;
      if (!shouldSendToday(type)) return;

      const accounts: Array<"perso" | "pro"> = ["perso", "pro"];
      for (const account of accounts) {
        const accountTxs = txs.filter((t) => t.account === account);
        if (accountTxs.length === 0) continue;

        const payload = buildRecapPayload(txs, account, type);
        try {
          await fetch("/api/send-recap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: settings.email, payload }),
          });
        } catch {
          // silent — don't block the app
        }
      }
      markSent(type);
    }

    if (settings.weeklyEnabled) trySend("weekly");
    if (settings.monthlyEnabled) trySend("monthly");
  }, [hydrated, txs]);
}
