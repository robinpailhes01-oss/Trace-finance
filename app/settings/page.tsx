"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAccount, useTransactions } from "@/lib/store";
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

type Mode = "merge" | "replace";

export default function SettingsPage() {
  const { account, setAccount } = useAccount();
  const { txs, bulkAdd, replaceAll, clear, hydrated } = useTransactions();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>("merge");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    tone: "green" | "red";
  }>({ open: false, message: "", tone: "green" });

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
        replaceAll(
          result.rows.map((r) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
        );
      } else {
        bulkAdd(result.rows);
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

  const clearAll = () => {
    if (
      window.confirm(
        "Supprimer toutes les transactions ? Cette action est irréversible.",
      )
    ) {
      clear();
      showToast("Données effacées", "red");
    }
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

      {/* IMPORT */}
      <section className="mt-6 card-lg p-6">
        <p className="label mb-2">Importer des données</p>
        <p className="text-sm text-white/60 mb-5">
          Glisse un fichier <span className="text-white">CSV</span> (depuis ta
          banque, Notion, Google Sheets, Excel, ton ancienne app…) ou un export{" "}
          <span className="text-white">JSON</span> Trace.
        </p>

        {/* Mode toggle */}
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
                className={`relative px-4 py-1.5 rounded-full transition-colors duration-200 ${
                  active ? "text-[#0A0A0F]" : "text-white/55"
                }`}
                style={{
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

        {/* Help: column names */}
        <details className="mt-4 text-sm">
          <summary className="text-white/60 cursor-pointer select-none">
            Colonnes acceptées (CSV)
          </summary>
          <div className="mt-3 space-y-2 text-[13px] text-white/70">
            <p>
              Headers (FR ou EN, accents tolérés) — le parser reconnaît
              automatiquement :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code className="text-[#F0EDE8]">date</code> · jour · ISO
                (YYYY-MM-DD) ou DD/MM/YYYY
              </li>
              <li>
                <code className="text-[#F0EDE8]">amount</code> · montant ·
                valeur · somme
                <span className="text-white/40"> (virgule ou point)</span>
              </li>
              <li>
                ou <code className="text-[#F0EDE8]">credit</code> /{" "}
                <code className="text-[#F0EDE8]">debit</code> (crédit /
                débit)
              </li>
              <li>
                <code className="text-[#F0EDE8]">type</code> · nature · sens ·{" "}
                <span className="text-white/40">
                  (income/expense, revenu/dépense, +/-, ou déduit du signe)
                </span>
              </li>
              <li>
                <code className="text-[#F0EDE8]">category</code> · catégorie ·
                cat
              </li>
              <li>
                <code className="text-[#F0EDE8]">note</code> · description ·
                libellé · mémo
              </li>
              <li>
                <code className="text-[#F0EDE8]">account</code> · compte · (pro
                / perso, défaut = {account})
              </li>
            </ul>
            <p className="text-[11px] text-white/45">
              Séparateurs supportés : virgule, point-virgule, tabulation.
            </p>
          </div>
        </details>

        {/* Report */}
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
          Efface toutes les transactions locales. Pense à exporter avant.
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
