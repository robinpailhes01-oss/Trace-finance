"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

export function Toast({
  open,
  message,
  tone = "green",
}: {
  open: boolean;
  message: string;
  tone?: "green" | "red";
}) {
  const accent =
    tone === "green"
      ? "rgba(78,204,163,0.4)"
      : "rgba(255,107,107,0.4)";
  const accentSolid = tone === "green" ? "#4ECCA3" : "#FF6B6B";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 110px)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#F0EDE8]"
            style={{
              background: "rgba(18,18,26,0.9)",
              border: `1px solid ${accent}`,
              backdropFilter: "blur(14px) saturate(180%)",
              WebkitBackdropFilter: "blur(14px) saturate(180%)",
              boxShadow: `0 8px 28px rgba(0,0,0,0.5), 0 0 30px ${accent}`,
            }}
          >
            <span
              className="h-5 w-5 grid place-items-center rounded-full"
              style={{ background: accentSolid, color: "#0A0A0F" }}
            >
              <Check size={13} strokeWidth={3} />
            </span>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
