import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { currentMonth } from '../utils/dateHelpers'

export function useDebts() {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDebts(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { refetch() }, [refetch])

  const add = async ({ name, installment_amount, total_installments, paid_installments = 0, is_monthly = true, notes }) => {
    const totalAmt = Number(installment_amount) * Number(total_installments)
    const paidAmt = Number(installment_amount) * Number(paid_installments)
    const status = paid_installments >= total_installments ? 'paid' : 'active'
    const { error } = await supabase.from('debts').insert({
      user_id: user.id,
      name,
      installment_amount: Number(installment_amount),
      total_installments: Number(total_installments),
      paid_installments: Number(paid_installments),
      total_amount: totalAmt,
      paid_amount: paidAmt,
      status,
      is_monthly: !!is_monthly,
      notes: notes || null,
    })
    if (error) throw error
    await refetch()
  }

  const update = async (id, payload) => {
    const { error } = await supabase.from('debts').update(payload).eq('id', id)
    if (error) throw error
    await refetch()
  }

  // Pay N installments at once (default 1)
  const payInstallments = async (id, count = 1) => {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    const newPaid = Math.min(
      Number(debt.paid_installments) + count,
      Number(debt.total_installments)
    )
    const newPaidAmount = Number(debt.installment_amount) * newPaid
    const status = newPaid >= Number(debt.total_installments) ? 'paid' : 'active'
    await update(id, {
      paid_installments: newPaid,
      paid_amount: newPaidAmount,
      status,
      last_payment_month: currentMonth(),
    })
  }

  // Marca/desmarca la deuda como cubierta en el checklist mensual.
  // Es solo un check informativo: no toca paid_installments/paid_amount/status,
  // y no se reinicia solo al cambiar de mes — persiste hasta que se desmarque
  // manualmente o se use "Reiniciar mes".
  const toggleMonthlyPayment = async (id) => {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    const isCovered = !!debt.last_payment_month
    await update(id, { last_payment_month: isCovered ? null : currentMonth() })
  }

  // Desmarca manualmente las deudas cubiertas del checklist (no afecta paid_installments).
  const resetMonth = async () => {
    const ids = debts.filter((d) => d.last_payment_month).map((d) => d.id)
    if (ids.length === 0) return
    const { error } = await supabase
      .from('debts')
      .update({ last_payment_month: null })
      .in('id', ids)
    if (error) throw error
    await refetch()
  }

  // Cierra la deuda como pagada, ajustando el total a lo realmente abonado
  // (útil si se negoció/saldó por menos): total_amount pasa a igualar
  // paid_amount, así no queda un pendiente fantasma en el histórico.
  const finalize = async (id) => {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    await update(id, {
      paid_installments: Number(debt.total_installments),
      total_amount: Number(debt.paid_amount),
      status: 'paid',
      last_payment_month: null,
    })
  }

  const remove = async (id) => {
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) throw error
    await refetch()
  }

  const totals = debts
    .filter((d) => d.status === 'active')
    .reduce(
      (acc, d) => {
        acc.total += Number(d.total_amount)
        acc.paid += Number(d.paid_amount)
        acc.installmentsLeft += Number(d.total_installments) - Number(d.paid_installments)
        if (d.is_monthly) {
          acc.monthlyForecast += Number(d.installment_amount)
          if (d.last_payment_month) {
            acc.monthlyCovered += Number(d.installment_amount)
          }
        }
        return acc
      },
      { total: 0, paid: 0, installmentsLeft: 0, monthlyForecast: 0, monthlyCovered: 0 }
    )
  totals.pending = totals.total - totals.paid

  return { debts, loading, add, update, payInstallments, toggleMonthlyPayment, resetMonth, finalize, remove, totals }
}
