import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { monthStart, monthEnd, currentMonth } from '../utils/dateHelpers'

export function useTransactions({ startDate, endDate, all } = {}) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const start = startDate ?? monthStart(currentMonth())
  const end = endDate ?? monthEnd(currentMonth())

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('*, categories(name, color, icon, type), debts(id, name), fixed_payments(id, name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!all) {
      query = query.gte('date', start).lte('date', end)
    }

    const { data } = await query
    setTransactions(data ?? [])
    setLoading(false)
  }, [user, start, end, all])

  useEffect(() => { fetch() }, [fetch])

  const updateDebtProgress = async (debtId, delta) => {
    const { data: debt, error: fetchError } = await supabase
      .from('debts')
      .select('paid_installments, total_installments, installment_amount')
      .eq('id', debtId)
      .eq('user_id', user.id)
      .single()
    if (fetchError || !debt) return
    const currentPaid = parseInt(debt.paid_installments, 10) || 0
    const totalInstallments = parseInt(debt.total_installments, 10) || 0
    const installmentAmount = Number(debt.installment_amount) || 0
    const newPaid = Math.min(Math.max(currentPaid + delta, 0), totalInstallments)
    const newPaidAmount = installmentAmount * newPaid
    const status = newPaid >= totalInstallments ? 'paid' : 'active'
    const { error: updateError } = await supabase
      .from('debts')
      .update({ paid_installments: newPaid, paid_amount: newPaidAmount, status })
      .eq('id', debtId)
      .eq('user_id', user.id)
    if (updateError) throw updateError
  }

  const updateFixedPaymentStatus = async (fixedPaymentId, status) => {
    const { error } = await supabase
      .from('fixed_payments')
      .update({ status })
      .eq('id', fixedPaymentId)
      .eq('user_id', user.id)
    if (error) throw error
  }

  const add = async (payload) => {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id })
    if (error) throw error
    if (payload.debt_id) await updateDebtProgress(payload.debt_id, 1)
    if (payload.fixed_payment_id) await updateFixedPaymentStatus(payload.fixed_payment_id, 'paid')
    await fetch()
  }

  const update = async (id, payload) => {
    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const tx = transactions.find((t) => t.id === id)
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    if (tx?.debt_id) await updateDebtProgress(tx.debt_id, -1)
    if (tx?.fixed_payment_id) await updateFixedPaymentStatus(tx.fixed_payment_id, 'pending')
    await fetch()
  }

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += Number(t.amount)
      else acc.expense += Number(t.amount)
      return acc
    },
    { income: 0, expense: 0 }
  )
  totals.balance = totals.income - totals.expense

  return { transactions, loading, add, update, remove, totals, refetch: fetch }
}
