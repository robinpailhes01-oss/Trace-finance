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
    <div className="relative inline-flex glass rounded-full p-1 text-sm">
      {(["perso", "pro"] as AccountType[]).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative z-10 px-4 py-1.5 rounded-full transition-colors ${
              active ? "text-black" : "text-white/60 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId="account-pill"
                className="absolute inset-0 bg-white rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 capitalize font-medium">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
