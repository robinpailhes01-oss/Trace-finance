"use client";

import { useMemo, useState } from "react";
import { Sparkles, Settings2 } from "lucide-react";
import { AccountSwitcher } from "@/components/AccountSwitcher";
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
    <main className="mx-auto max-w-xl px-4 pb-32 pt-8 sm:pt-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-accent-gold to-accent-green/60 grid place-items-center text-black">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs text-white/50">Bonjour 👋</p>
            <h2 className="font-semibold leading-tight">Trace Finance</h2>
          </div>
        </div>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* Balance */}
      <div className="mt-6">
        <BalanceCard
          balance={hydrated ? balance : 0}
          income={hydrated ? income : 0}
          expense={hydrated ? expense : 0}
          onAddIncome={() => openAdd("income")}
          onAddExpense={() => openAdd("expense")}
        />
      </div>

      {/* Chart */}
      <div className="mt-5">
        <TrendChart txs={filtered} />
      </div>

      {/* Top categories */}
      <div className="mt-5">
        <CategoryBreakdown txs={filtered} />
      </div>

      {/* Transactions */}
      <section className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/80">Transactions récentes</h3>
          <button className="text-xs text-white/40 inline-flex items-center gap-1 hover:text-white/70">
            <Settings2 size={12} /> Tout voir
          </button>
        </div>
        <TransactionList txs={filtered.slice(0, 12)} onRemove={remove} />
      </section>

      {/* Floating add */}
      <button
        onClick={() => openAdd("expense")}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3.5 font-medium shadow-2xl shadow-black/40 hover:scale-[1.02] active:scale-95 transition"
      >
        <span className="text-xl leading-none">+</span> Ajouter
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
