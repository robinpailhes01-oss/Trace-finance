export type AccountType = "perso" | "pro";

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  account: AccountType;
  type: TxType;
  amount: number;
  category: string;
  note?: string;
  date: string; // ISO
}

export interface Category {
  key: string;
  label: string;
  emoji: string;
  type: TxType;
}

export const PERSO_CATEGORIES: Category[] = [
  // Income
  { key: "salary", label: "Salaire", emoji: "💼", type: "income" },
  { key: "bonus", label: "Bonus", emoji: "🎁", type: "income" },
  { key: "freelance_perso", label: "Freelance", emoji: "💻", type: "income" },
  { key: "investment_perso", label: "Investissement", emoji: "📈", type: "income" },
  { key: "other_income", label: "Autre", emoji: "✨", type: "income" },

  // Expense
  { key: "subscription", label: "Abonnement", emoji: "🔁", type: "expense" },
  { key: "groceries", label: "Courses", emoji: "🛒", type: "expense" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️", type: "expense" },
  { key: "outings", label: "Sorties", emoji: "🎉", type: "expense" },
  { key: "leisure", label: "Loisirs", emoji: "🎮", type: "expense" },
  { key: "sport", label: "Sport", emoji: "🏋️", type: "expense" },
  { key: "healthy_food", label: "Healthy Food", emoji: "🥗", type: "expense" },
  { key: "health", label: "Santé", emoji: "💊", type: "expense" },
  { key: "care", label: "Soin", emoji: "💆", type: "expense" },
  { key: "buys_pro", label: "Achats Pro", emoji: "🛍️", type: "expense" },
  { key: "debt_gift", label: "Dettes/Don", emoji: "🤝", type: "expense" },
  { key: "transport", label: "Transport", emoji: "🚇", type: "expense" },
  { key: "investment_exp", label: "Investissement", emoji: "📈", type: "expense" },
  { key: "savings", label: "Épargne", emoji: "🏦", type: "expense" },
  { key: "training", label: "Formation", emoji: "📚", type: "expense" },
  { key: "clothes", label: "Vêtements", emoji: "👕", type: "expense" },
  { key: "tax_fine", label: "Taxe/Amende", emoji: "🧾", type: "expense" },
  { key: "other_expense", label: "Autres", emoji: "✨", type: "expense" },
];

export const PRO_CATEGORIES: Category[] = [
  // Income
  { key: "client", label: "Client", emoji: "💰", type: "income" },
  { key: "freelance_pro", label: "Freelance", emoji: "💻", type: "income" },
  { key: "salary_pro", label: "Salaire", emoji: "💼", type: "income" },
  { key: "investment_pro", label: "Investissement", emoji: "📈", type: "income" },
  { key: "sea_trip", label: "Sortie en mer", emoji: "⛵", type: "income" },
  { key: "unusual_night", label: "Nuit insolite", emoji: "🏕️", type: "income" },
  { key: "other_income_pro", label: "Autre", emoji: "✨", type: "income" },

  // Expense
  { key: "saas", label: "SaaS / Outils", emoji: "🛠️", type: "expense" },
  { key: "maintenance", label: "Entretien", emoji: "🧰", type: "expense" },
  { key: "training_pro", label: "Formation", emoji: "📚", type: "expense" },
  { key: "marketing", label: "Marketing", emoji: "📣", type: "expense" },
  { key: "office", label: "Bureau", emoji: "🏢", type: "expense" },
  { key: "tax_pro", label: "Taxes / URSSAF", emoji: "🧾", type: "expense" },
  { key: "subcontract", label: "Sous-traitance", emoji: "👥", type: "expense" },
  { key: "travel", label: "Déplacement", emoji: "✈️", type: "expense" },
  { key: "port", label: "Port", emoji: "⚓", type: "expense" },
  { key: "fuel", label: "Gasoil", emoji: "⛽", type: "expense" },
  { key: "investment_exp_pro", label: "Investissement", emoji: "📈", type: "expense" },
  { key: "savings_pro", label: "Épargne", emoji: "🏦", type: "expense" },
  { key: "other_expense_pro", label: "Autres", emoji: "✨", type: "expense" },
];

export function getCategories(account: AccountType): Category[] {
  return account === "pro" ? PRO_CATEGORIES : PERSO_CATEGORIES;
}

export function findCategory(
  account: AccountType,
  key: string,
): Category | undefined {
  return getCategories(account).find((c) => c.key === key);
}

/**
 * "Transfer" categories — money you still OWN, just moved elsewhere
 * (savings account, investments). These don't count as real spending
 * so they don't reduce the total balance.
 */
const TRANSFER_KEYS = new Set([
  "investment_exp",
  "investment_exp_pro",
  "savings",
  "savings_pro",
]);

export function isTransferCategory(key: string): boolean {
  return TRANSFER_KEYS.has(key);
}

export function isTransferTx(t: Transaction): boolean {
  return t.type === "expense" && isTransferCategory(t.category);
}

/**
 * Totals that reflect real spending vs transfers.
 * - income: all income
 * - expense: spending only (excludes transfers)
 * - transfers: savings + investments going out
 * - balance: income - expense  (transfers are neutral, money still yours)
 */
export function computeTotals(list: Transaction[]) {
  let income = 0;
  let expense = 0;
  let transfers = 0;
  list.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else if (isTransferCategory(t.category)) {
      transfers += t.amount;
    } else {
      expense += t.amount;
    }
  });
  return { income, expense, transfers, balance: income - expense };
}
