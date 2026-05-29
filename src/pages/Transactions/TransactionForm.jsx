import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CreditCard } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useDebts } from '../../hooks/useDebts'
import { formatCurrency } from '../../utils/formatCurrency'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'Selecciona una fecha'),
  description: z.string().min(1, 'Agrega una descripción'),
  notes: z.string().optional(),
  debt_id: z.string().optional().nullable(),
})

export default function TransactionForm({ onSubmit, onCancel, defaultValues }) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      debt_id: '',
      ...defaultValues,
    },
  })

  const type = watch('type')
  const selectedDebtId = watch('debt_id')
  const { categories } = useCategories(type)
  const { debts } = useDebts()
  const activeDebts = debts.filter((d) => d.status === 'active')

  const [isDebtPayment, setIsDebtPayment] = useState(!!(defaultValues?.debt_id))

  const handleDebtToggle = () => {
    const next = !isDebtPayment
    setIsDebtPayment(next)
    if (!next) setValue('debt_id', null)
  }

  const handleDebtSelect = (e) => {
    const id = e.target.value || null
    setValue('debt_id', id)
    if (id) {
      const debt = activeDebts.find((d) => d.id === id)
      if (debt) {
        setValue('amount', debt.installment_amount)
        if (!defaultValues?.description) {
          setValue('description', `Cuota: ${debt.name}`)
        }
      }
    }
  }

  const handleTypeChange = (e) => {
    register('type').onChange(e)
    if (e.target.value === 'income') {
      setIsDebtPayment(false)
      setValue('debt_id', null)
    }
  }

  const handleSubmitForm = async (data) => {
    await onSubmit({
      ...data,
      debt_id: isDebtPayment && data.debt_id ? data.debt_id : null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="label">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {['expense', 'income'].map((t) => (
            <label key={t} className="cursor-pointer">
              <input
                {...register('type')}
                type="radio"
                value={t}
                className="sr-only"
                onChange={handleTypeChange}
              />
              <div className={`text-center py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'gradient-danger text-white border-transparent'
                    : 'gradient-success text-white border-transparent'
                  : 'border-white/10 text-txt-secondary hover:border-white/20'
              }`}>
                {t === 'expense' ? '↑ Gasto' : '↓ Ingreso'}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Debt payment toggle — only for expenses */}
      {type === 'expense' && activeDebts.length > 0 && (
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={handleDebtToggle}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                isDebtPayment ? 'bg-primary' : 'bg-bg-elevated border border-white/20'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isDebtPayment ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
            <span className="text-txt-secondary text-sm flex items-center gap-1.5">
              <CreditCard size={13} />
              Es un pago a deuda
            </span>
          </label>

          {isDebtPayment && (
            <div>
              <label className="label">Deuda asociada</label>
              <select
                value={selectedDebtId || ''}
                onChange={handleDebtSelect}
                className="input"
              >
                <option value="">Seleccionar deuda...</option>
                {activeDebts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — cuota {formatCurrency(d.installment_amount)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto (COP)</label>
          <input {...register('amount')} type="number" placeholder="0" className="input" />
          {errors.amount && <p className="text-danger text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Fecha</label>
          <input {...register('date')} type="date" className="input" />
          {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Categoría</label>
        <select {...register('category_id')} className="input">
          <option value="">Seleccionar...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && <p className="text-danger text-xs mt-1">{errors.category_id.message}</p>}
      </div>

      <div>
        <label className="label">Descripción</label>
        <input {...register('description')} placeholder="Ej: Mercado semanal" className="input" />
        {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="label">Nota (opcional)</label>
        <input {...register('notes')} placeholder="Detalles adicionales" className="input" />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
