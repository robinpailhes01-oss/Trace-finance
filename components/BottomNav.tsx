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
      <div
        className="relative rounded-full glass p-1 flex items-center gap-0.5"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative press px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs transition-colors duration-200 ${
                active ? "text-[#0A0A0F]" : "text-white/55 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-full bg-[#F0EDE8]"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <Icon
                size={16}
                className={`relative ${active ? "" : "icon-muted"}`}
                strokeWidth={1.8}
              />
              <span className="relative font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
