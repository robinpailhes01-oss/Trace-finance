"use client";

import { motion } from "framer-motion";
import type { AccountType } from "@/lib/types";

export function AccountSwitcher({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (a: AccountType) => void;
}) {
  return (
    <div className="relative inline-flex items-center gap-1 rounded-full border border-line bg-white/[0.03] p-1 text-xs backdrop-blur">
      {(["perso", "pro"] as AccountType[]).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative z-10 px-3 py-1.5 rounded-full capitalize font-medium transition-colors ${
              active ? "text-bg" : "text-white/55 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="account-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-white/85"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
