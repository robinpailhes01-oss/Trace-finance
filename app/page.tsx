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
    <main className="mx-auto max-w-xl px-5 pb-40 pt-8 sm:pt-12">
      <Header account={account} onAccountChange={setAccount} />

      <BalanceCard
        balance={hydrated ? balance : 0}
        income={hydrated ? income : 0}
        expense={hydrated ? expense : 0}
        onAddIncome={() => openAdd("income")}
        onAddExpense={() => openAdd("expense")}
      />

      <div className="mt-6">
        <TrendChart txs={filtered} />
      </div>

      <div className="mt-6">
        <CategoryBreakdown txs={filtered} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-[0.22em] text-muted">
            Transactions récentes
          </h3>
          <Link
            href="/history"
            className="text-xs text-muted inline-flex items-center gap-1 hover:text-cream press"
          >
            Tout voir <ArrowRight size={11} />
          </Link>
        </div>
        <TransactionList txs={filtered.slice(0, 6)} onRemove={remove} />
      </section>

      {/* FAB — sober pill */}
      <button
        onClick={() => openAdd("expense")}
        className="press fixed bottom-24 right-5 z-30 h-13 w-13 rounded-full bg-cream text-bg grid place-items-center shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        style={{ height: 52, width: 52 }}
        aria-label="Ajouter une transaction"
      >
        <Plus size={22} strokeWidth={2.2} />
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
