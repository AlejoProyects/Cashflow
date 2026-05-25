import { useState } from 'react'
import { Plus, Trash2, Pencil, ArrowLeftRight, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'
import { useCategories } from '../../hooks/useCategories'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDateShort, currentMonth } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import TransactionForm from './TransactionForm'

export default function Transactions() {
  const [month] = useState(currentMonth())
  const { transactions, loading, add, update, remove, totals } = useTransactions(month)
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
          <p className="text-txt-muted text-sm mt-0.5">Ingresos y gastos del mes</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
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
                      <Badge variant="muted">{t.categories?.name || '—'}</Badge>
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
          } : undefined}
        />
      </Modal>
    </div>
  )
}
