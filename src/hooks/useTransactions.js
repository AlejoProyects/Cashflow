import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { monthStart, monthEnd, currentMonth } from '../utils/dateHelpers'

export function useTransactions({ startDate, endDate } = {}) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const start = startDate ?? monthStart(currentMonth())
  const end = endDate ?? monthEnd(currentMonth())

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name, color, icon, type), debts(id, name)')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    setTransactions(data ?? [])
    setLoading(false)
  }, [user, start, end])

  useEffect(() => { fetch() }, [fetch])

  const add = async (payload) => {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id })
    if (error) throw error
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
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
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
