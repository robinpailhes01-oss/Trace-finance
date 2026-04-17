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
  const accent = isIncome ? "#7B9B75" : "#C47A6B";
  const accentBorder = isIncome
    ? "rgba(123,155,117,0.4)"
    : "rgba(196,122,107,0.4)";

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
              maxHeight: "94vh",
              background: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close */}
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

            {/* Scrollable top: toggle, amount, categories, date, note */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-2">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />

              {/* Toggle */}
              <div className="flex justify-center">
                <div
                  className="inline-flex rounded-full p-0.5 text-xs"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {(["income", "expense"] as TxType[]).map((t) => {
                    const active = type === t;
                    const c = t === "income" ? "#7B9B75" : "#C47A6B";
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setCategory("");
                        }}
                        className="relative px-4 py-1.5 rounded-full transition-colors duration-200"
                        style={{
                          color: active ? "#F5EBDD" : "rgba(255,255,255,0.55)",
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
              <div className="mt-3 text-center">
                <motion.p
                  key={type}
                  initial={{ opacity: 0.6, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="amount text-5xl tabular-nums"
                  style={{ color: accent }}
                >
                  {isIncome ? "+" : "−"}
                  {amount} €
                </motion.p>
              </div>

              {/* Categories */}
              <div className="mt-3">
                <p className="label mb-1.5">Catégorie</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1">
                  {cats.map((c) => {
                    const active = category === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className="press shrink-0 rounded-full px-3 py-1.5 text-xs transition duration-200"
                        style={{
                          background: active
                            ? accent
                            : "rgba(255,255,255,0.04)",
                          color: active ? "#F5EBDD" : "#F0EDE8",
                          border: `1px solid ${
                            active ? accent : "rgba(255,255,255,0.08)"
                          }`,
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <span className="mr-1">{c.emoji}</span>
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date + Note — compact row */}
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Description"
                  className="rounded-xl bg-white/65 border border-[#3D2F1F]/10 px-3 py-2 text-xs placeholder:text-[#3D2F1F]/45 text-[#3D2F1F] focus:outline-none"
                />
                <label className="relative press">
                  <div className="h-full inline-flex items-center gap-1.5 rounded-xl bg-white/70 border border-[#3D2F1F]/12 px-2.5 py-2 text-xs cursor-pointer text-[#3D2F1F]">
                    <Calendar size={12} className="text-[#3D2F1F]/60" />
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
            </div>

            {/* Fixed bottom: keypad + validate */}
            <div
              className="shrink-0 px-5"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
              }}
            >
              <div className="grid grid-cols-3 gap-1 mb-2">
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  ".",
                  "0",
                  "back",
                ].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => press(k)}
                    className="press rounded-xl py-2.5 text-lg font-semibold active:scale-95 transition-transform"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#F0EDE8",
                    }}
                  >
                    {k === "back" ? (
                      <Delete
                        size={16}
                        className="mx-auto text-[#F0EDE8]/70"
                      />
                    ) : (
                      k
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={!valid}
                className="press w-full rounded-full py-3 text-sm font-bold inline-flex items-center justify-center gap-2 transition duration-200"
                style={{
                  background: valid ? accent : "rgba(255,255,255,0.06)",
                  color: valid ? "#F5EBDD" : "rgba(255,255,255,0.4)",
                  opacity: valid ? 1 : 0.4,
                  border: valid
                    ? `1px solid ${accentBorder}`
                    : "1px solid rgba(255,255,255,0.08)",
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
