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
    <div className="relative inline-flex items-center rounded-full hairline-strong p-0.5 text-xs">
      {(["perso", "pro"] as AccountType[]).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative z-10 px-3 py-1.5 rounded-full capitalize font-medium transition-colors duration-200 ${
              active ? "text-bg" : "text-muted hover:text-cream"
            }`}
          >
            {active && (
              <motion.span
                layoutId="account-pill"
                className="absolute inset-0 rounded-full bg-cream"
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
