import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { ExpenseForm, type ExpenseValues } from "@/components/ExpenseForm";
import { createExpense } from "@/lib/expenses";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add Expense — Kharcha Expense Tracker" },
      {
        name: "description",
        content: "Record a new expense with amount, category, date and payment method.",
      },
      { property: "og:title", content: "Add Expense — Kharcha Expense Tracker" },
      {
        property: "og:description",
        content: "Record a new expense with amount, category, date and payment method.",
      },
    ],
  }),
  component: AddExpensePage,
});

function AddExpensePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: ExpenseValues) => createExpense(values),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added");
      navigate({ to: "/" });
    },
    onError: () => toast.error("Could not save the expense. Please try again."),
  });

  return (
    <AppLayout title="Add Expense" subtitle="Record what you just spent">
      <div className="max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <ExpenseForm pending={mutation.isPending} onSubmit={(v) => mutation.mutate(v)} />
      </div>
    </AppLayout>
  );
}
