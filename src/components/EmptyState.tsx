import { Link } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  message = "No expenses recorded yet.",
  showAction = true,
}: {
  message?: string;
  showAction?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Receipt className="size-6" />
      </span>
      <p className="font-medium">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Start tracking where your money goes.
      </p>
      {showAction ? (
        <Button asChild className="mt-5 rounded-xl">
          <Link to="/add">Add Expense</Link>
        </Button>
      ) : null}
    </div>
  );
}
