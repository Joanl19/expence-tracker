import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  byCategory,
  byDay,
  daysInMonth,
  expensesQuery,
  inMonth,
  inr,
  monthKey,
  monthLabel,
  shiftMonth,
  sum,
} from "@/lib/expenses";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Monthly Report — Kharcha Expense Tracker" },
      {
        name: "description",
        content:
          "Monthly analytics: category breakdown, daily spending trends and month-to-month comparison.",
      },
      { property: "og:title", content: "Monthly Report — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content:
          "Monthly analytics: category breakdown, daily spending trends and month-to-month comparison.",
      },
    ],
  }),
  component: ReportsPage,
});

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function ReportsPage() {
  const { data: expenses = [], isLoading } = useQuery(expensesQuery);
  const [month, setMonth] = useState(monthKey(new Date()));

  const current = inMonth(expenses, month);
  const previous = inMonth(expenses, shiftMonth(month, -1));
  const total = sum(current);
  const prevTotal = sum(previous);
  const diff = total - prevTotal;
  const cats = byCategory(current);
  const highest = current.reduce<number>((m, e) => Math.max(m, Number(e.amount)), 0);
  const isCurrentMonth = month === monthKey(new Date());
  const days = isCurrentMonth ? new Date().getDate() : daysInMonth(month);
  const avgDaily = total / days;

  const trend = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonth(month, -(5 - i));
    return {
      month: new Date(key + "T00:00:00").toLocaleDateString("en-IN", { month: "short" }),
      total: sum(inMonth(expenses, key)),
    };
  });

  return (
    <AppLayout
      title="Monthly Report"
      subtitle="Analytics built from your recorded expenses"
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
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : expenses.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total expenses" value={inr(total)} hint={monthLabel(month)} />
            <StatCard label="Transactions" value={String(current.length)} hint="This month" />
            <StatCard
              label="Top category"
              value={cats[0]?.category ?? "—"}
              hint={cats[0] ? inr(cats[0].total) : "No spending"}
            />
            <StatCard
              label="Average per day"
              value={inr(avgDaily)}
              hint={`Highest single: ${inr(highest)}`}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-display font-semibold">Monthly comparison</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
              <span>
                {monthLabel(month)}:{" "}
                <strong className="font-display">{inr(total)}</strong>
              </span>
              <span className="text-muted-foreground">
                {monthLabel(shiftMonth(month, -1))}:{" "}
                <strong className="font-display">{inr(prevTotal)}</strong>
              </span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  diff > 0 ? "text-destructive" : "text-success"
                }`}
              >
                {diff > 0 ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
                {diff === 0
                  ? "No change"
                  : `${diff > 0 ? "Increased" : "Decreased"} by ${inr(Math.abs(diff))}`}
              </span>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} />
                  <Tooltip
                    formatter={(v: number) => inr(v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-display font-semibold">Category split</h2>
              {cats.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No spending this month.</p>
              ) : (
                <>
                  <div className="mt-2 h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cats}
                          dataKey="total"
                          nameKey="category"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {cats.map((c, i) => (
                            <Cell key={c.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => inr(v)}
                          contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {cats.map((c, i) => (
                      <li key={c.category} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          {c.category}
                        </span>
                        <span className="text-muted-foreground">{inr(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-display font-semibold">Daily trend</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={byDay(current, month)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={50} />
                    <Tooltip
                      formatter={(v: number) => inr(v)}
                      labelFormatter={(l) => `Day ${l}`}
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
