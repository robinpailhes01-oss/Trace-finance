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
      className="fixed bottom-0 inset-x-0 z-30 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2"
      style={{
        background: "rgba(245,235,221,0.78)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        borderTop: "1px solid rgba(61,47,31,0.08)",
      }}
    >
      <div className="mx-auto max-w-xl px-2 flex items-stretch justify-around gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative press flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-colors duration-200 ${
                active ? "text-[#5F7D5A]" : "text-[#3D2F1F]/55 hover:text-[#3D2F1F]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "rgba(123,155,117,0.10)",
                    border: "1px solid rgba(123,155,117,0.18)",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <Icon
                size={20}
                className="relative"
                strokeWidth={active ? 2.2 : 1.8}
                style={
                  active
                    ? { filter: "drop-shadow(0 0 6px rgba(123,155,117,0.55))" }
                    : undefined
                }
              />
              <span className="relative text-[10px] font-semibold tracking-wide">
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
