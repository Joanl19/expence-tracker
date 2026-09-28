import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  "Food",
  "Grocery",
  "Travel",
  "Shopping",
  "Bills",
  "Rent",
  "Entertainment",
  "Health",
  "Education",
  "Recharge",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
  "Other",
] as const;

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_method: string;
  spent_on: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  month: string;
  category: string;
  amount: number;
};

export const OVERALL = "ALL";

export function inr(value: number) {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

export function monthKey(d: Date | string) {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(key: string) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftMonth(key: string, delta: number) {
  const d = new Date(key + "T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
}

export function daysInMonth(key: string) {
  const d = new Date(key + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/* ---------- data access ---------- */

export const expensesQuery = {
  queryKey: ["expenses"],
  queryFn: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Expense[];
  },
};

export const budgetsQuery = {
  queryKey: ["budgets"],
  queryFn: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from("budgets").select("*");
    if (error) throw error;
    return (data ?? []) as Budget[];
  },
};

export async function createExpense(input: Omit<Expense, "id" | "created_at" | "updated_at">) {
  const { error } = await supabase.from("expenses").insert(input);
  if (error) throw error;
}

export async function updateExpense(
  id: string,
  input: Partial<Omit<Expense, "id" | "created_at" | "updated_at">>,
) {
  const { error } = await supabase
    .from("expenses")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function saveBudget(month: string, category: string, amount: number) {
  if (amount <= 0) {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("month", month)
      .eq("category", category);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("budgets")
    .upsert({ month, category, amount }, { onConflict: "month,category" });
  if (error) throw error;
}

/* ---------- derived stats ---------- */

export function inMonth(list: Expense[], key: string) {
  return list.filter((e) => monthKey(e.spent_on) === key);
}

export function sum(list: Expense[]) {
  return list.reduce((t, e) => t + Number(e.amount), 0);
}

export function byCategory(list: Expense[]) {
  const map = new Map<string, number>();
  for (const e of list) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function byDay(list: Expense[], key: string) {
  const days = daysInMonth(key);
  const totals = Array.from({ length: days }, (_, i) => ({ day: String(i + 1), total: 0 }));
  for (const e of list) {
    const d = new Date(e.spent_on + "T00:00:00").getDate();
    totals[d - 1]!.total += Number(e.amount);
  }
  return totals;
}
