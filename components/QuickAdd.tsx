"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { X, Check, Delete } from "lucide-react";
import {
  type AccountType,
  type TxType,
  getCategories,
} from "@/lib/types";

export function QuickAdd({
  open,
  onClose,
  account,
  presetType,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  account: AccountType;
  presetType: TxType;
  onSubmit: (data: {
    type: TxType;
    amount: number;
    category: string;
    note?: string;
  }) => void;
}) {
  const [type, setType] = useState<TxType>(presetType);
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setType(presetType);
      setAmount("0");
      setCategory("");
      setNote("");
    }
  }, [open, presetType]);

  const cats = useMemo(
    () => getCategories(account).filter((c) => c.type === type),
    [account, type],
  );

  // Auto-pick first category if none selected
  useEffect(() => {
    if (!category && cats[0]) setCategory(cats[0].key);
  }, [cats, category]);

  const press = (k: string) => {
    setAmount((prev) => {
      if (k === "back") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (k === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return k;
      // Limit decimals to 2
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      return prev + k;
    });
  };

  const numericAmount = parseFloat(amount || "0") || 0;
  const valid = numericAmount > 0 && category;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      type,
      amount: numericAmount,
      category,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-3xl border-t border-white/10 bg-bg-elevated p-5 sm:p-6 sm:bottom-6 sm:rounded-3xl sm:border"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="inline-flex glass rounded-full p-1 text-sm">
                {(["expense", "income"] as TxType[]).map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setCategory("");
                      }}
                      className={`relative px-3.5 py-1.5 rounded-full transition-colors ${
                        active ? "text-black" : "text-white/60"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="quickadd-pill"
                          className={`absolute inset-0 rounded-full ${
                            t === "income" ? "bg-accent-green" : "bg-white"
                          }`}
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative">
                        {t === "income" ? "Revenu" : "Dépense"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-white/5 grid place-items-center hover:bg-white/10"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount display */}
            <div className="mt-6 text-center">
              <p className="text-xs uppercase tracking-widest text-white/40">
                Montant
              </p>
              <p
                className={`mt-2 text-5xl font-semibold tabular-nums ${
                  type === "income" ? "text-accent-green" : "text-white"
                }`}
              >
                {type === "income" ? "+" : "−"}
                {amount} €
              </p>
            </div>

            {/* Categories */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">
                Catégorie
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                {cats.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`shrink-0 rounded-full px-3.5 py-2 text-sm border transition ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1.5">{c.emoji}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optionnel)"
              className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />

            {/* Keypad */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
                (k) => (
                  <button
                    key={k}
                    onClick={() => press(k)}
                    className="rounded-2xl bg-white/[0.04] border border-white/5 py-3.5 text-lg font-medium hover:bg-white/[0.08] active:scale-95 transition"
                  >
                    {k === "back" ? <Delete size={18} className="mx-auto" /> : k}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={submit}
              disabled={!valid}
              className={`mt-4 w-full rounded-full py-4 font-medium inline-flex items-center justify-center gap-2 transition ${
                valid
                  ? type === "income"
                    ? "bg-accent-green text-black hover:brightness-110"
                    : "bg-white text-black hover:brightness-110"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              <Check size={18} />
              Ajouter
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
