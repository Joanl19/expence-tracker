import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  CATEGORIES,
  budgetsQuery,
  byCategory,
  expensesQuery,
  inMonth,
  inr,
  monthKey,
  monthLabel,
  OVERALL,
  saveBudget,
  shiftMonth,
  sum,
} from "@/lib/expenses";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Kharcha Expense Tracker" },
      {
        name: "description",
        content: "Set a monthly budget and category limits, and watch your progress live.",
      },
      { property: "og:title", content: "Budget — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content: "Set a monthly budget and category limits, and watch your progress live.",
      },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const qc = useQueryClient();
  const { data: expenses = [] } = useQuery(expensesQuery);
  const { data: budgets = [] } = useQuery(budgetsQuery);
  const [month, setMonth] = useState(monthKey(new Date()));
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: ({ category, amount }: { category: string; amount: number }) =>
      saveBudget(month, category, amount),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget saved");
    },
    onError: () => toast.error("Could not save the budget."),
  });

  const monthExpenses = inMonth(expenses, month);
  const spentTotal = sum(monthExpenses);
  const catSpend = new Map(byCategory(monthExpenses).map((c) => [c.category, c.total]));
  const budgetFor = (cat: string) =>
    Number(budgets.find((b) => b.month === month && b.category === cat)?.amount ?? 0);
  const overall = budgetFor(OVERALL);
  const key = (cat: string) => `${month}:${cat}`;
  const valueFor = (cat: string) =>
    drafts[key(cat)] ?? (budgetFor(cat) > 0 ? String(budgetFor(cat)) : "");

  function save(cat: string) {
    const raw = valueFor(cat);
    const amount = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    mutation.mutate({ category: cat, amount });
  }

  const usedPct = overall > 0 ? Math.round((spentTotal / overall) * 100) : 0;

  return (
    <AppLayout
      title="Budget"
      subtitle="Set limits and track them in real time"
      actions={
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-lg"
            aria-label="Previous month"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium">{monthLabel(month)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-lg"
            aria-label="Next month"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold">Monthly overall budget</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs space-y-1.5">
              <Label htmlFor="overall">Amount (₹)</Label>
              <Input
                id="overall"
                inputMode="decimal"
                placeholder="25000"
                value={valueFor(OVERALL)}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [key(OVERALL)]: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <Button className="rounded-xl" onClick={() => save(OVERALL)}>
              Save
            </Button>
          </div>
          {overall > 0 ? (
            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span>
                  Spent <strong className="font-display">{inr(spentTotal)}</strong> of{" "}
                  {inr(overall)}
                </span>
                <span
                  className={
                    usedPct > 100
                      ? "text-destructive"
                      : usedPct >= 80
                        ? "text-warning"
                        : "text-success"
                  }
                >
                  {overall - spentTotal >= 0
                    ? `${inr(overall - spentTotal)} left`
                    : `${inr(spentTotal - overall)} over`}
                </span>
              </div>
              <Progress value={Math.min(usedPct, 100)} className="mt-2 h-2.5" />
              {usedPct >= 80 ? (
                <p className="mt-2 text-xs text-warning">
                  {usedPct > 100
                    ? "You have exceeded this month's budget."
                    : "You are approaching this month's budget."}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No overall budget set for {monthLabel(month)}.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-semibold">Category budgets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. Leave blank or set 0 to remove a limit.
          </p>
          <ul className="mt-5 space-y-5">
            {CATEGORIES.map((cat) => {
              const limit = budgetFor(cat);
              const spent = catSpend.get(cat) ?? 0;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              return (
                <li key={cat} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-medium">{cat}</p>
                      <p className="text-xs text-muted-foreground">
                        Spent {inr(spent)}
                        {limit > 0 ? ` of ${inr(limit)} (${pct}%)` : ""}
                      </p>
                    </div>
                    <div className="flex items-end gap-2">
                      <Input
                        inputMode="decimal"
                        placeholder="0"
                        value={valueFor(cat)}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [key(cat)]: e.target.value }))
                        }
                        className="w-32 rounded-xl"
                        aria-label={`${cat} budget`}
                      />
                      <Button variant="outline" className="rounded-xl" onClick={() => save(cat)}>
                        Save
                      </Button>
                    </div>
                  </div>
                  {limit > 0 ? (
                    <Progress value={Math.min(pct, 100)} className="mt-3 h-1.5" />
                  ) : null}
                  {limit > 0 && pct >= 80 ? (
                    <p className="mt-1.5 text-xs text-warning">
                      {pct > 100 ? `Over by ${inr(spent - limit)}` : "Approaching the limit"}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
