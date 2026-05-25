import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFixedPayments } from '../../hooks/useFixedPayments'
import { useCategories } from '../../hooks/useCategories'
import { formatCurrency } from '../../utils/formatCurrency'
import { currentMonthLabel } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  amount: z.coerce.number().positive('Monto mayor a 0'),
  due_day: z.coerce.number().int().min(1).max(31),
  category_id: z.string().min(1, 'Selecciona categoría'),
  notes: z.string().optional(),
})

function AddForm({ onSubmit, onCancel }) {
  const { categories } = useCategories('expense')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { due_day: 1 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input {...register('name')} placeholder="Ej: Netflix, Arriendo" className="input" />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto</label>
          <input {...register('amount')} type="number" placeholder="0" className="input" />
          {errors.amount && <p className="text-danger text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Día del mes</label>
          <input {...register('due_day')} type="number" min="1" max="31" className="input" />
          {errors.due_day && <p className="text-danger text-xs mt-1">{errors.due_day.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Categoría</label>
        <select {...register('category_id')} className="input">
          <option value="">Seleccionar...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.category_id && <p className="text-danger text-xs mt-1">{errors.category_id.message}</p>}
      </div>
      <div>
        <label className="label">Notas</label>
        <input {...register('notes')} placeholder="Opcional" className="input" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Guardar</button>
      </div>
    </form>
  )
}

export default function FixedPayments() {
  const { payments, loading, add, togglePaid, remove, ensureMonthExists } = useFixedPayments()
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => { ensureMonthExists() }, [])

  const pending = payments.filter((p) => p.status === 'pending')
  const paid = payments.filter((p) => p.status === 'paid')
  const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount), 0)

  const handleAdd = async (data) => {
    await add(data)
    setAddOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Pagos Fijos</h1>
          <p className="text-txt-muted text-sm mt-0.5 capitalize">{currentMonthLabel()}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total mes', value: formatCurrency(totalPaid + totalPending), color: 'text-txt-primary' },
          { label: 'Pagado', value: formatCurrency(totalPaid), color: 'text-success' },
          { label: 'Pendiente', value: formatCurrency(totalPending), color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center p-3 sm:p-5">
            <p className="label text-[9px] sm:text-xs">{label}</p>
            <p className={`font-bold text-sm sm:text-lg ${color} truncate`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin pagos fijos"
          description="Agrega tus gastos recurrentes mensuales"
          action={<button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={14} className="inline mr-1" />Agregar</button>}
        />
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">Pendientes ({pending.length})</p>
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p.id} className="card flex items-center gap-4">
                    <button
                      onClick={() => togglePaid(p.id, p.status)}
                      className="w-6 h-6 rounded-full border-2 border-warning/60 flex items-center justify-center hover:bg-warning/10 transition-colors flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-txt-primary font-medium text-sm">{p.name}</p>
                      <p className="text-txt-muted text-xs">Día {p.due_day} · {p.categories?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warning font-bold">{formatCurrency(p.amount)}</span>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">Pagados ({paid.length})</p>
              <div className="space-y-2">
                {paid.map((p) => (
                  <div key={p.id} className="card flex items-center gap-4 opacity-70">
                    <button
                      onClick={() => togglePaid(p.id, p.status)}
                      className="w-6 h-6 rounded-full gradient-success flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={12} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-txt-primary font-medium text-sm line-through">{p.name}</p>
                      <p className="text-txt-muted text-xs">Día {p.due_day} · {p.categories?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-success font-bold">{formatCurrency(p.amount)}</span>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Nuevo pago fijo">
        <AddForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
