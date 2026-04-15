"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickAdd } from "@/components/QuickAdd";
import { TransactionList } from "@/components/TransactionList";
import { TrendChart } from "@/components/TrendChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { useAccount, useTransactions } from "@/lib/store";
import type { TxType } from "@/lib/types";

export default function HomePage() {
  const { account, setAccount } = useAccount();
  const { txs, add, remove, hydrated } = useTransactions();

  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<TxType>("expense");

  const filtered = useMemo(
    () => txs.filter((t) => t.account === account),
    [txs, account],
  );

  const { income, expense, balance } = useMemo(() => {
    let i = 0;
    let e = 0;
    filtered.forEach((t) => {
      if (t.type === "income") i += t.amount;
      else e += t.amount;
    });
    return { income: i, expense: e, balance: i - e };
  }, [filtered]);

  const openAdd = (t: TxType) => {
    setPresetType(t);
    setOpen(true);
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-40 pt-8 sm:pt-12">
      <Header account={account} onAccountChange={setAccount} />

      <div className="mt-6">
        <BalanceCard
          balance={hydrated ? balance : 0}
          income={hydrated ? income : 0}
          expense={hydrated ? expense : 0}
          onAddIncome={() => openAdd("income")}
          onAddExpense={() => openAdd("expense")}
        />
      </div>

      <div className="mt-5">
        <TrendChart txs={filtered} />
      </div>

      <div className="mt-5">
        <CategoryBreakdown txs={filtered} />
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/80">
            Transactions récentes
          </h3>
          <Link
            href="/history"
            className="text-xs text-white/60 inline-flex items-center gap-1 hover:text-white press"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>
        <TransactionList txs={filtered.slice(0, 6)} onRemove={remove} />
      </section>

      {/* Floating add button — gold gradient */}
      <button
        onClick={() => openAdd("expense")}
        className="btn-gold press fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full grid place-items-center"
        aria-label="Ajouter une transaction"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      <QuickAdd
        open={open}
        onClose={() => setOpen(false)}
        account={account}
        presetType={presetType}
        onSubmit={(data) => add({ ...data, account })}
      />
    </main>
  );
}
