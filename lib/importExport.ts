import {
  type AccountType,
  type Transaction,
  type TxType,
  getCategories,
} from "@/lib/types";

export interface ImportReport {
  imported: number;
  skipped: number;
  errors: string[];
}

/* ============================================================
   CSV parsing — tolerant to French & English headers,
   DD/MM/YYYY or ISO dates, comma/dot decimal separators,
   signed amounts, and category labels/keys.
   ============================================================ */

function splitCsvLine(line: string): string[] {
  // Simple CSV parser that handles quoted fields and embedded commas
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";" || ch === "\t") && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findHeader(
  headers: string[],
  candidates: string[],
): number | null {
  const nh = headers.map(normalize);
  for (const cand of candidates) {
    const idx = nh.indexOf(normalize(cand));
    if (idx !== -1) return idx;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  // Remove currency symbols and spaces
  let s = raw.replace(/[€$£\s]/g, "");
  // If both comma and dot present, assume dot is thousands and comma is decimal
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // ISO YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})/;
  if (iso.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const fr = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
  const m = s.match(fr);
  if (m) {
    let [_, dd, mm, yy] = m;
    if (yy.length === 2) yy = (parseInt(yy, 10) > 70 ? "19" : "20") + yy;
    const d = new Date(
      parseInt(yy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      12,
      0,
      0,
    );
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // Fallback
  const f = new Date(s);
  if (!isNaN(f.getTime())) return f.toISOString();
  return null;
}

function detectType(raw: string, amount: number): TxType {
  if (raw) {
    const n = normalize(raw);
    if (
      n.includes("income") ||
      n.includes("revenu") ||
      n.includes("credit") ||
      n === "+" ||
      n === "in"
    )
      return "income";
    if (
      n.includes("expense") ||
      n.includes("depense") ||
      n.includes("debit") ||
      n === "-" ||
      n === "out"
    )
      return "expense";
  }
  return amount < 0 ? "expense" : "income";
}

function detectAccount(raw: string, fallback: AccountType): AccountType {
  if (!raw) return fallback;
  const n = normalize(raw);
  if (n.startsWith("pro") || n.includes("business") || n.includes("entreprise"))
    return "pro";
  if (n.startsWith("perso") || n.includes("personal") || n.includes("perso"))
    return "perso";
  return fallback;
}

function resolveCategory(
  account: AccountType,
  type: TxType,
  raw: string,
): string {
  const cats = getCategories(account).filter((c) => c.type === type);
  if (!raw) return cats[0]?.key ?? "other_expense";
  const n = normalize(raw);
  // key match
  const byKey = cats.find((c) => normalize(c.key) === n);
  if (byKey) return byKey.key;
  // label match
  const byLabel = cats.find((c) => normalize(c.label) === n);
  if (byLabel) return byLabel.key;
  // partial
  const partial = cats.find(
    (c) =>
      normalize(c.label).includes(n) || n.includes(normalize(c.label)),
  );
  if (partial) return partial.key;
  // fallback "autre"
  const other = cats.find((c) => c.key.startsWith("other"));
  return other?.key ?? cats[0]?.key ?? "other_expense";
}

export function parseCsv(
  content: string,
  defaultAccount: AccountType,
): { rows: Omit<Transaction, "id">[]; report: ImportReport } {
  const report: ImportReport = { imported: 0, skipped: 0, errors: [] };
  const rows: Omit<Transaction, "id">[] = [];

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    report.errors.push("Fichier vide.");
    return { rows, report };
  }

  const headers = splitCsvLine(lines[0]);

  const idx = {
    date: findHeader(headers, ["date", "jour"]),
    amount: findHeader(headers, [
      "amount",
      "montant",
      "valeur",
      "value",
      "somme",
    ]),
    type: findHeader(headers, ["type", "nature", "sens"]),
    category: findHeader(headers, [
      "category",
      "categorie",
      "catégorie",
      "cat",
    ]),
    note: findHeader(headers, [
      "note",
      "description",
      "libelle",
      "libellé",
      "label",
      "memo",
      "details",
      "détails",
      "nom",
    ]),
    account: findHeader(headers, [
      "account",
      "compte",
      "profile",
      "profil",
    ]),
    income: findHeader(headers, ["credit", "crédit", "income", "revenu"]),
    expense: findHeader(headers, ["debit", "débit", "expense", "depense", "dépense"]),
  };

  if (idx.date == null || (idx.amount == null && idx.income == null && idx.expense == null)) {
    report.errors.push(
      "Colonnes requises manquantes. Au minimum: date + montant (ou crédit/débit).",
    );
    return { rows, report };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const dRaw = idx.date != null ? cols[idx.date] : "";
    const date = parseDate(dRaw);
    if (!date) {
      report.skipped++;
      report.errors.push(`Ligne ${i + 1}: date invalide ("${dRaw}")`);
      continue;
    }

    let amount: number | null = null;
    let explicitType: TxType | null = null;

    if (idx.amount != null) {
      const raw = cols[idx.amount] ?? "";
      amount = parseAmount(raw);
    } else {
      // credit / debit format
      const credit =
        idx.income != null ? parseAmount(cols[idx.income] ?? "") : null;
      const debit =
        idx.expense != null ? parseAmount(cols[idx.expense] ?? "") : null;
      if (credit && credit > 0) {
        amount = credit;
        explicitType = "income";
      } else if (debit && debit > 0) {
        amount = debit;
        explicitType = "expense";
      }
    }

    if (amount == null || !isFinite(amount) || amount === 0) {
      report.skipped++;
      report.errors.push(`Ligne ${i + 1}: montant invalide`);
      continue;
    }

    const typeRaw = idx.type != null ? cols[idx.type] ?? "" : "";
    const type = explicitType ?? detectType(typeRaw, amount);
    const account = detectAccount(
      idx.account != null ? cols[idx.account] ?? "" : "",
      defaultAccount,
    );
    const catRaw = idx.category != null ? cols[idx.category] ?? "" : "";
    const category = resolveCategory(account, type, catRaw);
    const note =
      idx.note != null ? (cols[idx.note] ?? "").slice(0, 140) : undefined;

    rows.push({
      account,
      type,
      amount: Math.abs(amount),
      category,
      note: note && note.length > 0 ? note : undefined,
      date,
    });
    report.imported++;
  }

  return { rows, report };
}

/* ============================================================
   JSON (Trace's own export)
   ============================================================ */

export interface TraceJsonExport {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
}

export function parseJson(
  content: string,
): { rows: Omit<Transaction, "id">[]; report: ImportReport } {
  const report: ImportReport = { imported: 0, skipped: 0, errors: [] };
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (e) {
    report.errors.push("JSON invalide.");
    return { rows: [], report };
  }

  const list: Transaction[] | undefined =
    Array.isArray(data)
      ? (data as Transaction[])
      : (data as TraceJsonExport)?.transactions;

  if (!Array.isArray(list)) {
    report.errors.push(
      "Format JSON inattendu. Fournis un tableau de transactions ou un export Trace.",
    );
    return { rows: [], report };
  }

  const rows: Omit<Transaction, "id">[] = [];
  list.forEach((t: any, i) => {
    if (
      !t ||
      typeof t.amount !== "number" ||
      (t.type !== "income" && t.type !== "expense") ||
      !t.date
    ) {
      report.skipped++;
      report.errors.push(`Entrée ${i + 1}: structure invalide`);
      return;
    }
    // Accept both { account } (Trace) and { profile } (old app)
    const rawAccount = t.account ?? t.profile;
    const account: AccountType = rawAccount === "pro" ? "pro" : "perso";
    // Accept both { note } (Trace) and { label } (old app)
    const rawNote: string | undefined = t.note ?? t.label;
    // Resolve category via label matching against our internal lists
    const rawCategory: string = t.category ?? "";
    const category = rawCategory
      ? resolveCategory(account, t.type, rawCategory)
      : t.type === "income"
      ? "other_income"
      : "other_expense";
    rows.push({
      account,
      type: t.type,
      amount: Math.abs(t.amount),
      category,
      note: rawNote && rawNote.length > 0 ? rawNote : undefined,
      date: new Date(t.date).toISOString(),
    });
    report.imported++;
  });

  return { rows, report };
}

/* ============================================================
   Exporters
   ============================================================ */

export function toJson(txs: Transaction[]): string {
  const payload: TraceJsonExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: txs,
  };
  return JSON.stringify(payload, null, 2);
}

export function toCsv(txs: Transaction[]): string {
  const head = ["date", "type", "amount", "category", "note", "account"];
  const lines = [head.join(",")];
  txs.forEach((t) => {
    const row = [
      t.date.slice(0, 10),
      t.type,
      t.amount.toString(),
      t.category,
      (t.note ?? "").replace(/"/g, '""'),
      t.account,
    ];
    const quoted = row.map((v) =>
      /[",\n]/.test(v) ? `"${v}"` : v,
    );
    lines.push(quoted.join(","));
  });
  return lines.join("\n");
}

export function download(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CSV_TEMPLATE = `date,type,amount,category,note,account
2024-04-01,income,2500,salary,Paie avril,perso
2024-04-02,expense,35.50,food,Monoprix,perso
2024-04-03,expense,12.80,restaurant,Sushi shop,perso
2024-04-05,income,1500,client,Mission Acme,pro
2024-04-06,expense,19.99,saas,Vercel Pro,pro
`;
