import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Calendar, Target } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { format, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear } from 'date-fns'
import { useAuth } from '../../hooks/useAuth'
import { useTransactions } from '../../hooks/useTransactions'
import { useDebts } from '../../hooks/useDebts'
import { useFixedPayments } from '../../hooks/useFixedPayments'
import { useGoals } from '../../hooks/useGoals'
import StatCard from '../../components/ui/StatCard'
import ProgressBar from '../../components/ui/ProgressBar'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, daysUntil } from '../../utils/dateHelpers'

const fmt = (d) => format(d, 'yyyy-MM-dd')
const fmtLabel = (d) => format(d, 'dd/MM/yyyy')

const PRESETS = [
  {
    id: '30d',
    label: 'Últimos 30 días',
    start: () => fmt(subDays(new Date(), 29)),
    end: () => fmt(new Date()),
  },
  { id: 'mes', label: 'Por mes' },
  { id: 'año', label: 'Por año' },
  { id: 'custom', label: 'Personalizado' },
]

const TOOLTIP_STYLE = {
  backgroundColor: 'rgb(var(--bg-elevated))',
  border: '1px solid rgb(var(--p) / 0.2)',
  borderRadius: '12px',
  color: '#f1f0ff',
  fontSize: '12px',
}

export default function Dashboard() {
  const { user } = useAuth()

  const [activePreset, setActivePreset] = useState('30d')
  const [range, setRange] = useState({
    startDate: fmt(subDays(new Date(), 29)),
    endDate: fmt(new Date()),
  })
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))

  const handlePreset = (preset) => {
    setActivePreset(preset.id)
    if (preset.id === '30d') {
      setRange({ startDate: fmt(subDays(new Date(), 29)), endDate: fmt(new Date()) })
    } else if (preset.id === 'mes') {
      const [y, m] = selectedMonth.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      setRange({ startDate: fmt(startOfMonth(d)), endDate: fmt(endOfMonth(d)) })
    } else if (preset.id === 'año') {
      const d = new Date(parseInt(selectedYear), 0, 1)
      setRange({ startDate: fmt(startOfYear(d)), endDate: fmt(endOfYear(d)) })
    }
  }

  const handleMonthChange = (val) => {
    setSelectedMonth(val)
    const [y, m] = val.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    setRange({ startDate: fmt(startOfMonth(d)), endDate: fmt(endOfMonth(d)) })
  }

  const handleYearChange = (val) => {
    setSelectedYear(val)
    const d = new Date(parseInt(val), 0, 1)
    setRange({ startDate: fmt(startOfYear(d)), endDate: fmt(endOfYear(d)) })
  }

  const rangeLabel = (() => {
    if (activePreset === 'custom' || activePreset === 'mes') {
      return `${fmtLabel(new Date(range.startDate + 'T00:00:00'))} → ${fmtLabel(new Date(range.endDate + 'T00:00:00'))}`
    }
    if (activePreset === 'año') return `Año ${selectedYear}`
    return PRESETS.find((p) => p.id === activePreset)?.label
  })()

  const { transactions, totals, loading: loadTx } = useTransactions(range)
  const { debts, totals: debtTotals, loading: loadDebts } = useDebts()
  const { payments, loading: loadPay } = useFixedPayments()
  const { goals, loading: loadGoals } = useGoals()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0]

  const categorySpending = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const name = t.categories?.name || 'Otros'
      const color = t.categories?.color || '#8b5cf6'
      const existing = acc.find((a) => a.name === name)
      if (existing) existing.value += Number(t.amount)
      else acc.push({ name, value: Number(t.amount), color })
      return acc
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const pendingPayments = payments
    .filter((p) => p.status === 'pending')
    .slice(0, 5)

  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 3)
  const activeDebts = debts
    .filter((d) => d.status === 'active')
    .sort((a, b) => {
      const pctA = Number(a.total_amount) > 0 ? Number(a.paid_amount) / Number(a.total_amount) : 0
      const pctB = Number(b.total_amount) > 0 ? Number(b.paid_amount) / Number(b.total_amount) : 0
      return pctB - pctA
    })

  const loading = loadTx || loadDebts || loadPay || loadGoals

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-txt-primary">
          Hola, <span className="text-gradient">{firstName}</span> 👋
        </h1>
        <p className="text-txt-muted text-sm mt-0.5">{rangeLabel}</p>
      </div>

      {/* Date range selector */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activePreset === p.id
                  ? 'gradient-primary text-white'
                  : 'bg-bg-elevated text-txt-secondary hover:text-txt-primary border border-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePreset === 'mes' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="input text-xs py-1.5 w-44"
          />
        )}
        {activePreset === 'año' && (
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="input text-xs py-1.5 w-32"
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        )}
        {activePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={range.startDate}
              max={range.endDate}
              onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
              className="input flex-1 text-xs py-1.5"
            />
            <span className="text-txt-muted text-xs shrink-0">→</span>
            <input
              type="date"
              value={range.endDate}
              min={range.startDate}
              onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
              className="input flex-1 text-xs py-1.5"
            />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Balance del período"
          value={formatCurrency(totals.balance)}
          icon={Wallet}
          gradient={totals.balance >= 0 ? 'gradient-primary' : 'gradient-danger'}
        />
        <StatCard
          title="Ingresos"
          value={formatCurrency(totals.income)}
          icon={TrendingUp}
          gradient="gradient-success"
        />
        <StatCard
          title="Gastos"
          value={formatCurrency(totals.expense)}
          icon={TrendingDown}
          gradient="gradient-danger"
        />
        <StatCard
          title="Deuda pendiente"
          value={formatCurrency(debtTotals.pending)}
          icon={CreditCard}
          gradient="gradient-warning"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="card">
          <h2 className="text-txt-primary font-semibold text-sm mb-4">Gastos por categoría</h2>
          {categorySpending.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-[42%] sm:w-[45%] shrink-0">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                {categorySpending.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-txt-secondary truncate">{c.name}</span>
                    </div>
                    <span className="text-txt-primary font-medium shrink-0">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center">
              <p className="text-txt-muted text-sm">Sin gastos este mes</p>
            </div>
          )}
        </div>

        {/* Bar chart income vs expense */}
        <div className="card">
          <h2 className="text-txt-primary font-semibold text-sm mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={[{ name: 'Este mes', Ingresos: totals.income, Gastos: totals.expense }]}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#a09dc0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a09dc0', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending payments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-primary-light" />
            <h2 className="text-txt-primary font-semibold text-sm">Pagos pendientes</h2>
          </div>
          {pendingPayments.length > 0 ? (
            <div className="space-y-3">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-txt-primary text-xs font-medium">{p.name}</p>
                    <p className="text-txt-muted text-xs">Día {p.due_day}</p>
                  </div>
                  <span className="text-warning font-semibold text-sm">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-txt-muted text-xs text-center py-4">Sin pagos pendientes</p>
          )}
        </div>

        {/* Debts */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} className="text-danger" />
            <h2 className="text-txt-primary font-semibold text-sm">Deudas activas</h2>
          </div>
          {activeDebts.length > 0 ? (
            <div className="space-y-3">
              {activeDebts.map((d) => {
                const pct = (Number(d.paid_amount) / Number(d.total_amount)) * 100
                return (
                  <div key={d.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-txt-secondary truncate">{d.name}</span>
                      <span className="text-txt-primary font-medium">{Math.round(pct)}%</span>
                    </div>
                    <ProgressBar value={d.paid_amount} max={d.total_amount} colorClass="gradient-danger" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-txt-muted text-xs text-center py-4">Sin deudas activas</p>
          )}
        </div>

        {/* Goals */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target size={15} className="text-success" />
            <h2 className="text-txt-primary font-semibold text-sm">Metas de ahorro</h2>
          </div>
          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.map((g) => {
                const days = daysUntil(g.target_date)
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-txt-secondary truncate">{g.name}</span>
                      {days !== null && (
                        <span className={`font-medium ${days < 30 ? 'text-warning' : 'text-txt-muted'}`}>
                          {days}d
                        </span>
                      )}
                    </div>
                    <ProgressBar value={g.saved_amount} max={g.target_amount} colorClass="gradient-success" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-txt-muted text-xs text-center py-4">Sin metas activas</p>
          )}
        </div>
      </div>
    </div>
  )
}
