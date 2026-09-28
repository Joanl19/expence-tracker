import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { expensesQuery, CATEGORIES, PAYMENT_METHODS, type Expense } from "@/lib/expenses";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kharcha Expense Tracker" },
      { name: "description", content: "Export your expenses and review app preferences." },
      { property: "og:title", content: "Settings — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content: "Export your expenses and review app preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function toCsv(rows: Expense[]) {
  const header = ["Date", "Title", "Category", "Payment Method", "Amount", "Note"];
  const body = rows.map((e) =>
    [e.spent_on, e.title, e.category, e.payment_method, e.amount, e.note ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function SettingsPage() {
  const { data: expenses = [] } = useQuery(expensesQuery);

  function download() {
    const blob = new Blob([toCsv(expenses)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout title="Settings" subtitle="Preferences and data">
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} stored securely and
            available every time you open the app.
          </p>
          <Button
            onClick={download}
            disabled={expenses.length === 0}
            className="mt-4 rounded-xl"
          >
            <Download className="size-4" /> Export as CSV
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Currency</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All amounts are shown in Indian Rupees (₹).
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Payment methods</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
