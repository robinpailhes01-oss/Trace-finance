"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Trash2,
  Check,
  AlertCircle,
  LogOut,
  CloudUpload,
  Mail,
} from "lucide-react";
import {
  useAccount,
  useTransactions,
  readLegacyLocalTransactions,
  clearLegacyLocalTransactions,
} from "@/lib/store";
import {
  parseCsv,
  parseJson,
  toCsv,
  toJson,
  download,
  CSV_TEMPLATE,
  type ImportReport,
} from "@/lib/importExport";
import { Toast } from "@/components/Toast";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { getSupabase } from "@/lib/supabase";

type Mode = "merge" | "replace";

export default function SettingsPage() {
  const { account, setAccount } = useAccount();
  const { txs, bulkAdd, replaceAll, clear, hydrated } = useTransactions();
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>("merge");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "green" | "red";
  }>({ open: false, message: "", tone: "green" });

  const [email, setEmail] = useState<string | null>(null);
  const [legacyCount, setLegacyCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        setEmail(user?.email ?? null);
      } catch {
        setEmail(null);
      }
    })();
    setLegacyCount(readLegacyLocalTransactions().length);
  }, []);

  const showToast = (message: string, tone: "green" | "red" = "green") => {
    setToast({ open: true, message, tone });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 1800);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const isJson =
      file.name.toLowerCase().endsWith(".json") ||
      text.trim().startsWith("{") ||
      text.trim().startsWith("[");
    const result = isJson ? parseJson(text) : parseCsv(text, account);

    if (result.rows.length > 0) {
      if (mode === "replace") {
        await replaceAll(
          result.rows.map((r) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
        );
      } else {
        await bulkAdd(result.rows);
      }
      showToast(
        `${result.report.imported} transaction${
          result.report.imported > 1 ? "s" : ""
        } importée${result.report.imported > 1 ? "s" : ""}`,
      );
    } else {
      showToast("Import échoué", "red");
    }
    setReport(result.report);
    if (fileRef.current) fileRef.current.value = "";
  };

  const exportJson = () => {
    download(
      `trace-export-${new Date().toISOString().slice(0, 10)}.json`,
      toJson(txs),
      "application/json",
    );
    showToast("Export JSON téléchargé");
  };

  const exportCsv = () => {
    download(
      `trace-export-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(txs),
      "text/csv",
    );
    showToast("Export CSV téléchargé");
  };

  const downloadTemplate = () => {
    download("trace-template.csv", CSV_TEMPLATE, "text/csv");
    showToast("Modèle CSV téléchargé");
  };

  const clearAll = async () => {
    if (
      window.confirm(
        "Supprimer toutes les transactions ? Cette action est irréversible.",
      )
    ) {
      await clear();
      showToast("Données effacées", "red");
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  };

  const importLocalToCloud = async () => {
    const local = readLegacyLocalTransactions();
    if (local.length === 0) {
      showToast("Rien à importer", "red");
      return;
    }
    // Strip ids so Supabase assigns fresh uuids (avoids conflicts with any earlier imports)
    const stripped = local.map(({ id: _id, ...rest }) => rest);
    await bulkAdd(stripped);
    clearLegacyLocalTransactions();
    setLegacyCount(0);
    showToast(`${local.length} transactions synchronisées ☁`);
  };

  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="h-10 w-10 grid place-items-center rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] press text-white/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#F0EDE8]">Réglages</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* COMPTE */}
      <section className="mt-6 card-lg p-6">
        <p className="label mb-3">Compte connecté</p>
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full grid place-items-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #4ECCA3 0%, #2A9D8F 100%)",
              color: "#fff",
            }}
          >
            <Mail size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-[#F0EDE8]">
              {email ?? "Non connecté"}
            </p>
            <p className="text-[11px] text-white/45">
              Tes données sont stockées en privé · chiffré en transit
            </p>
          </div>
          <button
            onClick={signOut}
            className="press inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2 text-xs text-white/80"
          >
            <LogOut size={13} strokeWidth={2} />
            Déconnexion
          </button>
        </div>

        {legacyCount > 0 && (
          <div
            className="mt-5 rounded-2xl p-4 flex items-start gap-3"
            style={{
              border: "1px solid rgba(78,204,163,0.25)",
              background: "rgba(78,204,163,0.08)",
            }}
          >
            <CloudUpload size={18} className="text-[#4ECCA3] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#F0EDE8] font-medium">
                Transférer l&apos;historique local vers ton compte
              </p>
              <p className="text-[12px] text-white/60 mt-1">
                {legacyCount} transactions trouvées dans ton navigateur. On les
                pousse dans ton compte cloud pour les retrouver sur tous tes
                appareils.
              </p>
              <button
                onClick={importLocalToCloud}
                className="press mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: "#4ECCA3",
                  color: "#0A0A0F",
                  boxShadow: "0 8px 24px -8px rgba(78,204,163,0.55)",
                }}
              >
                <CloudUpload size={14} strokeWidth={2.4} />
                Synchroniser maintenant
              </button>
            </div>
          </div>
        )}
      </section>

      {/* IMPORT */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-2">Importer des données</p>
        <p className="text-sm text-white/60 mb-5">
          Glisse un fichier <span className="text-white">CSV</span> (banque,
          Notion, Google Sheets, Excel, ton ancienne app…) ou un export{" "}
          <span className="text-white">JSON</span> Trace.
        </p>

        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs">
          {(
            [
              { key: "merge", label: "Ajouter" },
              { key: "replace", label: "Remplacer" },
            ] as { key: Mode; label: string }[]
          ).map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="relative px-4 py-1.5 rounded-full transition-colors duration-200"
                style={{
                  color: active ? "#0A0A0F" : "rgba(255,255,255,0.55)",
                  background: active ? "#F0EDE8" : "transparent",
                }}
              >
                <span className="relative font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-white/40 mb-4">
          {mode === "merge"
            ? "Les nouvelles lignes s'ajoutent à ton historique existant."
            : "Remplace intégralement ton historique actuel par le fichier."}
        </p>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border file:border-white/10 file:bg-white/[0.04] file:px-4 file:py-2 file:text-white file:cursor-pointer hover:file:bg-white/[0.08]"
          />
          <button
            onClick={downloadTemplate}
            className="press inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 text-xs text-white/80"
          >
            <FileText size={13} strokeWidth={2} />
            Modèle
          </button>
        </div>

        {report && (
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm">
            <p className="inline-flex items-center gap-2">
              <Check size={14} className="text-[#4ECCA3]" />
              <span className="text-white">{report.imported} importée(s)</span>
              {report.skipped > 0 && (
                <>
                  <span className="text-white/40">·</span>
                  <AlertCircle size={14} className="text-[#FF6B6B]" />
                  <span className="text-white/70">
                    {report.skipped} ignorée(s)
                  </span>
                </>
              )}
            </p>
            {report.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-[11px] text-white/50 cursor-pointer">
                  Voir les détails ({report.errors.length})
                </summary>
                <ul className="mt-2 text-[11px] text-white/55 space-y-0.5 max-h-40 overflow-auto">
                  {report.errors.slice(0, 50).map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>

      {/* EXPORT */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-2">Exporter ta donnée</p>
        <p className="text-sm text-white/60 mb-4">
          Télécharge une sauvegarde complète de tes {hydrated ? txs.length : "…"}{" "}
          transactions.
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportJson}
            className="press flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-3 text-sm font-medium"
          >
            <Download size={15} strokeWidth={2} />
            JSON
          </button>
          <button
            onClick={exportCsv}
            className="press flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] px-4 py-3 text-sm font-medium"
          >
            <Download size={15} strokeWidth={2} />
            CSV
          </button>
        </div>
      </section>

      {/* DANGER */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-2">Zone sensible</p>
        <p className="text-sm text-white/60 mb-4">
          Efface toutes les transactions de ton compte cloud. Pense à exporter
          avant.
        </p>
        <button
          onClick={clearAll}
          className="press inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          style={{
            background: "rgba(255,107,107,0.12)",
            color: "#FF6B6B",
            border: "1px solid rgba(255,107,107,0.25)",
          }}
        >
          <Trash2 size={14} strokeWidth={2.2} />
          Effacer toutes les transactions
        </button>
      </section>

      <Toast open={toast.open} message={toast.message} tone={toast.tone} />
    </main>
  );
}
