"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ListOrdered, PieChart } from "lucide-react";

const items = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/history", label: "Historique", icon: ListOrdered },
  { href: "/stats", label: "Stats", icon: PieChart },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="relative rounded-full border border-line bg-bg-elevated/80 backdrop-blur-lg p-1.5 flex items-center gap-1 shadow-2xl shadow-black/60">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative press px-4 py-2.5 rounded-full inline-flex items-center gap-2 text-sm transition-colors ${
                active ? "text-bg" : "text-white/60 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-white/85"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={16} className="relative" strokeWidth={2.2} />
              <span className="relative font-semibold">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
