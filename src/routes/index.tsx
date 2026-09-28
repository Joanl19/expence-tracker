import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Lightbulb, PiggyBank, Plus, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  budgetsQuery,
  byCategory,
  byDay,
  expensesQuery,
  inMonth,
  inr,
  monthKey,
  monthLabel,
  OVERALL,
  shiftMonth,
  sum,
  todayISO,
} from "@/lib/expenses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kharcha Expense Tracker" },
      {
        name: "description",
        content:
          "Track daily spending, monthly budgets and category-wise expenses in one clean dashboard.",
      },
      { property: "og:title", content: "Dashboard — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content:
          "Track daily spending, monthly budgets and category-wise expenses in one clean dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: expenses = [], isLoading } = useQuery(expensesQuery);
  const { data: budgets = [] } = useQuery(budgetsQuery);

  const thisMonth = monthKey(new Date());
  const lastMonth = shiftMonth(thisMonth, -1);
  const current = inMonth(expenses, thisMonth);
  const previous = inMonth(expenses, lastMonth);

  const total = sum(current);
  const prevTotal = sum(previous);
  const today = sum(current.filter((e) => e.spent_on === todayISO()));
  const budget = Number(
    budgets.find((b) => b.month === thisMonth && b.category === OVERALL)?.amount ?? 0,
  );
  const remaining = budget - total;
  const used = budget > 0 ? Math.round((total / budget) * 100) : 0;
  const categories = byCategory(current);
  const daysSoFar = new Date().getDate();
  const avgDaily = total / daysSoFar;
  const diff = total - prevTotal;

  const insights: string[] = [];
  if (categories.length > 0)
    insights.push(`Your highest spending category this month is ${categories[0]!.category}.`);
  if (prevTotal > 0)
    insights.push(
      diff >= 0
        ? `You spent ${inr(diff)} more than last month.`
        : `You spent ${inr(Math.abs(diff))} less than last month.`,
    );
  if (total > 0) insights.push(`Your average daily spending is ${inr(avgDaily)}.`);
  if (budget > 0) insights.push(`You have used ${used}% of your monthly budget.`);

  return (
    <AppLayout
      title="Dashboard"
      subtitle={monthLabel(thisMonth)}
      actions={
        <Button asChild className="rounded-xl">
          <Link to="/add">
            <Plus className="size-4" /> Add Expense
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your expenses…</p>
      ) : expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Spent"
              value={inr(total)}
              hint="This month"
              icon={Receipt}
            />
            <StatCard
              label="Monthly Budget"
              value={budget > 0 ? inr(budget) : "Not set"}
              hint={budget > 0 ? `${used}% used` : "Set one in Budget"}
              icon={Wallet}
            />
            <StatCard
              label="Remaining"
              value={budget > 0 ? inr(remaining) : "—"}
              hint={budget > 0 && remaining < 0 ? "Over budget" : "Left to spend"}
              icon={PiggyBank}
              tone={budget > 0 ? (remaining < 0 ? "danger" : "success") : "default"}
            />
            <StatCard
              label="Today"
              value={inr(today)}
              hint={`${current.length} transaction${current.length === 1 ? "" : "s"} this month`}
              icon={CalendarDays}
            />
          </div>

          {budget > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Budget usage</span>
                <span
                  className={
                    used > 100
                      ? "text-destructive"
                      : used >= 80
                        ? "text-warning"
                        : "text-success"
                  }
                >
                  {inr(total)} of {inr(budget)} ({used}%)
                </span>
              </div>
              <Progress value={Math.min(used, 100)} className="mt-3 h-2.5" />
              {used >= 80 ? (
                <p className="mt-2 text-xs text-warning">
                  {used > 100
                    ? "You have exceeded your monthly budget."
                    : "You are close to your monthly budget."}
                </p>
              ) : null}
            </div>
          ) : null}

          {insights.length > 0 ? (
            <div className="rounded-2xl border border-border bg-accent/40 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-primary" /> Insights
              </div>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {insights.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">Daily spending</h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {diff >= 0 ? (
                    <TrendingUp className="size-3.5 text-destructive" />
                  ) : (
                    <TrendingDown className="size-3.5 text-success" />
                  )}
                  vs {monthLabel(lastMonth)}: {inr(prevTotal)}
                </span>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay(current, thisMonth)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={45} />
                    <Tooltip
                      formatter={(v: number) => inr(v)}
                      labelFormatter={(l) => `Day ${l}`}
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
              <h2 className="font-display font-semibold">By category</h2>
              {categories.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing spent this month.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {categories.map((c) => (
                    <li key={c.category}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className="text-muted-foreground">{inr(c.total)}</span>
                      </div>
                      <Progress
                        value={total > 0 ? (c.total / total) * 100 : 0}
                        className="mt-1.5 h-1.5"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold">Recent transactions</h2>
              <Link to="/expenses" className="text-sm font-medium text-primary">
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {expenses.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category} · {e.payment_method} ·{" "}
                      {new Date(e.spent_on + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="font-display font-semibold">{inr(Number(e.amount))}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
