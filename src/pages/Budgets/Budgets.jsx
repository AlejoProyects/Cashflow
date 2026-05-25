import { useState } from 'react'
import { Plus, Trash2, PieChart } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgets } from '../../hooks/useBudgets'
import { useCategories } from '../../hooks/useCategories'
import { formatCurrency } from '../../utils/formatCurrency'
import { currentMonthLabel } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const schema = z.object({
  category_id: z.string().min(1, 'Selecciona categoría'),
  limit_amount: z.coerce.number().positive('El límite debe ser mayor a 0'),
})

function AddForm({ onSubmit, onCancel }) {
  const { categories } = useCategories('expense')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
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

export default function Budgets() {
  const { budgets, spending, loading, upsert, remove } = useBudgets()
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = async (data) => {
    await upsert(data)
    setAddOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Presupuesto</h1>
          <p className="text-txt-muted text-sm mt-0.5 capitalize">{currentMonthLabel()}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span className="hidden sm:inline">Agregar límite</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Sin presupuesto definido"
          description="Define límites de gasto por categoría"
          action={<button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={14} className="inline mr-1" />Agregar</button>}
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
                    onClick={() => remove(b.id)}
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

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Definir presupuesto">
        <AddForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
