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
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
      <div className="relative rounded-full hairline-strong bg-[#12121A]/85 backdrop-blur-lg p-1 flex items-center gap-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative press px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs transition-colors duration-200 ${
                active ? "text-bg" : "text-muted hover:text-cream"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-full bg-cream"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <Icon size={14} className="relative" strokeWidth={2} />
              <span className="relative font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
