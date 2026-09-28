import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseForm, type ExpenseValues } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  deleteExpense,
  expensesQuery,
  inr,
  monthKey,
  shiftMonth,
  sum,
  todayISO,
  updateExpense,
  type Expense,
} from "@/lib/expenses";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expense History — Kharcha Expense Tracker" },
      {
        name: "description",
        content: "Search, filter, edit and delete every expense you have recorded.",
      },
      { property: "og:title", content: "Expense History — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content: "Search, filter, edit and delete every expense you have recorded.",
      },
    ],
  }),
  component: ExpensesPage,
});

type RangeKey = "all" | "today" | "week" | "month" | "last" | "custom";

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function ExpensesPage() {
  const qc = useQueryClient();
  const { data: expenses = [], isLoading } = useQuery(expensesQuery);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("month");
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const editMutation = useMutation({
    mutationFn: (values: ExpenseValues) => updateExpense(editing!.id, values),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      setEditing(null);
      toast.success("Expense updated");
    },
    onError: () => toast.error("Could not update the expense."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      setDeleting(null);
      toast.success("Expense deleted");
    },
    onError: () => toast.error("Could not delete the expense."),
  });

  const filtered = useMemo(() => {
    const thisMonth = monthKey(new Date());
    return expenses.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (method !== "all" && e.payment_method !== method) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !e.title.toLowerCase().includes(q) &&
          !(e.note ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      if (range === "today") return e.spent_on === todayISO();
      if (range === "week") return e.spent_on >= startOfWeek();
      if (range === "month") return monthKey(e.spent_on) === thisMonth;
      if (range === "last") return monthKey(e.spent_on) === shiftMonth(thisMonth, -1);
      if (range === "custom") return e.spent_on >= from && e.spent_on <= to;
      return true;
    });
  }, [expenses, category, method, search, range, from, to]);

  return (
    <AppLayout
      title="Expenses"
      subtitle={`${filtered.length} matching · ${inr(sum(filtered))}`}
      actions={
        <Button asChild className="rounded-xl">
          <Link to="/add">
            <Plus className="size-4" /> Add Expense
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or note"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Period</Label>
              <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="last">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {range === "custom" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : expenses.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <EmptyState message="No expenses match these filters." showAction={false} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {e.category} · {e.payment_method} ·{" "}
                    {new Date(e.spent_on + "T00:00:00").toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {e.note ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground italic">{e.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-display font-semibold">{inr(Number(e.amount))}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl"
                    aria-label="Edit expense"
                    onClick={() => setEditing(e)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-xl text-destructive"
                    aria-label="Delete expense"
                    onClick={() => setDeleting(e)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit expense</DialogTitle>
          </DialogHeader>
          {editing ? (
            <ExpenseForm
              initial={editing}
              submitLabel="Save changes"
              pending={editMutation.isPending}
              onSubmit={(v) => editMutation.mutate(v)}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be removed permanently and all totals will update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
