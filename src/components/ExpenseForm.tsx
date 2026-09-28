import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, PAYMENT_METHODS, todayISO, type Expense } from "@/lib/expenses";

export type ExpenseValues = {
  title: string;
  amount: number;
  category: string;
  payment_method: string;
  spent_on: string;
  note: string | null;
};

export function ExpenseForm({
  initial,
  submitLabel = "Save Expense",
  pending,
  onSubmit,
  onCancel,
}: {
  initial?: Expense;
  submitLabel?: string;
  pending?: boolean;
  onSubmit: (values: ExpenseValues) => void;
  onCancel?: () => void;
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Food");
  const [method, setMethod] = useState(initial?.payment_method ?? "UPI");
  const [date, setDate] = useState(initial?.spent_on ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) next["amount"] = "Enter an amount above 0";
    if (!title.trim()) next["title"] = "Add a short title";
    if (!date) next["date"] = "Pick a date";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      title: title.trim(),
      amount: value,
      category,
      payment_method: method,
      spent_on: date,
      note: note.trim() ? note.trim() : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-14 rounded-xl font-display text-2xl font-semibold"
        />
        {errors["amount"] ? (
          <p className="text-xs text-destructive">{errors["amount"]}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title / description</Label>
        <Input
          id="title"
          placeholder="Lunch with team"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
        {errors["title"] ? <p className="text-xs text-destructive">{errors["title"]}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Payment method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl"
        />
        {errors["date"] ? <p className="text-xs text-destructive">{errors["date"]}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          placeholder="Anything worth remembering"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="h-11 flex-1 rounded-xl">
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
