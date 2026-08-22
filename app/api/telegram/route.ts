import { NextRequest, NextResponse } from "next/server";
import { PERSO_CATEGORIES, type Category } from "@/lib/types";

export const runtime = "nodejs";

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER = process.env.TELEGRAM_OWNER_CHAT_ID; // optional lock to one chat
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET; // optional
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY; // optional (better parsing)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface Parsed {
  type: "income" | "expense";
  amount: number;
  category: string; // category key
  note?: string;
  date?: string; // ISO
}

/* ---------- helpers ---------- */

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

async function tgSend(chatId: number | string, text: string) {
  if (!TG_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

function catLabel(key: string): string {
  const c = PERSO_CATEGORIES.find((x) => x.key === key);
  return c ? `${c.emoji} ${c.label}` : key;
}

/* ---------- rule-based FR parser (fallback, no API needed) ---------- */

const INCOME_HINTS = [
  "recu",
  "reçu",
  "gagne",
  "gagné",
  "salaire",
  "paie",
  "paye",
  "revenu",
  "bonus",
  "remboursement",
  "rembourse",
  "vente",
  "vendu",
  "encaisse",
  "prime",
  "tips",
  "pourboire",
];

function ruleParse(text: string): Parsed | null {
  const n = normalize(text);

  // amount: first number, allow "12,50" or "12.50" or "12€"
  const m = n.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const amount = parseFloat(m[1].replace(",", "."));
  if (!isFinite(amount) || amount <= 0) return null;

  const isIncome = INCOME_HINTS.some((h) => n.includes(normalize(h)));
  const type: "income" | "expense" = isIncome ? "income" : "expense";

  const pool = PERSO_CATEGORIES.filter((c) => c.type === type);
  let cat: Category | undefined;
  // best match on label
  for (const c of pool) {
    if (n.includes(normalize(c.label))) {
      cat = c;
      break;
    }
  }
  // some common keyword synonyms → category key
  if (!cat) {
    const syn: Record<string, string> = {
      resto: "restaurant",
      restau: "restaurant",
      mcdo: "restaurant",
      burger: "restaurant",
      course: "groceries",
      supermarche: "groceries",
      essence: "transport",
      gasoil: "transport",
      metro: "transport",
      train: "transport",
      uber: "transport",
      sport: "sport",
      salle: "sport",
      abo: "subscription",
      netflix: "subscription",
      spotify: "subscription",
      loyer: "other_expense",
      voyage: "travel_perso",
      hotel: "travel_perso",
      avion: "travel_perso",
      vetement: "clothes",
      fringue: "clothes",
      medecin: "health",
      pharmacie: "health",
      epargne: "savings",
      invest: "investment_exp",
      crypto: "investment_exp",
      salaire: "salary",
      freelance: "freelance_perso",
      bonus: "bonus",
    };
    for (const [k, v] of Object.entries(syn)) {
      if (n.includes(k)) {
        const found = pool.find((c) => c.key === v);
        if (found) {
          cat = found;
          break;
        }
      }
    }
  }
  if (!cat) cat = pool.find((c) => c.key.startsWith("other")) ?? pool[0];
  if (!cat) return null;

  // note = the message minus the amount, trimmed
  const note = text.replace(m[0], "").replace(/[€]/g, "").trim() || undefined;

  return { type, amount, category: cat.key, note };
}

/* ---------- Claude parser (used when ANTHROPIC_API_KEY is set) ---------- */

async function claudeParse(text: string): Promise<Parsed | null> {
  if (!ANTHROPIC_KEY) return null;
  const catList = PERSO_CATEGORIES.map(
    (c) => `${c.key} (${c.label}, ${c.type})`,
  ).join("\n");
  const today = new Date().toISOString().slice(0, 10);

  const system = `Tu es un analyseur de finances personnelles. À partir d'un message en français, extrais UNE transaction.
Réponds UNIQUEMENT avec un objet JSON, sans texte autour, au format:
{"type":"income|expense","amount":<nombre>,"category":"<clé>","note":"<courte description>","date":"YYYY-MM-DD"}

Catégories disponibles (clé, libellé, type):
${catList}

Règles:
- amount est un nombre positif en euros.
- Choisis la clé de catégorie la plus proche. Si rien ne colle: other_income (revenu) ou other_expense (dépense).
- Si aucune date n'est mentionnée, utilise ${today}.
- Détecte income vs expense selon le sens du message (reçu/gagné/salaire = income, sinon expense).`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data?.content?.[0]?.text ?? "";
    const jsonStr = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const p = JSON.parse(jsonStr) as Parsed;
    if (
      (p.type === "income" || p.type === "expense") &&
      typeof p.amount === "number" &&
      p.amount > 0 &&
      p.category
    ) {
      return p;
    }
    return null;
  } catch {
    return null;
  }
}

async function parseMessage(text: string): Promise<Parsed | null> {
  return (await claudeParse(text)) ?? ruleParse(text);
}

/* ---------- Supabase insert ---------- */

async function insertTx(p: Parsed): Promise<boolean> {
  if (!SB_URL || !SB_ANON) return false;
  const date = p.date
    ? new Date(p.date + "T12:00:00").toISOString()
    : new Date().toISOString();
  try {
    const res = await fetch(`${SB_URL}/rest/v1/transactions`, {
      method: "POST",
      headers: {
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: p.type,
        amount: p.amount,
        category: p.category,
        note: p.note ?? null,
        date,
        account: "perso",
        source: "telegram",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function monthSummary(): Promise<string> {
  if (!SB_URL || !SB_ANON) return "Base non configurée.";
  try {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const res = await fetch(
      `${SB_URL}/rest/v1/transactions?select=type,amount,category&date=gte.${start.toISOString()}`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } },
    );
    if (!res.ok) return "Erreur lecture.";
    const rows = (await res.json()) as {
      type: string;
      amount: number | string;
      category: string;
    }[];
    const transferKeys = new Set([
      "savings",
      "investment_exp",
      "savings_pro",
      "investment_exp_pro",
    ]);
    let inc = 0,
      exp = 0,
      tr = 0;
    rows.forEach((r) => {
      const a = typeof r.amount === "string" ? parseFloat(r.amount) : r.amount;
      if (r.type === "income") inc += a;
      else if (transferKeys.has(r.category)) tr += a;
      else exp += a;
    });
    const bal = inc - exp - tr;
    const monthName = new Date().toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return `📊 <b>${monthName}</b>\n\n💰 Revenus: ${eur(inc)}\n💸 Dépenses: ${eur(exp)}\n🏦 Épargne/Invest: ${eur(tr)}\n\n<b>Solde: ${eur(bal)}</b>`;
  } catch {
    return "Erreur.";
  }
}

/* ---------- webhook handler ---------- */

export async function POST(req: NextRequest) {
  // Optional shared-secret check (Telegram sends the header you registered)
  if (WEBHOOK_SECRET) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true }); // silently ignore
    }
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = update?.message ?? update?.edited_message;
  const chatId = msg?.chat?.id;
  const text: string = (msg?.text ?? "").trim();
  if (!chatId || !text) return NextResponse.json({ ok: true });

  // Lock to the owner if configured
  if (OWNER && String(chatId) !== String(OWNER)) {
    await tgSend(
      chatId,
      "⛔ Ce bot est privé. Ton chat id: <code>" + chatId + "</code>",
    );
    return NextResponse.json({ ok: true });
  }

  // Commands
  if (text === "/start" || text === "/help") {
    await tgSend(
      chatId,
      "👋 <b>Trace Finance</b>\n\nÉcris-moi tes transactions en langage naturel:\n\n• <i>20 resto midi</i>\n• <i>salaire 2300</i>\n• <i>courses 45,50</i>\n• <i>50 essence</i>\n• <i>épargne 200</i>\n\nCommandes:\n/solde — résumé du mois\n\nTon chat id: <code>" +
        chatId +
        "</code>",
    );
    return NextResponse.json({ ok: true });
  }

  if (text === "/solde" || text === "/mois" || normalize(text) === "solde") {
    await tgSend(chatId, await monthSummary());
    return NextResponse.json({ ok: true });
  }

  // Parse a transaction
  const parsed = await parseMessage(text);
  if (!parsed) {
    await tgSend(
      chatId,
      "🤔 Je n'ai pas compris. Essaie par ex: <i>20 resto</i> ou <i>salaire 2000</i>.",
    );
    return NextResponse.json({ ok: true });
  }

  const ok = await insertTx(parsed);
  if (!ok) {
    await tgSend(chatId, "⚠️ Impossible d'enregistrer (base non configurée).");
    return NextResponse.json({ ok: true });
  }

  const sign = parsed.type === "income" ? "＋" : "−";
  const emoji = parsed.type === "income" ? "✅" : "🧾";
  await tgSend(
    chatId,
    `${emoji} Enregistré\n\n${sign}${eur(parsed.amount)} · ${catLabel(parsed.category)}${
      parsed.note ? `\n<i>${parsed.note}</i>` : ""
    }`,
  );
  return NextResponse.json({ ok: true });
}

// Health check
export async function GET() {
  return NextResponse.json({ ok: true, service: "trace-telegram-webhook" });
}
