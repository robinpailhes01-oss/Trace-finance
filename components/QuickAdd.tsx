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

  const toneText = type === "income" ? "text-positive" : "text-cream";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-[28px] glass p-6 sm:p-7 sm:bottom-6 sm:rounded-[28px] max-h-[95vh] overflow-y-auto"
            style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.6)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full border border-white/10 p-0.5 text-xs">
                {(["expense", "income"] as TxType[]).map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setCategory("");
                      }}
                      className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 ${
                        active ? "text-bg" : "text-muted"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="quickadd-pill"
                          className="absolute inset-0 rounded-full bg-cream"
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )}
                      <span className="relative font-medium">
                        {t === "income" ? "Revenu" : "Dépense"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full hairline-strong grid place-items-center hover:bg-white/[0.03] press text-muted"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted">
                Montant
              </p>
              <p className={`amount mt-4 text-6xl sm:text-7xl tabular-nums ${toneText}`}>
                {type === "income" ? "+" : "−"}
                {amount} €
              </p>
            </div>

            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted mb-3">
                Catégorie
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {cats.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`press shrink-0 rounded-full px-4 py-2 text-sm border transition duration-200 ${
                        active
                          ? "bg-cream text-bg border-cream"
                          : "border-line-strong text-cream hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="mr-1.5">{c.emoji}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Description (optionnel)"
                className="rounded-2xl bg-transparent hairline-strong px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-cream/40"
              />
              <label className="relative press">
                <span className="sr-only">Date</span>
                <div className="h-full inline-flex items-center gap-2 rounded-2xl hairline-strong px-3 py-3 text-sm cursor-pointer">
                  <Calendar size={15} className="text-muted" strokeWidth={1.8} />
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

            <div className="mt-5 grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => (
                <button
                  key={k}
                  onClick={() => press(k)}
                  className="press rounded-2xl hairline py-4 text-xl font-medium text-cream hover:bg-white/[0.025]"
                >
                  {k === "back" ? <Delete size={17} className="mx-auto text-muted" /> : k}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={!valid}
              className={`press mt-5 w-full rounded-full py-4 text-sm font-medium inline-flex items-center justify-center gap-2 transition duration-200 ${
                valid
                  ? "bg-cream text-bg"
                  : "hairline-strong text-muted cursor-not-allowed"
              }`}
            >
              <Check size={16} strokeWidth={2.5} />
              Ajouter
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
