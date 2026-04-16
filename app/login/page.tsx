"use client";

import { useState } from "react";
import { Sparkles, Mail, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const supabase = getSupabase();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (err) throw err;
      setStatus("sent");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Impossible d'envoyer le lien.";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-sm px-6 pt-24 pb-32 min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center"
      >
        <div
          className="h-14 w-14 rounded-full grid place-items-center text-white"
          style={{
            background: "linear-gradient(135deg, #4ECCA3 0%, #2A9D8F 100%)",
            boxShadow:
              "0 10px 30px -8px rgba(78,204,163,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <Sparkles size={22} strokeWidth={2} />
        </div>
        <h1
          className="amount text-4xl sm:text-5xl mt-6"
          style={{ textShadow: "0 0 28px rgba(78,204,163,0.18)" }}
        >
          Trace Finance
        </h1>
        <p className="text-sm text-white/55 mt-3 max-w-xs">
          Connecte-toi avec ton email. On t&apos;envoie un lien magique — pas de
          mot de passe à retenir.
        </p>
      </motion.div>

      <motion.form
        onSubmit={send}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 card-lg p-6 flex flex-col gap-3"
      >
        <label className="label">Email</label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
          />
          <input
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@email.com"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] pl-11 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-[#4ECCA3]/40 text-[#F0EDE8]"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "sent"}
          className="press mt-2 inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
          style={{
            background: status === "sent" ? "rgba(78,204,163,0.15)" : "#4ECCA3",
            color: status === "sent" ? "#4ECCA3" : "#0A0A0F",
            border:
              status === "sent"
                ? "1px solid rgba(78,204,163,0.4)"
                : "1px solid transparent",
            boxShadow:
              status !== "sent"
                ? "0 10px 30px -10px rgba(78,204,163,0.55), inset 0 1px 0 rgba(255,255,255,0.25)"
                : undefined,
            opacity: status === "loading" ? 0.7 : 1,
          }}
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === "sent" ? (
            <Check size={16} strokeWidth={2.6} />
          ) : (
            <Mail size={15} strokeWidth={2.2} />
          )}
          {status === "sent" ? "Lien envoyé ✓" : "Recevoir le lien magique"}
        </button>

        {status === "sent" && (
          <p className="text-[12px] text-white/60 text-center mt-2">
            Vérifie ta boîte mail. Clique sur le lien pour te connecter.
          </p>
        )}
        {status === "error" && error && (
          <p className="text-[12px] text-[#FF6B6B] text-center mt-2">
            {error}
          </p>
        )}
      </motion.form>

      <p className="text-[11px] text-white/35 text-center mt-6">
        En te connectant, tu acceptes que tes données soient stockées de manière
        privée sur Supabase.
      </p>
    </main>
  );
}
