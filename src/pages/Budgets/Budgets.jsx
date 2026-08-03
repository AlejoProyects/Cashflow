import { useState } from 'react'
import { Plus, Trash2, PieChart, Check, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgets } from '../../hooks/useBudgets'
import { useCategories } from '../../hooks/useCategories'
import { useFixedPayments } from '../../hooks/useFixedPayments'
import { useDebts } from '../../hooks/useDebts'
import { usePlannedExpenses } from '../../hooks/usePlannedExpenses'
import { formatCurrency } from '../../utils/formatCurrency'
import { currentMonthLabel } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import ProgressBar from '../../components/ui/ProgressBar'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Selecciona categoría'),
  limit_amount: z.coerce.number().positive('El límite debe ser mayor a 0'),
})

function AddBudgetForm({ onSubmit, onCancel }) {
  const { categories } = useCategories('expense')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(budgetSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Categoría</label>
        <select {...register('category_id')} className="input">
          <option value="">Seleccionar...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.category_id && <p className="text-danger text-xs mt-1">{errors.category_id.message}</p>}
      </div>
      <div>
        <label className="label">Límite mensual (COP)</label>
        <input {...register('limit_amount')} type="number" placeholder="0" className="input" />
        {errors.limit_amount && <p className="text-danger text-xs mt-1">{errors.limit_amount.message}</p>}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Guardar</button>
      </div>
    </form>
  )
}

const oneTimeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  amount: z.coerce.number().positive('Monto mayor a 0'),
  notes: z.string().optional(),
})

function AddOneTimeForm({ onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(oneTimeSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input {...register('name')} placeholder="Ej: Seguro del carro, Reparación" className="input" autoFocus />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Monto</label>
        <input {...register('amount')} type="number" placeholder="0" className="input" />
        {errors.amount && <p className="text-danger text-xs mt-1">{errors.amount.message}</p>}
      </div>
      <div>
        <label className="label">Notas (opcional)</label>
        <input {...register('notes')} placeholder="Opcional" className="input" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Guardar</button>
      </div>
    </form>
  )
}

function CheckItem({ label, sublabel, amount, isDone, onToggle, onRemove }) {
  return (
    <div className={`card flex items-center gap-4 ${isDone ? 'opacity-70' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isDone ? 'gradient-success' : 'border-2 border-warning/60 hover:bg-warning/10'
        }`}
      >
        {isDone && <Check size={12} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-txt-primary font-medium text-sm ${isDone ? 'line-through' : ''}`}>{label}</p>
        {sublabel && <p className="text-txt-muted text-xs">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isDone ? 'text-success' : 'text-warning'}`}>{formatCurrency(amount)}</span>
        {onRemove && (
          <button onClick={onRemove} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Budgets() {
  const { budgets, spending, loading: budgetsLoading, upsert, remove: removeBudget } = useBudgets()
  const { payments: fixedPayments, loading: fixedLoading, togglePaid: toggleFixedPaid, resetMonth: resetFixedMonth } = useFixedPayments()
  const { debts, loading: debtsLoading, toggleMonthlyPayment, resetMonth: resetDebtsMonth, totals: debtTotals } = useDebts()
  const { expenses: oneTime, loading: oneTimeLoading, add: addOneTime, togglePaid: toggleOneTimePaid, remove: removeOneTime, resetMonth: resetOneTimeMonth } = usePlannedExpenses()

  const [addBudgetOpen, setAddBudgetOpen] = useState(false)
  const [addOneTimeOpen, setAddOneTimeOpen] = useState(false)

  const loading = budgetsLoading || fixedLoading || debtsLoading || oneTimeLoading

  const monthlyDebts = debts.filter((d) => d.is_monthly && d.status === 'active')
  const fixedPaymentCategoryIds = new Set(fixedPayments.map((p) => p.category_id).filter(Boolean))
  const forecastBudgets = budgets.filter((b) => !fixedPaymentCategoryIds.has(b.category_id))

  const fixedTotal = fixedPayments.reduce((s, p) => s + Number(p.amount), 0)
  const fixedCovered = fixedPayments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)

  const debtsTotal = debtTotals.monthlyForecast
  const debtsCovered = debtTotals.monthlyCovered

  const oneTimeTotal = oneTime.reduce((s, e) => s + Number(e.amount), 0)
  const oneTimeCovered = oneTime.filter((e) => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0)

  const budgetsTotal = forecastBudgets.reduce((s, b) => s + Number(b.limit_amount), 0)
  const budgetsCovered = forecastBudgets.reduce((s, b) => s + (spending[b.category_id] ?? 0), 0)

  const totalForecast = fixedTotal + debtsTotal + oneTimeTotal + budgetsTotal
  const totalCovered = fixedCovered + debtsCovered + oneTimeCovered + budgetsCovered
  const totalPending = Math.max(totalForecast - totalCovered, 0)
  const allCovered = totalForecast > 0 && totalPending <= 0

  const hasAnythingCovered = fixedCovered > 0 || debtsCovered > 0 || oneTimeCovered > 0

  const handleResetMonth = async () => {
    if (!confirm('¿Reiniciar el mes? Se marcarán como pendientes los pagos fijos, las cuotas de deudas mensuales y los pagos únicos que ya hayas cubierto.')) return
    await Promise.all([resetFixedMonth(), resetDebtsMonth(), resetOneTimeMonth()])
  }

  const handleAddBudget = async (data) => {
    await upsert(data)
    setAddBudgetOpen(false)
  }

  const handleAddOneTime = async (data) => {
    await addOneTime(data)
    setAddOneTimeOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Presupuesto</h1>
          <p className="text-txt-muted text-sm mt-0.5 capitalize">{currentMonthLabel()}</p>
        </div>
        {hasAnythingCovered && (
          <button onClick={handleResetMonth} className="btn-secondary flex items-center gap-1.5 text-sm">
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reiniciar mes</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Forecast summary */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-txt-primary font-semibold text-sm">Total previsto del mes</p>
              {allCovered && <span className="badge-success text-[10px]">¡Todo cubierto!</span>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="label">Previsto</p>
                <p className="font-bold text-lg text-txt-primary">{formatCurrency(totalForecast)}</p>
              </div>
              <div className="text-center">
                <p className="label">Cubierto</p>
                <p className="font-bold text-lg text-success">{formatCurrency(totalCovered)}</p>
              </div>
              <div className="text-center">
                <p className="label">Pendiente</p>
                <p className="font-bold text-lg text-warning">{formatCurrency(totalPending)}</p>
              </div>
            </div>

            <ProgressBar value={totalCovered} max={totalForecast || 1} colorClass="gradient-success" />

            {totalForecast > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                {[
                  { label: 'Pagos fijos', total: fixedTotal, covered: fixedCovered },
                  { label: 'Cuotas de deudas mensuales', total: debtsTotal, covered: debtsCovered },
                  { label: 'Pagos únicos', total: oneTimeTotal, covered: oneTimeCovered },
                  { label: 'Presupuestos por categoría', total: budgetsTotal, covered: budgetsCovered },
                ].filter((row) => row.total > 0).map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-txt-muted">{row.label}</span>
                    <span>
                      <span className="text-txt-primary font-medium">{formatCurrency(row.covered)}</span>
                      <span className="text-txt-muted"> / {formatCurrency(row.total)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly debt installments */}
          {monthlyDebts.length > 0 && (
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">
                Cuotas de deudas mensuales ({monthlyDebts.length})
              </p>
              <div className="space-y-2">
                {monthlyDebts.map((d) => (
                  <CheckItem
                    key={d.id}
                    label={d.name}
                    sublabel="Cuota mensual · Deuda"
                    amount={d.installment_amount}
                    isDone={!!d.last_payment_month}
                    onToggle={() => toggleMonthlyPayment(d.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fixed payments */}
          {fixedPayments.length > 0 && (
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">
                Pagos fijos ({fixedPayments.length})
              </p>
              <div className="space-y-2">
                {fixedPayments.map((p) => (
                  <CheckItem
                    key={p.id}
                    label={p.name}
                    sublabel={`Día ${p.due_day}`}
                    amount={p.amount}
                    isDone={p.status === 'paid'}
                    onToggle={() => toggleFixedPaid(p.id, p.status)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* One-off planned expenses */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">
                Pagos únicos {oneTime.length > 0 && `(${oneTime.length})`}
              </p>
              <button
                onClick={() => setAddOneTimeOpen(true)}
                className="text-primary-light text-xs font-medium flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            {oneTime.length === 0 ? (
              <p className="text-txt-muted text-xs px-1">
                Agrega pagos puntuales de este mes que quieras tener en cuenta (ej. un seguro, una reparación).
              </p>
            ) : (
              <div className="space-y-2">
                {oneTime.map((e) => (
                  <CheckItem
                    key={e.id}
                    label={e.name}
                    sublabel={e.notes}
                    amount={e.amount}
                    isDone={e.status === 'paid'}
                    onToggle={() => toggleOneTimePaid(e.id, e.status)}
                    onRemove={() => removeOneTime(e.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Category budgets */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider">
                Presupuestos por categoría {budgets.length > 0 && `(${budgets.length})`}
              </p>
              <button
                onClick={() => setAddBudgetOpen(true)}
                className="text-primary-light text-xs font-medium flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            {budgets.length === 0 ? (
              <EmptyState
                icon={PieChart}
                title="Sin presupuesto definido"
                description="Define límites de gasto por categoría"
                action={<button onClick={() => setAddBudgetOpen(true)} className="btn-primary"><Plus size={14} className="inline mr-1" />Agregar</button>}
              />
            ) : (
              <div className="space-y-3">
                {budgets.map((b) => {
                  const spent = spending[b.category_id] ?? 0
                  const pct = b.limit_amount > 0 ? Math.min((spent / b.limit_amount) * 100, 100) : 0
                  const isOver = pct >= 100
                  const isAlert = pct >= 80 && !isOver

                  const barColor = isOver ? 'gradient-danger' : isAlert ? 'gradient-warning' : 'gradient-primary'

                  return (
                    <div key={b.id} className={`card border ${isOver ? 'border-danger/40' : isAlert ? 'border-warning/40' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: b.categories?.color || '#8b5cf6' }}
                          />
                          <div>
                            <p className="text-txt-primary font-semibold text-sm">{b.categories?.name}</p>
                            {isOver && <p className="text-danger text-xs font-medium">¡Límite excedido!</p>}
                            {isAlert && <p className="text-warning text-xs font-medium">Cerca del límite</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBudget(b.id)}
                          className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-txt-muted">
                          <span>Gastado: <span className={isOver ? 'text-danger font-semibold' : 'text-txt-primary'}>{formatCurrency(spent)}</span></span>
                          <span>Límite: <span className="text-txt-primary">{formatCurrency(b.limit_amount)}</span></span>
                        </div>
                        <div className="progress-bar">
                          <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-right text-xs text-txt-muted">
                          {isOver
                            ? `+${formatCurrency(spent - b.limit_amount)} sobre el límite`
                            : `${formatCurrency(b.limit_amount - spent)} disponible`
                          }
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={addBudgetOpen} onClose={() => setAddBudgetOpen(false)} title="Definir presupuesto">
        <AddBudgetForm onSubmit={handleAddBudget} onCancel={() => setAddBudgetOpen(false)} />
      </Modal>

      <Modal isOpen={addOneTimeOpen} onClose={() => setAddOneTimeOpen(false)} title="Nuevo pago único">
        <AddOneTimeForm onSubmit={handleAddOneTime} onCancel={() => setAddOneTimeOpen(false)} />
      </Modal>
    </div>
  )
}
