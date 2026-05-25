-- ============================================================
-- FINANCE TRACKER — Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- PROFILES
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   text,
  currency    text DEFAULT 'COP',
  created_at  timestamptz DEFAULT now()
);

-- CATEGORIES
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('income', 'expense')),
  color       text,
  icon        text,
  created_at  timestamptz DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category_id   uuid REFERENCES public.categories ON DELETE SET NULL,
  type          text NOT NULL CHECK (type IN ('income', 'expense')),
  amount        numeric(12,2) NOT NULL,
  description   text NOT NULL,
  date          date NOT NULL,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- DEBTS
CREATE TABLE public.debts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name                text NOT NULL,
  installment_amount  numeric(12,2) NOT NULL,
  total_installments  integer NOT NULL,
  paid_installments   integer DEFAULT 0,
  total_amount        numeric(12,2) NOT NULL,
  paid_amount         numeric(12,2) DEFAULT 0,
  status              text DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  notes               text,
  created_at          timestamptz DEFAULT now()
);

-- FIXED PAYMENTS
CREATE TABLE public.fixed_payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category_id  uuid REFERENCES public.categories ON DELETE SET NULL,
  name         text NOT NULL,
  amount       numeric(12,2) NOT NULL,
  due_day      int NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  status       text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  month        text NOT NULL,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- BUDGETS
CREATE TABLE public.budgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category_id   uuid REFERENCES public.categories ON DELETE CASCADE,
  month         text NOT NULL,
  limit_amount  numeric(12,2) NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, category_id, month)
);

-- SAVINGS GOALS
CREATE TABLE public.savings_goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name            text NOT NULL,
  target_amount   numeric(12,2) NOT NULL,
  saved_amount    numeric(12,2) DEFAULT 0,
  target_date     date,
  status          text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_owner" ON public.profiles
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Categories
CREATE POLICY "categories_owner" ON public.categories
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Transactions
CREATE POLICY "transactions_owner" ON public.transactions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Debts
CREATE POLICY "debts_owner" ON public.debts
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fixed payments
CREATE POLICY "fixed_payments_owner" ON public.fixed_payments
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Budgets
CREATE POLICY "budgets_owner" ON public.budgets
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Savings goals
CREATE POLICY "savings_goals_owner" ON public.savings_goals
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
