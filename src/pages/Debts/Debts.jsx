import { useState } from 'react'
import { Plus, Trash2, CreditCard, CheckCircle, Layers, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebts } from '../../hooks/useDebts'
import { formatCurrency } from '../../utils/formatCurrency'
import Modal from '../../components/ui/Modal'
import ProgressBar from '../../components/ui/ProgressBar'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'

const debtSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  installment_amount: z.coerce.number().positive('El valor de la cuota debe ser mayor a 0'),
  total_installments: z.coerce.number().int().min(1, 'Debe ser al menos 1 cuota'),
  has_previous: z.boolean().optional(),
  paid_installments: z.coerce.number().int().min(0).optional(),
  paid_by_value: z.boolean().optional(),
  previous_value: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

function DebtForm({ onSubmit, onCancel, debt = null }) {
  const isEdit = !!debt
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: isEdit
      ? {
          name: debt.name,
          installment_amount: debt.installment_amount,
          total_installments: debt.total_installments,
          paid_installments: debt.paid_installments,
          notes: debt.notes || '',
          has_previous: false,
          paid_by_value: false,
          previous_value: 0,
        }
      : {
          has_previous: false,
          paid_by_value: false,
          paid_installments: 0,
          previous_value: 0,
        },
  })

  const hasPrevious = watch('has_previous')
  const paidByValue = watch('paid_by_value')
  const installmentAmount = watch('installment_amount')
  const totalInstallments = watch('total_installments')

  const totalPreview = Number(installmentAmount) > 0 && Number(totalInstallments) > 0
    ? Number(installmentAmount) * Number(totalInstallments)
    : null

  const handleSubmitForm = (data) => {
    let paidInstallments
    if (isEdit) {
      paidInstallments = Math.min(Number(data.paid_installments) || 0, Number(data.total_installments))
    } else {
      paidInstallments = 0
      if (data.has_previous) {
        if (data.paid_by_value && Number(data.previous_value) > 0 && Number(data.installment_amount) > 0) {
          paidInstallments = Math.floor(Number(data.previous_value) / Number(data.installment_amount))
        } else {
          paidInstallments = Number(data.paid_installments) || 0
        }
      }
      paidInstallments = Math.min(paidInstallments, Number(data.total_installments))
    }
    onSubmit({
      name: data.name,
      installment_amount: data.installment_amount,
      total_installments: data.total_installments,
      paid_installments: paidInstallments,
      notes: data.notes,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="label">Nombre de la deuda</label>
        <input {...register('name')} placeholder="Ej: Crédito banco, Tarjeta Visa" className="input" autoFocus />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Installment + Total */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Valor de la cuota</label>
          <input {...register('installment_amount')} type="number" placeholder="0" className="input" />
          {errors.installment_amount && (
            <p className="text-danger text-xs mt-1">{errors.installment_amount.message}</p>
          )}
        </div>
        <div>
          <label className="label">Número de cuotas</label>
          <input {...register('total_installments')} type="number" min="1" placeholder="0" className="input" />
          {errors.total_installments && (
            <p className="text-danger text-xs mt-1">{errors.total_installments.message}</p>
          )}
        </div>
      </div>

      {/* Total preview */}
      {totalPreview !== null && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-txt-secondary text-sm">Deuda total</span>
          <span className="text-primary-light font-bold text-lg">{formatCurrency(totalPreview)}</span>
        </div>
      )}

      {/* Edit mode: show paid_installments directly */}
      {isEdit && (
        <div>
          <label className="label">Cuotas pagadas</label>
          <input
            {...register('paid_installments')}
            type="number"
            min="0"
            max={watch('total_installments')}
            className="input"
          />
          {errors.paid_installments && (
            <p className="text-danger text-xs mt-1">{errors.paid_installments.message}</p>
          )}
        </div>
      )}

      {/* Previous payments section (create mode only) */}
      {!isEdit && (
        <>
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setValue('has_previous', !hasPrevious)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  hasPrevious ? 'bg-primary' : 'bg-bg-elevated border border-white/20'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  hasPrevious ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className="text-txt-secondary text-sm">¿Ya has realizado pagos anteriores?</span>
            </label>
          </div>

          {hasPrevious && (
            <div className="bg-bg-elevated rounded-xl p-4 space-y-3 border border-white/5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  [false, 'Por cuotas'],
                  [true, 'Por valor'],
                ].map(([val, lbl]) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setValue('paid_by_value', val)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      paidByValue === val
                        ? 'gradient-primary text-white border-transparent'
                        : 'border-white/10 text-txt-secondary hover:border-white/20'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {paidByValue ? (
                <div>
                  <label className="label">Valor ya pagado</label>
                  <input
                    {...register('previous_value')}
                    type="number"
                    placeholder="0"
                    className="input"
                  />
                  {Number(installmentAmount) > 0 && Number(watch('previous_value')) > 0 && (
                    <p className="text-txt-muted text-xs mt-1">
                      ≈ {Math.floor(Number(watch('previous_value')) / Number(installmentAmount))} cuotas
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="label">Cuotas ya pagadas</label>
                  <input
                    {...register('paid_installments')}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="input"
                  />
                  {Number(watch('paid_installments')) > 0 && Number(installmentAmount) > 0 && (
                    <p className="text-txt-muted text-xs mt-1">
                      = {formatCurrency(Number(watch('paid_installments')) * Number(installmentAmount))} pagados
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Notes */}
      <div>
        <label className="label">Notas (opcional)</label>
        <input {...register('notes')} placeholder="Ej: Vence el 15 de cada mes" className="input" />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar deuda'}
        </button>
      </div>
    </form>
  )
}

function PayModal({ debt, onConfirm, onClose }) {
  const [count, setCount] = useState(1)
  const remaining = Number(debt.total_installments) - Number(debt.paid_installments)
  const maxCount = remaining
  const toPay = Math.min(count, maxCount)
  const amount = toPay * Number(debt.installment_amount)

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="bg-bg-elevated rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-txt-muted">Valor por cuota</span>
          <span className="text-txt-primary font-semibold">{formatCurrency(debt.installment_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-txt-muted">Cuotas restantes</span>
          <span className="text-warning font-semibold">{remaining}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-txt-muted">Saldo pendiente</span>
          <span className="text-danger font-semibold">
            {formatCurrency(remaining * Number(debt.installment_amount))}
          </span>
        </div>
      </div>

      {/* Cuotas selector */}
      <div>
        <label className="label">¿Cuántas cuotas pagar?</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="w-10 h-10 rounded-xl bg-bg-elevated border border-white/10 text-txt-primary font-bold hover:border-white/20 transition-colors"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <span className="text-txt-primary font-bold text-2xl">{toPay}</span>
            <span className="text-txt-muted text-sm ml-1">{toPay === 1 ? 'cuota' : 'cuotas'}</span>
          </div>
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
            className="w-10 h-10 rounded-xl bg-bg-elevated border border-white/10 text-txt-primary font-bold hover:border-white/20 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Total to pay */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-txt-secondary text-sm">Total a registrar</span>
        <span className="text-primary-light font-bold text-xl">{formatCurrency(amount)}</span>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button
          type="button"
          onClick={() => onConfirm(toPay)}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <CheckCircle size={15} />
          Registrar pago
        </button>
      </div>
    </div>
  )
}

export default function Debts() {
  const { debts, loading, add, update, payInstallments, remove, totals } = useDebts()
  const [addOpen, setAddOpen] = useState(false)
  const [payDebt, setPayDebt] = useState(null)
  const [editDebt, setEditDebt] = useState(null)

  const active = debts.filter((d) => d.status === 'active')
  const paid = debts.filter((d) => d.status === 'paid')

  const handleAdd = async (data) => {
    await add(data)
    setAddOpen(false)
  }

  const handlePayment = async (count) => {
    await payInstallments(payDebt.id, count)
    setPayDebt(null)
  }

  const handleEdit = async ({ name, installment_amount, total_installments, paid_installments, notes }) => {
    const totalAmt = Number(installment_amount) * Number(total_installments)
    const paidAmt = Number(installment_amount) * Number(paid_installments)
    const status = Number(paid_installments) >= Number(total_installments) ? 'paid' : 'active'
    await update(editDebt.id, {
      name,
      installment_amount: Number(installment_amount),
      total_installments: Number(total_installments),
      paid_installments: Number(paid_installments),
      total_amount: totalAmt,
      paid_amount: paidAmt,
      status,
      notes: notes || null,
    })
    setEditDebt(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">Deudas</h1>
          <p className="text-txt-muted text-sm mt-0.5">Seguimiento de créditos y cuotas</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span className="hidden sm:inline">Nueva deuda</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Deuda total', value: formatCurrency(totals.total), color: 'text-danger' },
          { label: 'Ya pagado', value: formatCurrency(totals.paid), color: 'text-success' },
          { label: 'Pendiente', value: formatCurrency(totals.pending), color: 'text-warning' },
          { label: 'Cuotas restantes', value: totals.installmentsLeft, color: 'text-primary-light' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="label">{label}</p>
            <p className={`font-bold text-lg ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : active.length === 0 && paid.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin deudas registradas"
          description="Registra tus créditos y cuotas para hacerles seguimiento"
          action={
            <button onClick={() => setAddOpen(true)} className="btn-primary">
              <Plus size={14} className="inline mr-1" />Agregar deuda
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Active debts */}
          {active.map((d) => {
            const paidPct = Number(d.total_installments) > 0
              ? (Number(d.paid_installments) / Number(d.total_installments)) * 100
              : 0
            const remaining = Number(d.total_installments) - Number(d.paid_installments)
            const remainingAmount = remaining * Number(d.installment_amount)

            return (
              <div key={d.id} className="card">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-txt-primary font-semibold text-base truncate">{d.name}</p>
                    <p className="text-txt-muted text-xs mt-0.5">
                      {formatCurrency(d.installment_amount)} × {d.total_installments} cuotas
                      {' '}= <span className="text-txt-secondary">{formatCurrency(d.total_amount)}</span>
                    </p>
                    {d.notes && (
                      <p className="text-txt-muted text-xs mt-1 italic">{d.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPayDebt(d)}
                      disabled={remaining === 0}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Layers size={12} />
                      Pagar cuota
                    </button>
                    <button
                      onClick={() => setEditDebt(d)}
                      className="p-1.5 rounded-lg text-txt-muted hover:text-primary-light hover:bg-primary/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${d.name}"?`)) remove(d.id) }}
                      className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-txt-muted">
                      {d.paid_installments} / {d.total_installments} cuotas pagadas
                    </span>
                    <span className="text-txt-muted">{Math.round(paidPct)}%</span>
                  </div>
                  <ProgressBar value={d.paid_installments} max={d.total_installments} colorClass="gradient-primary" />
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-success font-medium">
                      Pagado: {formatCurrency(d.paid_amount)}
                    </span>
                    <span className="text-danger font-medium">
                      Faltan {remaining} cuota{remaining !== 1 ? 's' : ''} · {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Paid debts */}
          {paid.length > 0 && (
            <div className="pt-2">
              <p className="text-txt-muted text-xs font-medium uppercase tracking-wider mb-2 px-1">
                Pagadas ({paid.length})
              </p>
              {paid.map((d) => (
                <div key={d.id} className="card flex items-center justify-between opacity-50 mb-2">
                  <div>
                    <p className="text-txt-primary font-medium text-sm">{d.name}</p>
                    <p className="text-success text-xs">
                      {d.total_installments} cuotas · {formatCurrency(d.total_amount)} — Completada
                    </p>
                  </div>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar "${d.name}"?`)) remove(d.id) }}
                    className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Nueva deuda">
        <DebtForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!payDebt}
        onClose={() => setPayDebt(null)}
        title={`Pagar cuota · ${payDebt?.name}`}
      >
        {payDebt && (
          <PayModal debt={payDebt} onConfirm={handlePayment} onClose={() => setPayDebt(null)} />
        )}
      </Modal>

      <Modal isOpen={!!editDebt} onClose={() => setEditDebt(null)} title="Editar deuda">
        {editDebt && (
          <DebtForm debt={editDebt} onSubmit={handleEdit} onCancel={() => setEditDebt(null)} />
        )}
      </Modal>
    </div>
  )
}
