import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useCategories } from '../../hooks/useCategories'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'Selecciona una fecha'),
  description: z.string().min(1, 'Agrega una descripción'),
  notes: z.string().optional(),
})

export default function TransactionForm({ onSubmit, onCancel, defaultValues }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      ...defaultValues,
    },
  })

  const type = watch('type')
  const { categories } = useCategories(type)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="label">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {['expense', 'income'].map((t) => (
            <label key={t} className="cursor-pointer">
              <input {...register('type')} type="radio" value={t} className="sr-only" />
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
