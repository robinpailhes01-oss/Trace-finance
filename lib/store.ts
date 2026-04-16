"use client";

import { useCallback, useEffect, useState } from "react";
import type { AccountType, Transaction } from "./types";
import { getSupabase } from "./supabase";

const ACCOUNT_KEY = "trace.account.v1";
const LEGACY_KEYS = ["trace-finance-v2", "trace.transactions.v2", "trace.transactions.v1"];

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

interface DbRow {
  id: string;
  user_id: string;
  account: AccountType;
  type: "income" | "expense";
  amount: number | string;
  category: string;
  note: string | null;
  date: string;
}

function fromRow(r: DbRow): Transaction {
  return {
    id: r.id,
    account: r.account,
    type: r.type,
    amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
    category: r.category,
    note: r.note ?? undefined,
    date: r.date,
  };
}

function toInsert(userId: string, t: Omit<Transaction, "id">) {
  return {
    user_id: userId,
    account: t.account,
    type: t.type,
    amount: t.amount,
    category: t.category,
    note: t.note ?? null,
    date: t.date,
  };
}

export function useTransactions() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });
        if (cancelled) return;
        if (error) {
          console.error("[store] load failed", error.message);
          setTxs([]);
        } else {
          setTxs((data ?? []).map((r: DbRow) => fromRow(r)));
        }
      } catch (e) {
        console.error("[store] init failed", e);
        setTxs([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(
    async (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const row = toInsert(user.id, {
        ...tx,
        date: tx.date ?? new Date().toISOString(),
      });
      // optimistic
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: Transaction = {
        id: tempId,
        account: row.account,
        type: row.type,
        amount: row.amount,
        category: row.category,
        note: row.note ?? undefined,
        date: row.date,
      };
      setTxs((prev) => [optimistic, ...prev]);
      const { data, error } = await supabase
        .from("transactions")
        .insert(row)
        .select()
        .single();
      if (error || !data) {
        console.error("[store] insert failed", error?.message);
        setTxs((prev) => prev.filter((t) => t.id !== tempId));
        return;
      }
      const real = fromRow(data as DbRow);
      setTxs((prev) => prev.map((t) => (t.id === tempId ? real : t)));
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    let snapshot: Transaction[] = [];
    setTxs((prev) => {
      snapshot = prev;
      return prev.filter((t) => t.id !== id);
    });
    const supabase = getSupabase();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error("[store] delete failed", error.message);
      setTxs(snapshot);
    }
  }, []);

  const bulkAdd = useCallback(
    async (list: Omit<Transaction, "id">[]) => {
      if (list.length === 0) return;
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = list.map((t) => toInsert(user.id, t));
      const { data, error } = await supabase
        .from("transactions")
        .insert(rows)
        .select();
      if (error) {
        console.error("[store] bulkAdd failed", error.message);
        return;
      }
      const added = (data ?? []).map((r: DbRow) => fromRow(r));
      setTxs((prev) =>
        [...added, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)),
      );
    },
    [],
  );

  const replaceAll = useCallback(
    async (list: Transaction[]) => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: delErr } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", user.id);
      if (delErr) {
        console.error("[store] replace delete failed", delErr.message);
        return;
      }
      if (list.length > 0) {
        const rows = list.map((t) => toInsert(user.id, t));
        const { data, error } = await supabase
          .from("transactions")
          .insert(rows)
          .select();
        if (error) {
          console.error("[store] replace insert failed", error.message);
          setTxs([]);
          return;
        }
        const mapped: Transaction[] = (data ?? []).map((r: DbRow) => fromRow(r));
        mapped.sort((a, b) => (a.date < b.date ? 1 : -1));
        setTxs(mapped);
      } else {
        setTxs([]);
      }
    },
    [],
  );

  const clear = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTxs([]);
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("user_id", user.id);
    if (error) console.error("[store] clear failed", error.message);
  }, []);

  return { txs, add, remove, bulkAdd, replaceAll, clear, hydrated };
}

/**
 * Read any remaining transactions from the legacy localStorage keys.
 * Used by the Settings page to offer a "push local → cloud" migration.
 */
export function readLegacyLocalTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  for (const key of LEGACY_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Transaction[];
      if (parsed && typeof parsed === "object") {
        const perso = parsed.perso?.transactions ?? [];
        const pro = parsed.pro?.transactions ?? [];
        if (Array.isArray(perso) || Array.isArray(pro)) {
          return [...perso, ...pro];
        }
      }
    } catch {
      // ignore bad JSON and continue
    }
  }
  return [];
}

export function clearLegacyLocalTransactions() {
  if (typeof window === "undefined") return;
  LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
}
