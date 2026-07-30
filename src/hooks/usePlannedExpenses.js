import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { currentMonth } from '../utils/dateHelpers'

export function usePlannedExpenses(month = currentMonth()) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('planned_expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .order('created_at')
    setExpenses(data ?? [])
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetch() }, [fetch])

  const add = async ({ name, amount, notes }) => {
    const { error } = await supabase.from('planned_expenses').insert({
      user_id: user.id,
      name,
      amount: Number(amount),
      notes: notes || null,
      month,
    })
    if (error) throw error
    await fetch()
  }

  const togglePaid = async (id, currentStatus) => {
    const { error } = await supabase
      .from('planned_expenses')
      .update({ status: currentStatus === 'paid' ? 'pending' : 'paid' })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('planned_expenses').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  const resetMonth = async () => {
    const ids = expenses.map((e) => e.id)
    if (ids.length === 0) return
    const { error } = await supabase
      .from('planned_expenses')
      .update({ status: 'pending' })
      .in('id', ids)
    if (error) throw error
    await fetch()
  }

  return { expenses, loading, add, togglePaid, remove, resetMonth, refetch: fetch }
}
