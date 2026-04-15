"use client";

import { Bell, Sparkles } from "lucide-react";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import type { AccountType } from "@/lib/types";

export function Header({
  name = "Robin",
  account,
  onAccountChange,
}: {
  name?: string;
  account: AccountType;
  onAccountChange: (a: AccountType) => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-11 w-11 rounded-full grid place-items-center text-white shrink-0"
          style={{
            background: "linear-gradient(135deg, #4ECCA3 0%, #2A9D8F 100%)",
            boxShadow:
              "0 8px 22px -8px rgba(78,204,163,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] text-white/55 truncate">Bonjour 👋</p>
          <h2 className="text-sm font-medium leading-tight truncate">{name}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AccountSwitcher value={account} onChange={onAccountChange} />
        <button
          className="relative h-10 w-10 rounded-full grid place-items-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] press"
          aria-label="Notifications"
        >
          <Bell size={16} className="icon-muted" strokeWidth={1.8} />
          <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#4ECCA3] shadow-[0_0_6px_rgba(78,204,163,0.8)]" />
        </button>
      </div>
    </header>
  );
}
