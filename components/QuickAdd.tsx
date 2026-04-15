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

export interface QuickAddData {
  type: TxType;
  amount: number;
  category: string;
  note?: string;
  date: string;
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
  onSubmit: (data: QuickAddData) => void;
}) {
  const [type, setType] = useState<TxType>(presetType);
  const [amount, setAmount] = useState("0");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));

  // Reset every time the sheet opens — and sync to the requested presetType
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
  const valid = numericAmount > 0 && !!category;

  const submit = () => {
    if (!valid) return;
    const iso = new Date(
      date + "T" + new Date().toTimeString().slice(0, 8),
    ).toISOString();
    onSubmit({
      type,
      amount: numericAmount,
      category,
      note: note.trim() || undefined,
      date: iso,
    });
    onClose();
  };

  const isIncome = type === "income";
  const accent = isIncome ? "#4ECCA3" : "#FF6B6B";
  const accentSoft = isIncome
    ? "rgba(78,204,163,0.15)"
    : "rgba(255,107,107,0.15)";
  const accentBorder = isIncome
    ? "rgba(78,204,163,0.4)"
    : "rgba(255,107,107,0.4)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-xl rounded-t-[28px] sm:bottom-6 sm:rounded-[28px] flex flex-col"
            style={{
              maxHeight: "92vh",
              background: "rgba(18,18,26,0.96)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 -8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Absolute close button — top right */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 h-8 w-8 grid place-items-center rounded-full press z-10"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#FFFFFF",
              }}
            >
              <X size={16} strokeWidth={2.4} />
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-6 sm:px-7 pt-6 pb-3">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

              {/* Toggle Recevoir / Dépenser */}
              <div className="flex justify-center">
                <div
                  className="inline-flex rounded-full p-1 text-xs"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {(["income", "expense"] as TxType[]).map((t) => {
                    const active = type === t;
                    const c = t === "income" ? "#4ECCA3" : "#FF6B6B";
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setCategory("");
                        }}
                        className="relative px-5 py-2 rounded-full transition-colors duration-200"
                        style={{
                          color: active ? "#0A0A0F" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {active && (
                          <motion.span
                            layoutId="quickadd-toggle-pill"
                            className="absolute inset-0 rounded-full"
                            style={{ background: c }}
                            transition={{
                              duration: 0.3,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        )}
                        <span className="relative font-semibold">
                          {t === "income" ? "Recevoir" : "Dépenser"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="mt-7 text-center">
                <p className="label">Montant</p>
                <motion.p
                  key={type}
                  initial={{ opacity: 0.6, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="amount mt-3 text-6xl sm:text-7xl tabular-nums"
                  style={{
                    color: accent,
                    textShadow: `0 0 32px ${
                      isIncome
                        ? "rgba(78,204,163,0.35)"
                        : "rgba(255,107,107,0.3)"
                    }`,
                  }}
                >
                  {isIncome ? "+" : "−"}
                  {amount} €
                </motion.p>
              </div>

              {/* Categories */}
              <div className="mt-7">
                <p className="label mb-2">Catégorie</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {cats.map((c) => {
                    const active = category === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className="press shrink-0 rounded-full px-4 py-2 text-sm transition duration-200"
                        style={{
                          background: active ? accent : "rgba(255,255,255,0.04)",
                          color: active ? "#0A0A0F" : "#F0EDE8",
                          border: `1px solid ${
                            active ? accent : "rgba(255,255,255,0.08)"
                          }`,
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <span className="mr-1.5">{c.emoji}</span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note + date */}
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Description (optionnel)"
                  className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm placeholder:text-white/40 text-[#F0EDE8] focus:outline-none focus:border-white/25"
                />
                <label className="relative press">
                  <span className="sr-only">Date</span>
                  <div className="h-full inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-3 text-sm cursor-pointer text-[#F0EDE8]">
                    <Calendar
                      size={15}
                      className="text-white/55"
                      strokeWidth={1.8}
                    />
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
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => press(k)}
                      className="press rounded-2xl py-4 text-xl font-medium text-[#F0EDE8]"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {k === "back" ? (
                        <Delete
                          size={17}
                          className="mx-auto text-white/55"
                        />
                      ) : (
                        k
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Sticky submit area — always visible above safe-area */}
            <div
              className="px-6 sm:px-7 pt-3"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background:
                  "linear-gradient(180deg, rgba(18,18,26,0) 0%, rgba(18,18,26,0.9) 30%, rgba(18,18,26,0.96) 100%)",
              }}
            >
              <button
                type="button"
                onClick={submit}
                disabled={!valid}
                className="press w-full rounded-full py-4 text-sm font-bold inline-flex items-center justify-center gap-2 transition duration-200"
                style={{
                  background: valid ? accent : "rgba(255,255,255,0.06)",
                  color: valid ? "#0A0A0F" : "rgba(255,255,255,0.4)",
                  opacity: valid ? 1 : 0.4,
                  border: valid
                    ? `1px solid ${accentBorder}`
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: valid
                    ? `0 8px 28px -6px ${
                        isIncome
                          ? "rgba(78,204,163,0.55)"
                          : "rgba(255,107,107,0.5)"
                      }`
                    : "none",
                  cursor: valid ? "pointer" : "not-allowed",
                }}
              >
                <Check size={16} strokeWidth={3} />
                {isIncome ? "Ajouter le revenu" : "Ajouter la dépense"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
