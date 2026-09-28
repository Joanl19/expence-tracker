CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL DEFAULT 'Other',
  payment_method text NOT NULL DEFAULT 'Cash',
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT ALL ON public.expenses TO service_role;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read expenses" ON public.expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert expenses" ON public.expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update expenses" ON public.expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete expenses" ON public.expenses FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX expenses_spent_on_idx ON public.expenses (spent_on DESC);

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  category text NOT NULL DEFAULT 'ALL',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO anon, authenticated;
GRANT ALL ON public.budgets TO service_role;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read budgets" ON public.budgets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert budgets" ON public.budgets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update budgets" ON public.budgets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete budgets" ON public.budgets FOR DELETE TO anon, authenticated USING (true);
