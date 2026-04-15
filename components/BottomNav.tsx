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
    <nav
      className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3"
      style={{
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto max-w-xl px-4 flex items-center justify-around gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative press px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs transition-colors duration-200 ${
                active ? "text-[#4ECCA3]" : "text-white/55 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "rgba(78,204,163,0.15)",
                    boxShadow: "inset 0 1px 0 rgba(78,204,163,0.2)",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <Icon
                size={16}
                className="relative"
                strokeWidth={active ? 2.2 : 1.8}
                style={
                  active
                    ? { filter: "drop-shadow(0 0 6px rgba(78,204,163,0.6))" }
                    : undefined
                }
              />
              <span className="relative font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
