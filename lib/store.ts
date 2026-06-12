"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountType, Transaction } from "./types";

const STORAGE_KEY = "trace-finance-v2";
const LEGACY_KEYS = ["trace.transactions.v2", "trace.transactions.v1"];

// Pro account has been removed — everything is a single "perso" wallet now.
function migratePro(list: Transaction[]): Transaction[] {
  return list.map((t) => (t.account === "perso" ? t : { ...t, account: "perso" }));
}

function read(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Transaction[];
      const migrated = migratePro(parsed);
      // Persist the migration once so pro tx don't keep getting normalized
      if (migrated.some((t, i) => t !== parsed[i])) write(migrated);
      return migrated;
    }
    // migrate from legacy keys if any
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) {
            const migrated = migratePro(parsed as Transaction[]);
            write(migrated);
            return migrated;
          }
        } catch {
          // ignore
        }
      }
    }
    return [];
  } catch {
    return [];
  }
}

function write(txs: Transaction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

// Pro removed — the app is now a single "perso" wallet. Kept for API
// compatibility with existing pages.
export function useAccount() {
  const account: AccountType = "perso";
  const setAccount = useCallback((_a: AccountType) => {}, []);
  return { account, setAccount };
}

export function useTransactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTxs(read());
    setHydrated(true);
  }, []);

  const add = useCallback(
    (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
      setTxs((prev) => {
        const next: Transaction[] = [
          {
            ...tx,
            id: crypto.randomUUID(),
            date: tx.date ?? new Date().toISOString(),
          },
          ...prev,
        ];
        write(next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setTxs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      write(next);
      return next;
    });
  }, []);

  const bulkAdd = useCallback(
    (list: Omit<Transaction, "id">[]) => {
      if (list.length === 0) return;
      setTxs((prev) => {
        const toAdd: Transaction[] = list.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
        }));
        const next = [...toAdd, ...prev].sort((a, b) =>
          a.date < b.date ? 1 : -1,
        );
        write(next);
        return next;
      });
    },
    [],
  );

  const mergeById = useCallback((list: Transaction[]) => {
    setTxs((prev) => {
      const existing = new Set(prev.map((t) => t.id));
      const toAdd = list.filter((t) => !existing.has(t.id));
      const next = [...toAdd, ...prev].sort((a, b) =>
        a.date < b.date ? 1 : -1,
      );
      write(next);
      return next;
    });
  }, []);

  const replaceAll = useCallback((list: Transaction[]) => {
    const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
    setTxs(sorted);
    write(sorted);
  }, []);

  const clear = useCallback(() => {
    setTxs([]);
    write([]);
    // Also wipe any leftover legacy keys so nothing "comes back" on reload
    if (typeof window !== "undefined") {
      LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
    }
  }, []);

  return {
    txs,
    add,
    remove,
    bulkAdd,
    mergeById,
    replaceAll,
    clear,
    hydrated,
  };
}
