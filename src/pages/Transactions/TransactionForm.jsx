import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CreditCard, Receipt } from 'lucide-react'
import { useCategories } from '../../hooks/useCategories'
import { useDebts } from '../../hooks/useDebts'
import { useFixedPayments } from '../../hooks/useFixedPayments'
import { formatCurrency } from '../../utils/formatCurrency'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'Selecciona una fecha'),
  description: z.string().min(1, 'Agrega una descripción'),
  notes: z.string().optional(),
  debt_id: z.string().optional().nullable(),
  fixed_payment_id: z.string().optional().nullable(),
})

export default function TransactionForm({ onSubmit, onCancel, defaultValues }) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      debt_id: '',
      fixed_payment_id: '',
      ...defaultValues,
    },
  })

  const type = watch('type')
  const selectedDebtId = watch('debt_id')
  const selectedFixedPaymentId = watch('fixed_payment_id')
  const { categories } = useCategories(type)
  const { debts } = useDebts()
  const activeDebts = debts.filter((d) => d.status === 'active')
  const { payments: fixedPayments } = useFixedPayments()

  const [isDebtPayment, setIsDebtPayment] = useState(!!(defaultValues?.debt_id))
  const [isFixedPayment, setIsFixedPayment] = useState(!!(defaultValues?.fixed_payment_id))

  const handleDebtToggle = () => {
    const next = !isDebtPayment
    setIsDebtPayment(next)
    if (next) {
      setIsFixedPayment(false)
      setValue('fixed_payment_id', null)
    } else {
      setValue('debt_id', null)
    }
  }

  const handleFixedPaymentToggle = () => {
    const next = !isFixedPayment
    setIsFixedPayment(next)
    if (next) {
      setIsDebtPayment(false)
      setValue('debt_id', null)
    } else {
      setValue('fixed_payment_id', null)
    }
  }

  const handleFixedPaymentSelect = (e) => {
    const id = e.target.value || null
    setValue('fixed_payment_id', id)
    if (id) {
      const payment = fixedPayments.find((p) => p.id === id)
      if (payment) {
        setValue('amount', payment.amount)
        if (!defaultValues?.description) setValue('description', payment.name)
        if (payment.category_id) setValue('category_id', payment.category_id)
      }
    }
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
      setIsFixedPayment(false)
      setValue('fixed_payment_id', null)
    }
  }

  const handleSubmitForm = async (data) => {
    await onSubmit({
      ...data,
      debt_id: isDebtPayment && data.debt_id ? data.debt_id : null,
      fixed_payment_id: isFixedPayment && data.fixed_payment_id ? data.fixed_payment_id : null,
    })
  }

  const pendingPayments = fixedPayments.filter((p) => p.status === 'pending')
  const selectedPayment = selectedFixedPaymentId ? fixedPayments.find((p) => p.id === selectedFixedPaymentId) : null
  const dropdownPayments = selectedPayment && selectedPayment.status !== 'pending'
    ? [...pendingPayments, selectedPayment]
    : pendingPayments

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

      {/* Link to debt or fixed payment — only for expenses */}
      {type === 'expense' && (activeDebts.length > 0 || fixedPayments.length > 0) && (
        <div className="space-y-3">
          <div>
            <label className="label">Vincular a</label>
            <div className="flex gap-2">
              {activeDebts.length > 0 && (
                <button
                  type="button"
                  onClick={handleDebtToggle}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    isDebtPayment
                      ? 'gradient-primary text-white border-transparent'
                      : 'border-white/10 text-txt-secondary hover:border-white/20'
                  }`}
                >
                  <CreditCard size={14} />
                  Deuda
                </button>
              )}
              {fixedPayments.length > 0 && (
                <button
                  type="button"
                  onClick={handleFixedPaymentToggle}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    isFixedPayment
                      ? 'gradient-primary text-white border-transparent'
                      : 'border-white/10 text-txt-secondary hover:border-white/20'
                  }`}
                >
                  <Receipt size={14} />
                  Pago fijo
                </button>
              )}
            </div>
          </div>

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

          {isFixedPayment && (
            <div>
              <label className="label">Pago fijo asociado</label>
              <select
                value={selectedFixedPaymentId || ''}
                onChange={handleFixedPaymentSelect}
                className="input"
              >
                <option value="">Seleccionar pago fijo...</option>
                {dropdownPayments.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.amount)}
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
