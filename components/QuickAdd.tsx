"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { X, Check, Delete, Calendar } from "lucide-react";
import { type AccountType, type TxType, getCategories } from "@/lib/types";

function toLocalDateInput(d: Date) {
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

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
    date: string;
  }) => void;
}) {
  const [type, setType] = useState<TxType>(presetType);
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));

  useEffect(() => {
    if (open) {
      setType(presetType);
      setAmount("0");
      setCategory("");
      setNote("");
      setDate(toLocalDateInput(new Date()));
    }
  }, [open, presetType]);

  const cats = useMemo(
    () => getCategories(account).filter((c) => c.type === type),
    [account, type],
  );

  useEffect(() => {
    if (!category && cats[0]) setCategory(cats[0].key);
  }, [cats, category]);

  const press = (k: string) => {
    setAmount((prev) => {
      if (k === "back") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (k === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return k;
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      return prev + k;
    });
  };

  const numericAmount = parseFloat(amount || "0") || 0;
  const valid = numericAmount > 0 && category;

  const submit = () => {
    if (!valid) return;
    const iso = new Date(date + "T" + new Date().toTimeString().slice(0, 8)).toISOString();
    onSubmit({
      type,
      amount: numericAmount,
      category,
      note: note.trim() || undefined,
      date: iso,
    });
    onClose();
  };

  const toneText = type === "income" ? "text-positive" : "text-negative";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-[28px] border-t border-line bg-bg-elevated p-5 sm:p-6 sm:bottom-6 sm:rounded-[28px] sm:border max-h-[95vh] overflow-y-auto shadow-2xl shadow-black/60"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />

            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full border border-line bg-white/[0.03] p-1 text-sm">
                {(["expense", "income"] as TxType[]).map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setCategory("");
                      }}
                      className={`relative px-4 py-1.5 rounded-full transition-colors ${
                        active ? "text-bg" : "text-white/55"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="quickadd-pill"
                          className={`absolute inset-0 rounded-full ${
                            t === "income" ? "bg-accent-green" : "bg-white"
                          }`}
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative font-semibold">
                        {t === "income" ? "Revenu" : "Dépense"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-white/5 border border-line grid place-items-center hover:bg-white/10 press"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount big */}
            <div className="mt-7 text-center">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Montant
              </p>
              <p className={`amount mt-2 text-6xl sm:text-7xl tabular-nums ${toneText}`}>
                {type === "income" ? "+" : "−"}
                {amount} €
              </p>
            </div>

            {/* Categories */}
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/45 mb-2">
                Catégorie
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {cats.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`press shrink-0 rounded-full px-4 py-2 text-sm border transition ${
                        active
                          ? "bg-white text-bg border-white"
                          : "bg-white/[0.04] border-line hover:bg-white/10"
                      }`}
                    >
                      <span className="mr-1.5">{c.emoji}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note + Date */}
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Description (optionnel)"
                className="rounded-2xl bg-white/[0.04] border border-line px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
              <label className="relative press">
                <span className="sr-only">Date</span>
                <div className="h-full inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-line px-3 py-3 text-sm cursor-pointer">
                  <Calendar size={16} className="text-white/60" />
                  <span className="tabular-nums">
                    {new Date(date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>

            {/* Keypad */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => (
                <button
                  key={k}
                  onClick={() => press(k)}
                  className="press rounded-2xl bg-white/[0.04] border border-line py-4 text-lg font-medium hover:bg-white/[0.08]"
                >
                  {k === "back" ? <Delete size={18} className="mx-auto" /> : k}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={!valid}
              className={`press mt-5 w-full rounded-full py-4 font-semibold inline-flex items-center justify-center gap-2 transition ${
                valid
                  ? type === "income"
                    ? "btn-green"
                    : "btn-red"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
            >
              <Check size={18} strokeWidth={3} />
              Ajouter
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
