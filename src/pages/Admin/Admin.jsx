import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck, Users, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAdmin } from '../../hooks/useAdmin'
import { isSuperAdmin } from '../../utils/admin'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, formatDateTime } from '../../utils/dateHelpers'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

const TABS = [
  { key: 'transactions', label: 'Transacciones' },
  { key: 'debts', label: 'Deudas' },
  { key: 'fixedPayments', label: 'Pagos fijos' },
  { key: 'budgets', label: 'Presupuestos' },
  { key: 'goals', label: 'Metas' },
  { key: 'plannedExpenses', label: 'Gastos planeados' },
]

function Table({ headers, rows, empty }) {
  if (rows.length === 0) {
    return <p className="text-txt-muted text-xs text-center py-6">{empty}</p>
  }
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="text-txt-muted text-left border-b border-white/5">
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2 text-txt-secondary whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UserDetail({ userData }) {
  const [tab, setTab] = useState('transactions')

  if (!userData) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  const income = userData.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = userData.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const debtPending = userData.debts.filter((d) => d.status === 'active').reduce((s, d) => s + (Number(d.total_amount) - Number(d.paid_amount)), 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ingresos (histórico)', value: formatCurrency(income), color: 'text-success' },
          { label: 'Gastos (histórico)', value: formatCurrency(expense), color: 'text-danger' },
          { label: 'Deuda pendiente', value: formatCurrency(debtPending), color: 'text-warning' },
          { label: 'Metas activas', value: userData.goals.filter((g) => g.status === 'active').length, color: 'text-primary-light' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="label">{label}</p>
            <p className={`font-bold text-lg ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'gradient-primary text-white' : 'text-txt-muted hover:text-txt-secondary hover:bg-bg-elevated'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'transactions' && (
          <Table
            headers={['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']}
            empty="Sin transacciones"
            rows={userData.transactions.map((t) => [
              formatDate(t.date),
              t.description,
              t.categories?.name ?? '—',
              <Badge key="b" variant={t.type === 'income' ? 'success' : 'danger'}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</Badge>,
              formatCurrency(t.amount),
            ])}
          />
        )}
        {tab === 'debts' && (
          <Table
            headers={['Nombre', 'Cuota', 'Cuotas', 'Total', 'Pagado', 'Estado']}
            empty="Sin deudas"
            rows={userData.debts.map((d) => [
              d.name,
              formatCurrency(d.installment_amount),
              `${d.paid_installments}/${d.total_installments}`,
              formatCurrency(d.total_amount),
              formatCurrency(d.paid_amount),
              <Badge key="b" variant={d.status === 'paid' ? 'success' : 'warning'}>{d.status === 'paid' ? 'Pagada' : 'Activa'}</Badge>,
            ])}
          />
        )}
        {tab === 'fixedPayments' && (
          <Table
            headers={['Nombre', 'Categoría', 'Monto', 'Día', 'Mes', 'Estado']}
            empty="Sin pagos fijos"
            rows={userData.fixedPayments.map((f) => [
              f.name,
              f.categories?.name ?? '—',
              formatCurrency(f.amount),
              f.due_day,
              f.month,
              <Badge key="b" variant={f.status === 'paid' ? 'success' : 'warning'}>{f.status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge>,
            ])}
          />
        )}
        {tab === 'budgets' && (
          <Table
            headers={['Categoría', 'Mes', 'Límite']}
            empty="Sin presupuestos"
            rows={userData.budgets.map((b) => [
              b.categories?.name ?? '—',
              b.month,
              formatCurrency(b.limit_amount),
            ])}
          />
        )}
        {tab === 'goals' && (
          <Table
            headers={['Nombre', 'Objetivo', 'Ahorrado', 'Fecha meta', 'Estado']}
            empty="Sin metas"
            rows={userData.goals.map((g) => [
              g.name,
              formatCurrency(g.target_amount),
              formatCurrency(g.saved_amount),
              g.target_date ? formatDate(g.target_date) : '—',
              <Badge key="b" variant={g.status === 'completed' ? 'success' : 'primary'}>{g.status === 'completed' ? 'Completada' : 'Activa'}</Badge>,
            ])}
          />
        )}
        {tab === 'plannedExpenses' && (
          <Table
            headers={['Nombre', 'Monto', 'Mes', 'Estado']}
            empty="Sin gastos planeados"
            rows={userData.plannedExpenses.map((p) => [
              p.name,
              formatCurrency(p.amount),
              p.month,
              <Badge key="b" variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status === 'paid' ? 'Pagado' : 'Pendiente'}</Badge>,
            ])}
          />
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const { users, loadingUsers, selectedUserId, userData, loadingUserData, selectUser } = useAdmin()

  if (!isSuperAdmin(user)) {
    return <Navigate to="/" replace />
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Panel de administración</h1>
          <p className="text-txt-muted text-sm mt-0.5">Solo visible para ti · lectura de todos los usuarios</p>
        </div>
      </div>

      {selectedUserId ? (
        <div className="space-y-4">
          <button
            onClick={() => selectUser(null)}
            className="flex items-center gap-1.5 text-txt-muted hover:text-txt-primary text-sm transition-colors"
          >
            <ArrowLeft size={14} /> Volver a la lista de usuarios
          </button>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
              {(selectedUser?.full_name ?? selectedUser?.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-txt-primary font-semibold text-sm truncate">{selectedUser?.full_name || 'Sin nombre'}</p>
              <p className="text-txt-muted text-xs truncate">{selectedUser?.email}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="label">Último acceso</p>
              <p className="text-txt-secondary text-xs font-medium">{formatDateTime(selectedUser?.last_sign_in_at)}</p>
            </div>
          </div>
          {loadingUserData ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <UserDetail userData={userData} />
          )}
        </div>
      ) : loadingUsers ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios" description="Todavía no hay usuarios registrados" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => selectUser(u.id)}
              className="card w-full flex items-center gap-3 text-left hover:border-primary/30 border border-transparent transition-colors"
            >
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-txt-primary font-semibold text-sm truncate">{u.full_name || 'Sin nombre'}</p>
                <p className="text-txt-muted text-xs truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-txt-muted text-[10px] uppercase tracking-wide">Último acceso</p>
                <p className="text-txt-secondary text-xs font-medium">{formatDateTime(u.last_sign_in_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
