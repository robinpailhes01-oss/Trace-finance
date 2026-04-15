"use client";

import Link from "next/link";
import { Sparkles, Settings } from "lucide-react";
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
        <Link
          href="/settings"
          aria-label="Réglages"
          className="relative h-10 w-10 rounded-full grid place-items-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] press text-white/75"
        >
          <Settings size={16} strokeWidth={1.8} className="icon-muted" />
        </Link>
      </div>
    </header>
  );
}
