"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const supabase = getSupabase();

        // 1) Try PKCE: a ?code=xxx param after the magic link redirect
        const href = window.location.href;
        const url = new URL(href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (
          url.hash.includes("access_token=") ||
          url.hash.includes("refresh_token=")
        ) {
          // 2) Implicit flow: tokens come back in the URL hash.
          //    @supabase/ssr auto-detects these on load, but we wait for it.
          await new Promise((r) => setTimeout(r, 150));
        } else {
          // 3) Sometimes Supabase sends `token_hash` + `type` (OTP verify flow)
          const token_hash = url.searchParams.get("token_hash");
          const type = url.searchParams.get("type") as
            | "magiclink"
            | "signup"
            | "email"
            | "recovery"
            | null;
          if (token_hash && type) {
            const { error } = await supabase.auth.verifyOtp({
              token_hash,
              type,
            });
            if (error) throw error;
          }
        }

        // Poll a few ticks for the session to be committed
        let session = null;
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          if (session) break;
          await new Promise((r) => setTimeout(r, 120));
        }

        if (cancelled) return;

        if (!session) {
          throw new Error(
            "Impossible de récupérer la session. Essaie de te reconnecter.",
          );
        }

        // Go home (strip hash & query)
        const next = url.searchParams.get("next") ?? "/";
        router.replace(next);
      } catch (e) {
        if (cancelled) return;
        console.error("[auth/callback] failed:", e);
        setError(
          e instanceof Error ? e.message : "Erreur lors de la connexion.",
        );
        setStatus("error");
      }
    };

    finish();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto max-w-sm px-6 pt-24 min-h-screen flex flex-col items-center text-center">
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

      {status === "loading" && (
        <>
          <p className="mt-6 inline-flex items-center gap-2 text-white/70 text-sm">
            <Loader2 size={15} className="animate-spin" />
            Connexion en cours…
          </p>
          <p className="text-[12px] text-white/45 mt-3 max-w-xs">
            On finalise la session Supabase puis on te redirige.
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <p className="mt-6 inline-flex items-center gap-2 text-[#FF6B6B] text-sm font-medium">
            <AlertCircle size={15} />
            Connexion impossible
          </p>
          <p className="text-[12px] text-white/55 mt-3 max-w-xs">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ background: "#4ECCA3", color: "#0A0A0F" }}
          >
            Recommencer
          </button>
        </>
      )}
    </main>
  );
}
