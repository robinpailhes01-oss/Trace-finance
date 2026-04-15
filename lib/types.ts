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
  { key: "salary", label: "Salaire", emoji: "💼", type: "income" },
  { key: "freelance", label: "Freelance", emoji: "💻", type: "income" },
  { key: "other_income", label: "Autre", emoji: "✨", type: "income" },

  { key: "rent", label: "Logement", emoji: "🏠", type: "expense" },
  { key: "food", label: "Courses", emoji: "🛒", type: "expense" },
  { key: "transport", label: "Transport", emoji: "🚇", type: "expense" },
  { key: "restaurant", label: "Resto", emoji: "🍽️", type: "expense" },
  { key: "shopping", label: "Shopping", emoji: "🛍️", type: "expense" },
  { key: "subscription", label: "Abonnements", emoji: "🔁", type: "expense" },
  { key: "other_expense", label: "Autre", emoji: "✨", type: "expense" },
];

export const PRO_CATEGORIES: Category[] = [
  { key: "client", label: "Client", emoji: "💰", type: "income" },
  { key: "freelance_pro", label: "Freelance", emoji: "💻", type: "income" },
  { key: "other_income_pro", label: "Autre", emoji: "✨", type: "income" },

  { key: "saas", label: "SaaS / Outils", emoji: "🛠️", type: "expense" },
  { key: "marketing", label: "Marketing", emoji: "📣", type: "expense" },
  { key: "office", label: "Bureau", emoji: "🏢", type: "expense" },
  { key: "tax", label: "Taxes / URSSAF", emoji: "🧾", type: "expense" },
  { key: "subcontract", label: "Sous-traitance", emoji: "👥", type: "expense" },
  { key: "travel", label: "Déplacement", emoji: "✈️", type: "expense" },
  { key: "other_expense_pro", label: "Autre", emoji: "✨", type: "expense" },
];

export function getCategories(account: AccountType): Category[] {
  return account === "pro" ? PRO_CATEGORIES : PERSO_CATEGORIES;
}

export function findCategory(account: AccountType, key: string): Category | undefined {
  return getCategories(account).find((c) => c.key === key);
}
