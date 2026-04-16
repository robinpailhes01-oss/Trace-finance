"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountType, Transaction } from "./types";

const STORAGE_KEY = "trace-finance-v2";
const LEGACY_KEYS = ["trace.transactions.v2", "trace.transactions.v1"];
const ACCOUNT_KEY = "trace.account.v1";

function read(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Transaction[];
    // migrate from legacy keys if any
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) {
            write(parsed as Transaction[]);
            return parsed as Transaction[];
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

export function useAccount() {
  const [account, setAccountState] = useState<AccountType>("perso");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACCOUNT_KEY) as AccountType | null;
    if (stored === "perso" || stored === "pro") setAccountState(stored);
  }, []);
  const setAccount = useCallback((a: AccountType) => {
    setAccountState(a);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCOUNT_KEY, a);
    }
  }, []);
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
