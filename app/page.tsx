"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickAdd } from "@/components/QuickAdd";
import { TransactionList } from "@/components/TransactionList";
import { TrendChart } from "@/components/TrendChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { Toast } from "@/components/Toast";
import { useAccount, useTransactions } from "@/lib/store";
import { eur } from "@/lib/format";
import { computeTotals, type TxType } from "@/lib/types";
import { useRecapScheduler } from "@/lib/useRecapScheduler";

const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HomePage() {
  const { account } = useAccount();
  const { txs, add, remove, hydrated } = useTransactions();
  useRecapScheduler(txs, hydrated);

  const [open, setOpen] = useState(false);
  const [presetType, setPresetType] = useState<TxType>("expense");

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "green" | "red";
  }>({ open: false, message: "", tone: "green" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, tone: "green" | "red") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ open: true, message, tone });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, open: false })),
      1800,
    );
  };

  const filtered = useMemo(
    () => txs.filter((t) => t.account === account),
    [txs, account],
  );

  // This month's transactions + totals (the headline at-a-glance view)
  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const monthTxs = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return filtered.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [filtered]);

  const month = useMemo(() => computeTotals(monthTxs), [monthTxs]);

  // Total balance / patrimoine across all transactions
  const patrimoine = useMemo(() => {
    const all = computeTotals(filtered);
    return {
      total: all.balance + all.transfers,
      available: all.balance,
      invested: all.transfers,
    };
  }, [filtered]);

  const openAdd = (t: TxType) => {
    setPresetType(t);
    setOpen(true);
  };

  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-8 sm:pt-12">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Header />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
        }}
      >
        <motion.div variants={fadeUp} className="mt-6">
          <BalanceCard
            title={`Solde · ${monthLabel}`}
            balance={hydrated ? month.balance : 0}
            income={hydrated ? month.income : 0}
            expense={hydrated ? month.expense : 0}
            transfers={hydrated ? month.transfers : 0}
            onAddIncome={() => openAdd("income")}
            onAddExpense={() => openAdd("expense")}
          />
        </motion.div>

        {/* Patrimoine total */}
        {hydrated && (
          <motion.div variants={fadeUp} className="mt-5 card-lg p-5">
            <div className="flex items-center justify-between">
              <p className="label">Patrimoine total</p>
              <p className="amount text-2xl tabular-nums">
                {eur(patrimoine.total)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#3D2F1F]/8 bg-white/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#3D2F1F]/50">Disponible</p>
                <p className="amount mt-1 text-lg tabular-nums" style={{ color: "#5F7D5A" }}>
                  {eur(patrimoine.available)}
                </p>
              </div>
              <div className="rounded-xl border border-[#3D2F1F]/8 bg-white/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#3D2F1F]/50">Épargne / Invest</p>
                <p className="amount mt-1 text-lg tabular-nums" style={{ color: "#B89855" }}>
                  {eur(patrimoine.invested)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="mt-5">
          <TrendChart txs={filtered} />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6">
          <CategoryBreakdown txs={filtered} />
        </motion.div>

        <motion.section variants={fadeUp} className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="label">Transactions récentes</h3>
            <Link
              href="/history"
              className="text-xs text-[#3D2F1F]/55 inline-flex items-center gap-1 hover:text-[#3D2F1F] press"
            >
              Tout voir <ArrowRight size={11} />
            </Link>
          </div>
          <TransactionList txs={filtered.slice(0, 6)} onRemove={remove} />
        </motion.section>
      </motion.div>

      <QuickAdd
        open={open}
        onClose={() => setOpen(false)}
        account={account}
        presetType={presetType}
        onSubmit={(data) => {
          add({ ...data, account });
          showToast(
            data.type === "income"
              ? "Revenu ajouté ✓"
              : "Dépense ajoutée ✓",
            data.type === "income" ? "green" : "red",
          );
        }}
      />

      <Toast open={toast.open} message={toast.message} tone={toast.tone} />
    </main>
  );
}
