"use client";

import type { Transaction } from "./types";

/**
 * Lightweight best-effort sync with Supabase via the REST API.
 * - No SDK, just fetch.
 * - If env vars are missing, every function no-ops so the app keeps
 *   working purely on localStorage.
 * - Nothing throws: failures are swallowed (offline-friendly).
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSyncEnabled(): boolean {
  return Boolean(URL && ANON);
}

function headers(extra?: Record<string, string>) {
  return {
    apikey: ANON as string,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

interface RemoteRow {
  id: string;
  type: "income" | "expense";
  amount: number | string;
  category: string;
  note: string | null;
  date: string;
  account: string | null;
}

function toTx(r: RemoteRow): Transaction {
  return {
    id: r.id,
    type: r.type,
    amount: typeof r.amount === "string" ? parseFloat(r.amount) : r.amount,
    category: r.category,
    note: r.note ?? undefined,
    date: r.date,
    account: (r.account as Transaction["account"]) ?? "perso",
  };
}

/** Pull every remote transaction (returns [] on any failure). */
export async function pullRemote(): Promise<Transaction[]> {
  if (!isSyncEnabled()) return [];
  try {
    const res = await fetch(
      `${URL}/rest/v1/transactions?select=*&order=date.desc`,
      { headers: headers(), cache: "no-store" },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as RemoteRow[];
    return rows.map(toTx);
  } catch {
    return [];
  }
}

/** Upsert one transaction (best effort). */
export async function pushOne(tx: Transaction): Promise<void> {
  if (!isSyncEnabled()) return;
  try {
    await fetch(`${URL}/rest/v1/transactions`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        note: tx.note ?? null,
        date: tx.date,
        account: tx.account ?? "perso",
        source: "app",
      }),
    });
  } catch {
    // ignore
  }
}

/** Upsert many transactions (best effort). */
export async function pushMany(list: Transaction[]): Promise<void> {
  if (!isSyncEnabled() || list.length === 0) return;
  try {
    await fetch(`${URL}/rest/v1/transactions`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify(
        list.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          note: tx.note ?? null,
          date: tx.date,
          account: tx.account ?? "perso",
          source: "app",
        })),
      ),
    });
  } catch {
    // ignore
  }
}

/** Delete one transaction remotely (best effort). */
export async function deleteRemote(id: string): Promise<void> {
  if (!isSyncEnabled()) return;
  try {
    await fetch(`${URL}/rest/v1/transactions?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(),
    });
  } catch {
    // ignore
  }
}
