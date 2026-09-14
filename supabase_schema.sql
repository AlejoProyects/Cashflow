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
  created_at          timestamptz DEFAULT now(),
  last_payment_month  text,
  is_monthly          boolean NOT NULL DEFAULT true
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

-- PLANNED EXPENSES (one-off payments planned for a month, shown in Presupuesto)
CREATE TABLE public.planned_expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        text NOT NULL,
  amount      numeric(12,2) NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  month       text NOT NULL,
  notes       text,
  created_at  timestamptz DEFAULT now()
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
ALTER TABLE public.planned_expenses ENABLE ROW LEVEL SECURITY;

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

-- Planned expenses
CREATE POLICY "planned_expenses_owner" ON public.planned_expenses
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

-- ============================================================
-- SUPERADMIN: panel de administración (lectura de todos los usuarios)
-- ============================================================

-- 1. Guardar el email en profiles (no existe hoy) para poder listar usuarios
--    sin depender de auth.users, que el cliente no puede consultar directamente.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 2. A partir de ahora, guardar el email también al crear el perfil.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- 3. Políticas RLS adicionales (SOLO LECTURA) para el superadmin.
--    Son aditivas: las políticas "*_owner" existentes se mantienen intactas,
--    así que cada usuario sigue viendo y editando solo lo suyo.
--    Cambia el correo si en algún momento cambias de cuenta admin.
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_categories" ON public.categories
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_transactions" ON public.transactions
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_debts" ON public.debts
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_fixed_payments" ON public.fixed_payments
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_budgets" ON public.budgets
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_savings_goals" ON public.savings_goals
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

CREATE POLICY "admin_read_all_planned_expenses" ON public.planned_expenses
  FOR SELECT USING (auth.jwt() ->> 'email' = 'alejo.0514.1998@gmail.com');

-- 4. Función de solo-admin que expone last_sign_in_at (de auth.users, no
--    accesible directamente vía API) junto con los datos de profiles.
--    Usamos una función SECURITY DEFINER en vez de una vista: el linter de
--    Supabase marca como error cualquier vista sobre auth.users expuesta a
--    anon/authenticated, mientras que una función puede validar el email del
--    llamador ANTES de tocar auth.users y devolver un error si no coincide.
--    search_path fijo evita hijacking de search_path; el EXECUTE se revoca
--    de "anon" explícitamente porque Supabase lo otorga por defecto.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  currency text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.jwt() ->> 'email' IS DISTINCT FROM 'alejo.0514.1998@gmail.com' THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.currency, p.created_at, u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
