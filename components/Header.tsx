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

function emojiFor(hour: number) {
  if (hour < 6) return "🌙";
  if (hour < 12) return "☀️";
  if (hour < 18) return "👋";
  return "🌆";
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
        <div className="relative h-11 w-11 rounded-full p-[1.5px] bg-gradient-to-br from-accent-goldLight via-accent-gold to-accent-green/70">
          <div className="h-full w-full rounded-full bg-bg-elevated grid place-items-center">
            <span className="font-semibold text-sm">{initial}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/50 truncate">
            {hour != null ? `${greeting(hour)} ${emojiFor(hour)}` : " "}
          </p>
          <h2 className="font-semibold leading-tight truncate">{name}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AccountSwitcher value={account} onChange={onAccountChange} />
        <button
          className="relative h-10 w-10 rounded-full grid place-items-center bg-white/[0.04] border border-line hover:bg-white/[0.08] press"
          aria-label="Notifications"
        >
          <Bell size={16} className="text-white/70" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent-green shadow-[0_0_6px_rgba(78,204,163,0.8)]" />
        </button>
      </div>
    </header>
  );
}
