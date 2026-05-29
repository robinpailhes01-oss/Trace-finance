import {
  type Transaction,
  type AccountType,
  isTransferCategory,
  getCategories,
} from "./types";

export interface MonthStats {
  income: number;
  expense: number;
  transfers: number;
  balance: number;
  savingsRate: number;
  topCategories: { label: string; emoji: string; amount: number; pct: number }[];
  txCount: number;
  avgDaily: number;
  biggestTx: { amount: number; label: string; emoji: string } | null;
  daysInMonth: number;
  dayOfMonth: number;
}

export interface RecapPayload {
  type: "weekly" | "monthly";
  account: AccountType;
  currentMonth: MonthStats;
  prevMonth: MonthStats | null;
  insights: string[];
  periodLabel: string;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function inRange(t: Transaction, from: Date, to: Date) {
  const dt = new Date(t.date);
  return dt >= from && dt <= to;
}

function computeMonth(txs: Transaction[], account: AccountType, ref: Date): MonthStats {
  const categories = getCategories(account);
  const from = startOfMonth(ref);
  const to = endOfMonth(ref);
  const list = txs.filter((t) => t.account === account && inRange(t, from, to));

  let income = 0;
  let expense = 0;
  let transfers = 0;
  const catMap: Record<string, number> = {};
  let biggest: Transaction | null = null;

  list.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else if (isTransferCategory(t.category)) {
      transfers += t.amount;
    } else {
      expense += t.amount;
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
      if (!biggest || t.amount > biggest.amount) biggest = t;
    }
  });

  const topCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, amount]) => {
      const cat = categories.find((c) => c.key === key);
      return {
        label: cat?.label ?? key,
        emoji: cat?.emoji ?? "•",
        amount,
        pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
      };
    });

  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const dayOfMonth = ref.getDate();
  const elapsed = Math.min(dayOfMonth, daysInMonth);
  const avgDaily = elapsed > 0 ? expense / elapsed : 0;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  let biggestTx = null;
  if (biggest) {
    const b = biggest as Transaction;
    const cat = categories.find((c) => c.key === b.category);
    biggestTx = { amount: b.amount, label: cat?.label ?? b.category, emoji: cat?.emoji ?? "•" };
  }

  return {
    income,
    expense,
    transfers,
    balance: income - expense,
    savingsRate,
    topCategories,
    txCount: list.filter((t) => t.type === "expense" && !isTransferCategory(t.category)).length,
    avgDaily,
    biggestTx,
    daysInMonth,
    dayOfMonth,
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function generateInsights(cur: MonthStats, prev: MonthStats | null, type: "weekly" | "monthly"): string[] {
  const insights: string[] = [];

  // Insight 1: savings rate
  if (cur.income > 0) {
    const rate = Math.round(cur.savingsRate);
    if (prev && prev.income > 0) {
      const diff = Math.round(cur.savingsRate - prev.savingsRate);
      if (diff > 5) {
        insights.push(`Ton taux d'épargne est de ${rate}%, en hausse de ${diff} points vs le mois dernier. Belle progression ! 🚀`);
      } else if (diff < -5) {
        insights.push(`Ton taux d'épargne est de ${rate}%, en baisse de ${Math.abs(diff)} points vs le mois dernier. À surveiller. ⚠️`);
      } else {
        insights.push(`Ton taux d'épargne est stable à ${rate}%. ${rate >= 20 ? "Tu gères bien !" : "Viser 20%+ serait idéal."}`);
      }
    } else {
      insights.push(`Ton taux d'épargne ce mois-ci est de ${rate}%. ${rate >= 20 ? "Excellent !" : rate >= 10 ? "Correct, mais on peut faire mieux." : "En dessous de 10%, c'est le moment d'agir."}`);
    }
  }

  // Insight 2: top spending category
  if (cur.topCategories.length > 0) {
    const top = cur.topCategories[0];
    if (top.pct >= 30) {
      insights.push(`${top.emoji} ${top.label} représente ${top.pct}% de tes dépenses (${fmt(top.amount)}). C'est ton poste dominant — est-ce intentionnel ?`);
    } else if (cur.topCategories.length >= 2) {
      const top2 = cur.topCategories[1];
      insights.push(`Tes 2 premiers postes de dépenses : ${top.emoji} ${top.label} (${fmt(top.amount)}) et ${top2.emoji} ${top2.label} (${fmt(top2.amount)}). Ils représentent ${top.pct + top2.pct}% du total.`);
    } else {
      insights.push(`${top.emoji} ${top.label} est ton premier poste de dépenses avec ${fmt(top.amount)} (${top.pct}% du total).`);
    }
  }

  // Insight 3: projection or expense trend
  if (type === "weekly" && cur.income > 0) {
    const projected = cur.avgDaily * cur.daysInMonth;
    if (projected > cur.income) {
      insights.push(`📊 À ce rythme (${fmt(Math.round(cur.avgDaily))}/jour), tu dépasseras tes revenus en fin de mois. Projection : ${fmt(Math.round(projected))} de dépenses.`);
    } else {
      insights.push(`📊 Projection fin de mois : ${fmt(Math.round(projected))} de dépenses pour ${fmt(cur.income)} de revenus. Tu restes dans les clous.`);
    }
  } else if (type === "monthly" && prev && prev.expense > 0) {
    const diff = cur.expense - prev.expense;
    const pct = Math.round((diff / prev.expense) * 100);
    if (Math.abs(pct) >= 5) {
      const dir = diff > 0 ? "augmenté" : "réduit";
      insights.push(`Tes dépenses ont ${dir} de ${Math.abs(pct)}% vs le mois dernier (${diff > 0 ? "+" : ""}${fmt(diff)}). ${diff < 0 ? "Bien joué ! 💪" : "À analyser. 🔍"}`);
    } else {
      insights.push(`Tes dépenses sont stables d'un mois sur l'autre (variation de ${pct > 0 ? "+" : ""}${pct}%). Bonne constance. 👍`);
    }
  }

  return insights.slice(0, 3);
}

export function buildRecapPayload(
  txs: Transaction[],
  account: AccountType,
  type: "weekly" | "monthly",
): RecapPayload {
  const now = new Date();
  const prevRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonth = computeMonth(txs, account, now);
  const prevMonth = computeMonth(txs, account, prevRef);
  const insights = generateInsights(currentMonth, prevMonth, type);

  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const weekLabel = (() => {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `Semaine du ${monday.toLocaleDateString("fr-FR", opts)} au ${sunday.toLocaleDateString("fr-FR", opts)}`;
  })();

  return {
    type,
    account,
    currentMonth,
    prevMonth,
    insights,
    periodLabel: type === "weekly" ? weekLabel : monthName,
  };
}

export interface RecapSettings {
  email: string;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
}

const SETTINGS_KEY = "trace.email-recap.v1";
const SENT_KEY = "trace.email-recap-sent.v1";

export function loadRecapSettings(): RecapSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRecapSettings(s: RecapSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function shouldSendToday(type: "weekly" | "monthly"): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const dayOfMonth = today.getDate();

  if (type === "weekly" && dayOfWeek !== 1) return false;
  if (type === "monthly" && dayOfMonth !== 1) return false;

  try {
    const raw = localStorage.getItem(SENT_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    const todayStr = today.toISOString().slice(0, 10);
    return sent[type] !== todayStr;
  } catch {
    return true;
  }
}

export function markSent(type: "weekly" | "monthly") {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const sent: Record<string, string> = raw ? JSON.parse(raw) : {};
    sent[type] = new Date().toISOString().slice(0, 10);
    localStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    // ignore
  }
}
