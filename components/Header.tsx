"use client";

import { Bell } from "lucide-react";
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
  const initial = name.trim().charAt(0).toUpperCase() || "R";

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 rounded-full p-[1.5px] bg-gradient-to-br from-[#4ECCA3] via-[#2DB4A0] to-[#0E8B7A]">
          <div className="h-full w-full rounded-full bg-[#0F0F16] grid place-items-center">
            <span className="font-serif text-base text-[#F0EDE8]">{initial}</span>
          </div>
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
