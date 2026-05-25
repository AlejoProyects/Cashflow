import { useState } from 'react'
import { Plus, Trash2, Target, PlusCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useGoals } from '../../hooks/useGoals'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate, daysUntil } from '../../utils/dateHelpers'
import Modal from '../../components/ui/Modal'
import ProgressBar from '../../components/ui/ProgressBar'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const goalSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  target_amount: z.coerce.number().positive('Monto mayor a 0'),
  saved_amount: z.coerce.number().min(0).optional(),
  target_date: z.string().optional(),
  notes: z.string().optional(),
})

const contribSchema = z.object({
  amount: z.coerce.number().positive('Monto mayor a 0'),
})

function GoalForm({ onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { saved_amount: 0 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Nombre de la meta</label>
        <input {...register('name')} placeholder="Ej: Viaje, Fondo de emergencia" className="input" />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto objetivo</label>
          <input {...register('target_amount')} type="number" placeholder="0" className="input" />
          {errors.target_amount && <p className="text-danger text-xs mt-1">{errors.target_amount.message}</p>}
        </div>
        <div>
          <label className="label">Ya ahorrado</label>
          <input {...register('saved_amount')} type="number" placeholder="0" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Fecha objetivo</label>
        <input {...register('target_date')} type="date" className="input" />
      </div>
      <div>
        <label className="label">Notas</label>
        <input {...register('notes')} placeholder="Opcional" className="input" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Crear meta</button>
      </div>
    </form>
  )
}

function ContribModal({ goal, onSubmit, onClose }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contribSchema),
  })
  const remaining = Number(goal.target_amount) - Number(goal.saved_amount)
  const daysLeft = daysUntil(goal.target_date)
  const monthsLeft = daysLeft ? Math.max(Math.ceil(daysLeft / 30), 1) : null
  const monthlyNeeded = monthsLeft ? remaining / monthsLeft : null

  return (
    <form onSubmit={handleSubmit(({ amount }) => onSubmit(amount))} className="space-y-4">
      <div className="card-elevated space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-txt-muted">Falta</span>
          <span className="text-txt-primary font-bold">{formatCurrency(remaining)}</span>
        </div>
        {monthlyNeeded !== null && (
          <div className="flex justify-between text-xs">
            <span className="text-txt-muted">Aporte mensual estimado</span>
            <span className="text-warning font-semibold">{formatCurrency(monthlyNeeded)}/mes</span>
          </div>
        )}
      </div>
      <div>
        <label className="label">Monto del aporte</label>
        <input {...register('amount')} type="number" placeholder="0" className="input" autoFocus />
        {errors.amount && <p className="text-danger text-xs mt-1">{errors.amount.message}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">Registrar aporte</button>
      </div>
    </form>
  )
}

export default function Goals() {
  const { goals, loading, add, addContribution, remove } = useGoals()
  const [addOpen, setAddOpen] = useState(false)
  const [contribGoal, setContribGoal] = useState(null)

  const active = goals.filter((g) => g.status === 'active')
  const completed = goals.filter((g) => g.status === 'completed')

  const handleAdd = async (data) => {
    await add({ ...data, status: 'active' })
    setAddOpen(false)
  }

  const handleContrib = async (amount) => {
    await addContribution(contribGoal.id, amount)
    setContribGoal(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Metas de Ahorro</h1>
          <p className="text-txt-muted text-sm mt-0.5">Seguimiento de objetivos financieros</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin metas de ahorro"
          description="Define objetivos y haz seguimiento de tu progreso"
          action={<button onClick={() => setAddOpen(true)} className="btn-primary"><Plus size={14} className="inline mr-1" />Crear meta</button>}
        />
      ) : (
        <div className="space-y-4">
          {active.map((g) => {
            const pct = (Number(g.saved_amount) / Number(g.target_amount)) * 100
            const days = daysUntil(g.target_date)
            const remaining = Number(g.target_amount) - Number(g.saved_amount)

            return (
              <div key={g.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-txt-primary font-semibold">{g.name}</p>
                      {days !== null && days <= 30 && <Badge variant="warning">{days}d restantes</Badge>}
                    </div>
                    {g.target_date && (
                      <p className="text-txt-muted text-xs mt-0.5">Meta: {formatDate(g.target_date)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContribGoal(g)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <PlusCircle size={12} />Aportar
                    </button>
                    <button
                      onClick={() => remove(g.id)}
                      className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-success font-semibold">{formatCurrency(g.saved_amount)}</span>
                    <span className="text-txt-muted">{formatCurrency(g.target_amount)}</span>
                  </div>
                  <ProgressBar value={g.saved_amount} max={g.target_amount} colorClass="gradient-success" />
                  <div className="flex justify-between text-xs text-txt-muted">
                    <span>{Math.round(pct)}% completado</span>
                    <span>Falta: {formatCurrency(remaining)}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {completed.length > 0 && (
            <div>
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">Completadas</p>
              {completed.map((g) => (
                <div key={g.id} className="card flex items-center justify-between opacity-70">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-txt-primary font-medium text-sm">{g.name}</p>
                      <Badge variant="success">✓ Completada</Badge>
                    </div>
                    <p className="text-success text-xs">{formatCurrency(g.target_amount)}</p>
                  </div>
                  <button onClick={() => remove(g.id)} className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Nueva meta de ahorro">
        <GoalForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal isOpen={!!contribGoal} onClose={() => setContribGoal(null)} title={`Aportar a: ${contribGoal?.name}`}>
        {contribGoal && <ContribModal goal={contribGoal} onSubmit={handleContrib} onClose={() => setContribGoal(null)} />}
      </Modal>
    </div>
  )
}
