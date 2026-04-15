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
      <div className="glass rounded-full p-1.5 flex items-center gap-1 shadow-2xl shadow-black/40">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative px-4 py-2.5 rounded-full inline-flex items-center gap-2 text-sm transition-colors ${
                active ? "text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={16} className="relative" />
              <span className="relative font-medium hidden xs:inline sm:inline">
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
