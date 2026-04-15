"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Plus } from "lucide-react";
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
    <main className="mx-auto max-w-xl px-4 pb-40 pt-8 sm:pt-12">
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
          <h3 className="text-sm font-medium text-white/80">
            Transactions récentes
          </h3>
          <Link
            href="/history"
            className="text-xs text-white/60 inline-flex items-center gap-1 hover:text-white"
          >
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>
        <TransactionList txs={filtered.slice(0, 6)} onRemove={remove} />
      </section>

      {/* Floating add — offset so it sits above the bottom nav */}
      <button
        onClick={() => openAdd("expense")}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-white text-black grid place-items-center shadow-2xl shadow-black/40 hover:scale-[1.05] active:scale-95 transition"
        aria-label="Ajouter une transaction"
      >
        <Plus size={22} />
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
