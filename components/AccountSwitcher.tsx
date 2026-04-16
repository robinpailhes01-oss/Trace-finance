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
    <div className="relative inline-flex items-center rounded-full border border-[#3D2F1F]/10 bg-white/55 p-0.5 text-xs backdrop-blur">
      {(["perso", "pro"] as AccountType[]).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative z-10 px-3 py-1.5 rounded-full capitalize font-medium transition-colors duration-200 ${
              active ? "text-[#F5EBDD]" : "text-[#3D2F1F]/55 hover:text-[#3D2F1F]"
            }`}
          >
            {active && (
              <motion.span
                layoutId="account-pill"
                className="absolute inset-0 rounded-full bg-[#3D2F1F]"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
