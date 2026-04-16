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
      ? "rgba(123,155,117,0.4)"
      : "rgba(196,122,107,0.4)";
  const accentSolid = tone === "green" ? "#7B9B75" : "#C47A6B";

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
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#3D2F1F]"
            style={{
              background: "rgba(255,252,244,0.92)",
              border: `1px solid ${accent}`,
              backdropFilter: "blur(14px) saturate(160%)",
              WebkitBackdropFilter: "blur(14px) saturate(160%)",
              boxShadow: `0 10px 28px rgba(120,90,50,0.18), 0 0 24px ${accent}`,
            }}
          >
            <span
              className="h-5 w-5 grid place-items-center rounded-full"
              style={{ background: accentSolid, color: "#F5EBDD" }}
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
