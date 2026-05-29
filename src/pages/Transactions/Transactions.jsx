import { useState } from 'react'
import { Plus, Trash2, Pencil, ArrowLeftRight, ChevronDown, CreditCard, Receipt } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'
import { useTransactions } from '../../hooks/useTransactions'
import { useCategories } from '../../hooks/useCategories'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateShort } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import TransactionForm from './TransactionForm'

const fmt = (d) => format(d, 'yyyy-MM-dd')

const PRESETS = [
  { id: 'todo', label: 'Todo' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: 'mes', label: 'Por mes' },
  { id: 'año', label: 'Por año' },
  { id: 'custom', label: 'Personalizado' },
]

export default function Transactions() {
  const [activePreset, setActivePreset] = useState('todo')
  const [range, setRange] = useState({})
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))

  const handlePreset = (id) => {
    setActivePreset(id)
    if (id === 'todo') {
      setRange({})
    } else if (id === '30d') {
      setRange({ startDate: fmt(subDays(new Date(), 29)), endDate: fmt(new Date()) })
    } else if (id === 'mes') {
      const [y, m] = selectedMonth.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      setRange({ startDate: fmt(startOfMonth(d)), endDate: fmt(endOfMonth(d)) })
    } else if (id === 'año') {
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

  const { transactions, loading, add, update, remove, totals } = useTransactions(
    activePreset === 'todo' ? { all: true } : range
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { categories } = useCategories(filter !== 'all' ? filter : undefined)

  const filtered = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false
    if (categoryFilter && t.category_id !== categoryFilter) return false
    return true
  })

  const handleTypeFilter = (val) => {
    setFilter(val)
    setCategoryFilter('')
  }

  const handleSubmit = async (data) => {
    if (editing) await update(editing.id, data)
    else await add(data)
    setModalOpen(false)
    setEditing(null)
  }

  const handleEdit = (t) => {
    setEditing(t)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta transacción?')) await remove(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Transacciones</h1>
          <p className="text-txt-muted text-sm mt-0.5">Todos los movimientos</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Period selector */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
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

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ingresos', value: totals.income, color: 'text-success' },
          { label: 'Gastos', value: totals.expense, color: 'text-danger' },
          { label: 'Balance', value: totals.balance, color: totals.balance >= 0 ? 'text-success' : 'text-danger' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center p-3 sm:p-5">
            <p className="label text-[9px] sm:text-xs">{label}</p>
            <p className={`font-bold text-sm sm:text-lg ${color} truncate`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type filter */}
        <div className="flex gap-2">
          {[['all', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleTypeFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === val
                  ? 'gradient-primary text-white'
                  : 'bg-bg-elevated text-txt-secondary hover:text-txt-primary border border-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-bg-elevated border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary hover:border-white/20 focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transacciones"
          description="Registra tu primer ingreso o gasto"
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={14} className="inline mr-1" />Agregar
            </button>
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="card flex items-start gap-3 py-3.5">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: t.categories?.color || '#8b5cf6' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-txt-primary font-medium text-sm truncate leading-tight">{t.description}</span>
                    <span className={`font-bold text-sm shrink-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="muted">{t.categories?.name || '—'}</Badge>
                    <span className="text-txt-muted text-xs">{formatDateShort(t.date)}</span>
                    {t.debts?.name && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary-light bg-primary/10 px-1.5 py-0.5 rounded-md">
                        <CreditCard size={9} />
                        {t.debts.name}
                      </span>
                    )}
                    {t.fixed_payments?.name && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded-md">
                        <Receipt size={9} />
                        {t.fixed_payments.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg text-txt-muted hover:text-primary-light hover:bg-primary/10 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-txt-muted text-xs font-medium">Descripción</th>
                  <th className="text-left px-3 py-3 text-txt-muted text-xs font-medium">Categoría</th>
                  <th className="text-left px-3 py-3 text-txt-muted text-xs font-medium hidden md:table-cell">Fecha</th>
                  <th className="text-right px-5 py-3 text-txt-muted text-xs font-medium">Monto</th>
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.categories?.color || '#8b5cf6' }} />
                        <span className="text-txt-primary font-medium truncate">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col gap-1">
                        <Badge variant="muted">{t.categories?.name || '—'}</Badge>
                        {t.debts?.name && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary-light bg-primary/10 px-1.5 py-0.5 rounded-md w-fit">
                            <CreditCard size={9} />
                            {t.debts.name}
                          </span>
                        )}
                        {t.fixed_payments?.name && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded-md w-fit">
                            <Receipt size={9} />
                            {t.fixed_payments.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-txt-muted hidden md:table-cell">{formatDateShort(t.date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg text-txt-muted hover:text-primary-light hover:bg-primary/10 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Editar transacción' : 'Nueva transacción'}
      >
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
          defaultValues={editing ? {
            type: editing.type,
            category_id: editing.category_id,
            amount: editing.amount,
            date: editing.date,
            description: editing.description,
            notes: editing.notes || '',
            debt_id: editing.debt_id || '',
            fixed_payment_id: editing.fixed_payment_id || '',
          } : undefined}
        />
      </Modal>
    </div>
  )
}
