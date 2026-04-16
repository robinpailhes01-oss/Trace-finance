"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
          result.rows.map((r) => ({ ...r, id: crypto.randomUUID() })),
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
      const firstErr = result.report.errors[0];
      showToast(
        firstErr ? `Échec: ${firstErr.slice(0, 60)}` : "Import échoué",
        "red",
      );
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
          className="h-10 w-10 grid place-items-center rounded-full border border-[#3D2F1F]/10 bg-white/60 hover:bg-white/70 press text-[#3D2F1F]/80"
        >
          <ArrowLeft size={17} strokeWidth={1.8} />
        </Link>
        <h1 className="text-sm font-medium text-[#3D2F1F]">Réglages</h1>
        <AccountSwitcher value={account} onChange={setAccount} />
      </header>

      {/* IMPORT */}
      <section className="mt-6 card-lg p-6">
        <p className="label mb-2">Importer des données</p>
        <p className="text-sm text-[#3D2F1F]/65 mb-5">
          Glisse un fichier <span className="text-[#3D2F1F]">CSV</span> ou un export{" "}
          <span className="text-[#3D2F1F]">JSON</span> Trace.
        </p>

        <div className="mb-4 inline-flex rounded-full border border-[#3D2F1F]/10 bg-white/60 p-0.5 text-xs">
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
                  color: active ? "#F5EBDD" : "rgba(255,255,255,0.55)",
                  background: active ? "#3D2F1F" : "transparent",
                }}
              >
                <span className="relative font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm text-[#3D2F1F]/70 file:mr-3 file:rounded-full file:border file:border-[#3D2F1F]/10 file:bg-white/65 file:px-4 file:py-2 file:text-[#3D2F1F] file:cursor-pointer hover:file:bg-white/80"
          />
          <button
            onClick={downloadTemplate}
            className="press inline-flex items-center gap-2 rounded-full border border-[#3D2F1F]/10 bg-white/60 hover:bg-white/70 px-3 py-2 text-xs text-[#3D2F1F]/80"
          >
            <FileText size={13} strokeWidth={2} />
            Modèle
          </button>
        </div>

        {report && (
          <div className="mt-4 rounded-2xl border border-[#3D2F1F]/10 bg-white/55 p-4 text-sm">
            <p className="inline-flex items-center gap-2">
              <Check size={14} className="text-[#7B9B75]" />
              <span className="text-[#3D2F1F]">{report.imported} importée(s)</span>
              {report.skipped > 0 && (
                <>
                  <span className="text-[#3D2F1F]/45">·</span>
                  <AlertCircle size={14} className="text-[#C47A6B]" />
                  <span className="text-[#3D2F1F]/70">
                    {report.skipped} ignorée(s)
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </section>

      {/* EXPORT */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-2">Exporter ta donnée</p>
        <p className="text-sm text-[#3D2F1F]/65 mb-4">
          Sauvegarde de tes {hydrated ? txs.length : "…"} transactions.
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportJson}
            className="press flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#3D2F1F]/10 bg-white/65 hover:bg-white/75 px-4 py-3 text-sm font-medium"
          >
            <Download size={15} strokeWidth={2} />
            JSON
          </button>
          <button
            onClick={exportCsv}
            className="press flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#3D2F1F]/10 bg-white/65 hover:bg-white/75 px-4 py-3 text-sm font-medium"
          >
            <Download size={15} strokeWidth={2} />
            CSV
          </button>
        </div>
      </section>

      {/* DANGER */}
      <section className="mt-5 card-lg p-6">
        <p className="label mb-2">Zone sensible</p>
        <p className="text-sm text-[#3D2F1F]/65 mb-4">
          Efface toutes les transactions locales.
        </p>
        <button
          onClick={clearAll}
          className="press inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          style={{
            background: "rgba(196,122,107,0.12)",
            color: "#C47A6B",
            border: "1px solid rgba(196,122,107,0.25)",
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
