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

export const PERSO_CATEGORIES = [
  { key: "salary", label: "Salaire", emoji: "💼", type: "income" as TxType },
  { key: "gift", label: "Cadeau", emoji: "🎁", type: "income" as TxType },
  { key: "food", label: "Courses", emoji: "🛒", type: "expense" as TxType },
  { key: "restaurant", label: "Resto", emoji: "🍽️", type: "expense" as TxType },
  { key: "transport", label: "Transport", emoji: "🚇", type: "expense" as TxType },
  { key: "rent", label: "Loyer", emoji: "🏠", type: "expense" as TxType },
  { key: "leisure", label: "Loisirs", emoji: "🎮", type: "expense" as TxType },
  { key: "health", label: "Santé", emoji: "💊", type: "expense" as TxType },
  { key: "shopping", label: "Shopping", emoji: "🛍️", type: "expense" as TxType },
  { key: "other", label: "Autre", emoji: "✨", type: "expense" as TxType },
];

export const PRO_CATEGORIES = [
  { key: "client", label: "Client", emoji: "💰", type: "income" as TxType },
  { key: "subscription", label: "Abonnement", emoji: "🔁", type: "income" as TxType },
  { key: "saas", label: "SaaS / Outils", emoji: "🛠️", type: "expense" as TxType },
  { key: "marketing", label: "Marketing", emoji: "📣", type: "expense" as TxType },
  { key: "office", label: "Bureau", emoji: "🏢", type: "expense" as TxType },
  { key: "tax", label: "Taxes / URSSAF", emoji: "🧾", type: "expense" as TxType },
  { key: "freelance", label: "Sous-traitance", emoji: "👥", type: "expense" as TxType },
  { key: "travel", label: "Déplacement", emoji: "✈️", type: "expense" as TxType },
  { key: "other_pro", label: "Autre", emoji: "✨", type: "expense" as TxType },
];

export function getCategories(account: AccountType) {
  return account === "pro" ? PRO_CATEGORIES : PERSO_CATEGORIES;
}

export function findCategory(account: AccountType, key: string) {
  return getCategories(account).find((c) => c.key === key);
}
