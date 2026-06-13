# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"cashflow" — a personal finance tracker SPA (Spanish-language UI). Tracks transactions, debts, recurring fixed payments, budgets, savings goals, and categories. React 19 + Vite, Tailwind, Supabase (Postgres + Auth). There is no backend server; the client talks to Supabase directly.

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # Production build
npm run preview  # Serve the production build
npm run lint     # ESLint over the repo
```

There is **no test runner** configured — do not assume `npm test` exists.

Requires a `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (read in [src/lib/supabase.js](src/lib/supabase.js)). The app will not load without them.

## Architecture

**Data layer = one custom hook per entity.** Each hook in [src/hooks/](src/hooks/) (`useTransactions`, `useDebts`, `useFixedPayments`, `useCategories`, `useBudgets`, `useGoals`) is self-contained: it owns its `supabase` queries, local `data`/`loading` state, a `useCallback`-memoized `refetch`/`fetch`, and CRUD methods that mutate then re-fetch. Pages consume these hooks directly — there is no Redux/Zustand/Context data store. To change how an entity is read or written, edit its hook, not the pages.

**Every query is scoped to the signed-in user** via `.eq('user_id', user.id)`. The hooks read `user` from `useAuth()` and no-op while it is null. Row-level security in Supabase is the second line of defense; the client filter is the first. Always preserve the `user_id` filter when editing queries.

**Auth & providers.** [src/hooks/useAuth.jsx](src/hooks/useAuth.jsx) wraps Supabase auth in a context (`AuthProvider`), exposing `signUp/signIn/signOut/resetPassword/updatePassword/updateProfile`. It deliberately keeps the same `user` object reference across token refreshes (compares `prev?.id === next?.id`) so that hooks with `[user]` deps don't needlessly re-run. [src/hooks/useTheme.jsx](src/hooks/useTheme.jsx) is the other provider. Both wrap the app in [src/App.jsx](src/App.jsx), where all `/`-prefixed routes sit behind `PrivateRoute` + `Layout`.

**Cross-entity side effects live in `useTransactions`.** A transaction can carry a `debt_id` or a `fixed_payment_id`. On `add`/`remove`, [src/hooks/useTransactions.js](src/hooks/useTransactions.js) reaches into the `debts` / `fixed_payments` tables to keep them in sync: linking a transaction advances debt installments / marks a fixed payment `paid`; deleting it reverts them. This is the one place hooks touch tables other than their own — keep this bidirectional sync intact when modifying transaction logic.

**Date-range filtering.** `useTransactions({ startDate, endDate })` filters by date; passing `{ all: true }` bypasses the date filter entirely (used by the Transactions page's "Todo" preset). Date helpers (`currentMonth`, `monthStart`, `monthEnd`, formatters) are centralized in [src/utils/dateHelpers.js](src/utils/dateHelpers.js) and use `date-fns` with the Spanish (`es`) locale. `fixed_payments` are **per-month** records keyed by a `'yyyy-MM'` `month` column; `ensureMonthExists` clones the previous month's templates into the current month on first visit.

**Categories auto-seed.** A new user (or any user with zero categories) gets `DEFAULT_CATEGORIES` inserted automatically — this happens both in `useAuth` on signup and defensively in `useCategories`. The list is duplicated in both files; keep them in sync.

## Database

Schema changes are applied **manually in the Supabase SQL editor** — there are no migration files in the repo. When a feature needs a new column/table, provide the SQL and tell the user to run it. Known tables: `categories`, `transactions` (FKs `category_id`, `debt_id`, `fixed_payment_id`), `debts`, `fixed_payments`, `budgets`, `goals`. PostgREST embedded selects (e.g. `select('*, categories(...), debts(id,name), fixed_payments(id,name)')`) require the FK column to exist in the DB, or the query fails and returns null.

## Styling

Tailwind with a **CSS-variable theme system**, not Tailwind's color config. [src/index.css](src/index.css) defines 7 themes via `[data-theme="..."]` blocks (set on `<html>` by `useTheme`, persisted to `localStorage`). Colors are space-separated RGB channels (`--p`, `--pl`, `--pd`, `--ac`) so Tailwind opacity modifiers like `bg-primary/15` work. Reusable component classes (`.card`, `.btn-primary`, `.input`, `.label`, `.badge-*`, `.gradient-*`, `.nav-link`) are defined in `@layer components`/`@layer utilities` there — prefer these over ad-hoc utility soup, and add new shared patterns to `index.css` rather than repeating long class strings.

## Conventions

- Forms use **react-hook-form + Zod** (`zodResolver`); define the schema inline at the top of the form component.
- Icons are from `lucide-react`; currency via `formatCurrency` ([src/utils/formatCurrency.js](src/utils/formatCurrency.js)).
- UI strings are Spanish — match the existing tone when adding copy.
- Pages live in [src/pages/](src/pages/) (one folder per route, page + its forms); shared UI primitives in [src/components/ui/](src/components/ui/), layout in [src/components/layout/](src/components/layout/).
