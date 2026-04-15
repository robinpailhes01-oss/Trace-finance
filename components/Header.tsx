"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import type { AccountType } from "@/lib/types";

function greeting(hour: number) {
  if (hour < 6) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function Header({
  name = "Robin",
  account,
  onAccountChange,
}: {
  name?: string;
  account: AccountType;
  onAccountChange: (a: AccountType) => void;
}) {
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const initial = name.trim().charAt(0).toUpperCase() || "R";

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-[#12121A] hairline-strong grid place-items-center">
          <span className="font-serif text-base text-cream">{initial}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted truncate">
            {hour != null ? greeting(hour) : " "}
          </p>
          <h2 className="text-sm font-medium leading-tight truncate text-cream">
            {name}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AccountSwitcher value={account} onChange={onAccountChange} />
        <button
          className="relative h-10 w-10 rounded-full grid place-items-center hairline-strong hover:bg-white/[0.03] press"
          aria-label="Notifications"
        >
          <Bell size={15} className="text-muted" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
