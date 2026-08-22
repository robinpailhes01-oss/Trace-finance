"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountType, Transaction } from "./types";
import {
  isSyncEnabled,
  pullRemote,
  pushOne,
  pushMany,
  deleteRemote,
} from "./supabaseSync";

const STORAGE_KEY = "trace-finance-v2";
const DELETED_KEY = "trace-finance-deleted";
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
      if (migrated.some((t, i) => t !== parsed[i])) write(migrated);
      return migrated;
    }
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

function readDeleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeDeleted(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
}

function sortTx(list: Transaction[]) {
  return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function useAccount() {
  const account: AccountType = "perso";
  const setAccount = useCallback((_a: AccountType) => {}, []);
  return { account, setAccount };
}

export function useTransactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const txsRef = useRef<Transaction[]>([]);
  txsRef.current = txs;

  // Reconcile local + remote (bot additions), respecting local deletions.
  const sync = useCallback(async () => {
    if (!isSyncEnabled()) return;
    const remote = await pullRemote();
    const deleted = readDeleted();
    const local = txsRef.current;
    const localById = new Map(local.map((t) => [t.id, t]));
    const remoteById = new Map(
      remote.filter((t) => !deleted.has(t.id)).map((t) => [t.id, t]),
    );

    // Union: everything local + remote (remote wins on shared id), minus deleted
    const merged = new Map<string, Transaction>();
    for (const t of local) if (!deleted.has(t.id)) merged.set(t.id, t);
    for (const [id, t] of remoteById) merged.set(id, t);

    const next = sortTx([...merged.values()]);
    // Only update state if something actually changed
    const changed =
      next.length !== local.length ||
      next.some((t, i) => t.id !== local[i]?.id);
    if (changed) {
      setTxs(next);
      write(next);
    }

    // Push local-only transactions up so the bot / other devices see them
    const localOnly = local.filter(
      (t) => !remoteById.has(t.id) && !deleted.has(t.id),
    );
    if (localOnly.length) pushMany(localOnly);
  }, []);

  useEffect(() => {
    const initial = read();
    setTxs(initial);
    setHydrated(true);
    // First reconciliation with the cloud
    sync();
    // Poll for bot-added transactions while the app is open
    const iv = setInterval(sync, 20000);
    // Also sync when the tab regains focus
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = useCallback(
    (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
      const full: Transaction = {
        ...(tx as Omit<Transaction, "id" | "date">),
        id: crypto.randomUUID(),
        date: tx.date ?? new Date().toISOString(),
      };
      setTxs((prev) => {
        const next = [full, ...prev];
        write(next);
        return next;
      });
      pushOne(full);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setTxs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      write(next);
      return next;
    });
    const deleted = readDeleted();
    deleted.add(id);
    writeDeleted(deleted);
    deleteRemote(id);
  }, []);

  const bulkAdd = useCallback((list: Omit<Transaction, "id">[]) => {
    if (list.length === 0) return;
    const toAdd: Transaction[] = list.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
    }));
    setTxs((prev) => {
      const next = sortTx([...toAdd, ...prev]);
      write(next);
      return next;
    });
    pushMany(toAdd);
  }, []);

  const mergeById = useCallback((list: Transaction[]) => {
    setTxs((prev) => {
      const existing = new Set(prev.map((t) => t.id));
      const toAdd = list.filter((t) => !existing.has(t.id));
      const next = sortTx([...toAdd, ...prev]);
      write(next);
      pushMany(toAdd);
      return next;
    });
  }, []);

  const replaceAll = useCallback((list: Transaction[]) => {
    const sorted = sortTx(list);
    setTxs(sorted);
    write(sorted);
    pushMany(sorted);
  }, []);

  const clear = useCallback(() => {
    const current = txsRef.current;
    setTxs([]);
    write([]);
    if (typeof window !== "undefined") {
      LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
    }
    // Mark all as deleted and remove them remotely
    const deleted = readDeleted();
    current.forEach((t) => deleted.add(t.id));
    writeDeleted(deleted);
    current.forEach((t) => deleteRemote(t.id));
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
