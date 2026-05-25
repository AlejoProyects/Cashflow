import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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

  const add = async ({ name, installment_amount, total_installments, paid_installments = 0, notes }) => {
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
    await update(id, { paid_installments: newPaid, paid_amount: newPaidAmount, status })
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
        return acc
      },
      { total: 0, paid: 0, installmentsLeft: 0 }
    )
  totals.pending = totals.total - totals.paid

  return { debts, loading, add, update, payInstallments, remove, totals }
}
