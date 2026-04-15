"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountType, Transaction } from "./types";

const STORAGE_KEY = "trace.transactions.v2";
const ACCOUNT_KEY = "trace.account.v1";

function read(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

function write(txs: Transaction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
}

function seed(): Transaction[] {
  const now = new Date();
  const day = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const demo: Transaction[] = [
    { id: "s1", account: "perso", type: "income", amount: 2850, category: "salary", note: "Paie avril", date: day(2) },
    { id: "s2", account: "perso", type: "expense", amount: 89.5, category: "food", note: "Monoprix", date: day(1) },
    { id: "s3", account: "perso", type: "expense", amount: 32, category: "restaurant", note: "Bouillon Pigalle", date: day(0) },
    { id: "s4", account: "pro", type: "income", amount: 1500, category: "client", note: "Mission Acme", date: day(3) },
    { id: "s5", account: "pro", type: "expense", amount: 19.99, category: "saas", note: "Vercel Pro", date: day(0) },
  ];
  write(demo);
  return demo;
}

export function useAccount() {
  const [account, setAccountState] = useState<AccountType>("perso");
  useEffect(() => {
    const stored = window.localStorage.getItem(ACCOUNT_KEY) as AccountType | null;
    if (stored === "perso" || stored === "pro") setAccountState(stored);
  }, []);
  const setAccount = useCallback((a: AccountType) => {
    setAccountState(a);
    window.localStorage.setItem(ACCOUNT_KEY, a);
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

  const add = useCallback((tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
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
  }, []);

  const remove = useCallback((id: string) => {
    setTxs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setTxs([]);
    write([]);
  }, []);

  return { txs, add, remove, clear, hydrated };
}
