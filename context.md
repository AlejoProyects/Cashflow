# Finance Tracker — Plan de proyecto

## Resumen del proyecto

Sistema web multiusuario para control de finanzas personales. Cada usuario gestiona sus propios datos (ingresos, gastos, deudas, pagos fijos, presupuesto y metas de ahorro) de forma completamente aislada. Diseñado para usarse tanto en escritorio como en móvil.

**Stack:** React + Vite · Supabase (Auth + PostgreSQL) · Vercel  
**Acceso:** Web responsive (mobile-first)  
**Usuarios:** Múltiples, cada uno ve solo sus datos (RLS)

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| Dashboard | Vista resumen del mes: saldo, gastos por categoría, deudas pendientes, próximos pagos |
| Ingresos y gastos | Registro de transacciones con categoría, fecha, monto y nota opcional |
| Gestión de deudas | Lista de deudas con monto total, pagado, saldo restante y fecha límite |
| Pagos fijos | Planificador de gastos recurrentes mensuales con estado pagado/pendiente |
| Presupuesto | Límites por categoría, barra de progreso y alertas de exceso |
| Metas de ahorro | Objetivos con progreso, fecha meta y aporte mensual estimado |

---

## Arquitectura

```
Frontend (React + Vercel)
  └── Supabase Auth (registro, login, sesión)
        └── Supabase DB / PostgreSQL
              ├── transactions       → ingresos y gastos
              ├── debts              → deudas activas
              ├── fixed_payments     → pagos recurrentes
              ├── budgets            → límites por categoría
              ├── savings_goals      → metas de ahorro
              ├── categories         → categorías personalizadas
              └── profiles           → datos del usuario
```

**Aislamiento de datos:** Row Level Security (RLS) en todas las tablas filtrando por `user_id`. Un usuario nunca puede ver ni modificar datos de otro.

---

## Esquema de base de datos

### `profiles`
Extendida del sistema de auth de Supabase.

```sql
id          uuid  PK  → auth.users.id
full_name   text
currency    text  DEFAULT 'COP'
created_at  timestamptz
```

### `categories`
Categorías personalizadas por usuario (ej: Alimentación, Transporte, Salud).

```sql
id          uuid  PK
user_id     uuid  FK → auth.users
name        text
type        text  CHECK (type IN ('income', 'expense'))
color       text  (hex, para visualización)
icon        text  (nombre de ícono opcional)
created_at  timestamptz
```

### `transactions`
Registro principal de ingresos y gastos.

```sql
id            uuid  PK
user_id       uuid  FK → auth.users
category_id   uuid  FK → categories
type          text  CHECK (type IN ('income', 'expense'))
amount        numeric(12,2)
description   text
date          date
notes         text  (opcional)
created_at    timestamptz
```

### `debts`
Deudas activas del usuario.

```sql
id              uuid  PK
user_id         uuid  FK → auth.users
name            text  (ej: "Préstamo banco", "Tarjeta de crédito")
total_amount    numeric(12,2)
paid_amount     numeric(12,2)  DEFAULT 0
interest_rate   numeric(5,2)   (% anual, opcional)
due_date        date           (opcional)
status          text  CHECK (status IN ('active', 'paid'))
notes           text
created_at      timestamptz
```

### `fixed_payments`
Gastos fijos mensuales (servicios, suscripciones, arriendo, etc.).

```sql
id           uuid  PK
user_id      uuid  FK → auth.users
category_id  uuid  FK → categories
name         text
amount       numeric(12,2)
due_day      int   CHECK (due_day BETWEEN 1 AND 31)  (día del mes)
status       text  CHECK (status IN ('pending', 'paid'))  (reset mensual)
month        text  (formato YYYY-MM, para historial)
notes        text
created_at   timestamptz
```

### `budgets`
Límites de gasto por categoría y mes.

```sql
id            uuid  PK
user_id       uuid  FK → auth.users
category_id   uuid  FK → categories
month         text  (formato YYYY-MM)
limit_amount  numeric(12,2)
created_at    timestamptz
```

### `savings_goals`
Metas de ahorro con seguimiento de progreso.

```sql
id              uuid  PK
user_id         uuid  FK → auth.users
name            text  (ej: "Viaje", "Emergencias", "Computador")
target_amount   numeric(12,2)
saved_amount    numeric(12,2)  DEFAULT 0
target_date     date           (opcional)
status          text  CHECK (status IN ('active', 'completed'))
notes           text
created_at      timestamptz
```

---

## Políticas RLS (Row Level Security)

Todas las tablas deben tener RLS habilitado. Política base para cada tabla:

```sql
-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: solo el dueño puede ver y modificar sus registros
CREATE POLICY "user_owns_rows" ON transactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Aplicar el mismo patrón a: `categories`, `debts`, `fixed_payments`, `budgets`, `savings_goals`, `profiles`.

---

## Estructura de carpetas (React)

```
src/
├── components/
│   ├── ui/                  → botones, inputs, modales, badges reutilizables
│   ├── layout/              → Sidebar, Navbar, Layout principal
│   └── shared/              → gráficas, tarjetas de resumen, etc.
├── pages/
│   ├── Auth/                → Login.jsx, Register.jsx
│   ├── Dashboard/           → Dashboard.jsx
│   ├── Transactions/        → TransactionList.jsx, TransactionForm.jsx
│   ├── Debts/               → DebtList.jsx, DebtForm.jsx
│   ├── FixedPayments/       → FixedPaymentList.jsx
│   ├── Budgets/             → BudgetList.jsx, BudgetProgress.jsx
│   └── Goals/               → GoalList.jsx, GoalDetail.jsx
├── hooks/
│   ├── useAuth.js           → contexto de autenticación
│   ├── useTransactions.js
│   ├── useDebts.js
│   ├── useFixedPayments.js
│   ├── useBudgets.js
│   └── useGoals.js
├── lib/
│   └── supabase.js          → cliente de Supabase
├── utils/
│   ├── formatCurrency.js    → formato COP, USD, etc.
│   └── dateHelpers.js       → helpers de fecha/mes
└── App.jsx                  → rutas principales
```

---

## Flujo de autenticación

1. Usuario entra a `/login` o `/register`
2. Supabase Auth maneja el registro y login
3. Al autenticarse, se crea automáticamente un registro en `profiles` (trigger en Supabase)
4. React Router protege todas las rutas con un componente `<PrivateRoute>`
5. El `user_id` del token de sesión es usado por RLS para filtrar todos los datos

### Trigger para crear perfil automáticamente

```sql
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
```

---

## Páginas y funcionalidades por módulo

### Dashboard
- Resumen del mes actual: total ingresos, total gastos, saldo neto
- Gráfica de gastos por categoría (dona o barras)
- Deudas activas: total adeudado y progreso general
- Próximos pagos fijos del mes (ordenados por día de vencimiento)
- Progreso de metas de ahorro activas

### Ingresos y gastos
- Lista de transacciones del mes (filtrable por tipo, categoría, fecha)
- Formulario para agregar transacción (tipo, categoría, monto, fecha, nota)
- Editar y eliminar transacción
- Resumen mensual: totales por tipo y por categoría

### Gestión de deudas
- Lista de deudas activas con: nombre, total, pagado, saldo, progreso
- Formulario para registrar nueva deuda
- Acción: registrar abono (incrementa `paid_amount`)
- Marcar deuda como pagada
- Ver historial de abonos (opcional, fase 2)

### Pagos fijos
- Lista de pagos del mes agrupados por estado (pendiente / pagado)
- Marcar como pagado (actualiza `status`)
- Formulario para agregar nuevo pago fijo recurrente
- Cada inicio de mes se generan automáticamente los registros del mes (lógica en el cliente al detectar mes nuevo, o función de Supabase)

### Presupuesto
- Definir límite mensual por categoría
- Barra de progreso: gastado vs límite
- Alerta visual cuando supera el 80% y cuando excede el límite
- Copiar presupuesto del mes anterior (UX helper)

### Metas de ahorro
- Lista de metas con nombre, monto objetivo, ahorrado, progreso y fecha meta
- Formulario para crear meta
- Acción: registrar aporte (incrementa `saved_amount`)
- Cálculo automático: cuánto falta y estimado mensual para llegar a tiempo

---

## Categorías por defecto

Al crear una cuenta, se insertan categorías base para el usuario:

**Gastos:** Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Servicios, Otros  
**Ingresos:** Salario, Freelance, Negocio, Inversión, Otros

El usuario puede agregar, editar o eliminar sus categorías.

---

## Fases de desarrollo sugeridas

### Fase 1 — Base funcional
- [ ] Setup del proyecto (Vite + React + Supabase + Vercel)
- [ ] Esquema de base de datos completo con RLS
- [ ] Autenticación (login, registro, logout, rutas protegidas)
- [ ] Módulo de ingresos y gastos (CRUD completo)
- [ ] Módulo de pagos fijos
- [ ] Dashboard básico (totales del mes)

### Fase 2 — Finanzas avanzadas
- [ ] Módulo de deudas
- [ ] Módulo de presupuesto con alertas
- [ ] Módulo de metas de ahorro
- [ ] Dashboard completo con gráficas

### Fase 3 — Pulido y extras
- [ ] Categorías personalizadas
- [ ] Filtros avanzados en transacciones
- [ ] Exportar datos a CSV
- [ ] Soporte multi-moneda (COP, USD)
- [ ] Notificaciones de pagos próximos a vencer

---

## Dependencias principales

```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "react-router-dom": "latest",
    "recharts": "latest",
    "date-fns": "latest",
    "react-hook-form": "latest",
    "zod": "latest"
  }
}
```

- **recharts** → gráficas del dashboard
- **date-fns** → manejo de fechas y meses
- **react-hook-form + zod** → formularios con validación

---

## Variables de entorno

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Notas de implementación

- La moneda por defecto es **COP** pero el campo `currency` en `profiles` permite cambiarlo por usuario
- El campo `month` en `fixed_payments` y `budgets` usa formato `YYYY-MM` para facilitar filtros
- El reset mensual de `fixed_payments` se maneja en el cliente: al cargar el módulo, si no existen registros para el mes actual, se generan a partir de los pagos del mes anterior con `status = 'pending'`
- Toda operación de escritura debe incluir el `user_id` del usuario autenticado, aunque RLS lo valide por seguridad