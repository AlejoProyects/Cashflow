import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { currentMonth, monthStart, monthEnd } from '../utils/dateHelpers'

export function useBudgets(month = currentMonth()) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [spending, setSpending] = useState({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: bdata }, { data: tdata }] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, categories(name, color, icon)')
        .eq('user_id', user.id)
        .eq('month', month),
      supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', monthStart(month))
        .lte('date', monthEnd(month)),
    ])

    const spendMap = {}
    tdata?.forEach((t) => {
      spendMap[t.category_id] = (spendMap[t.category_id] ?? 0) + Number(t.amount)
    })

    setBudgets(bdata ?? [])
    setSpending(spendMap)
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetch() }, [fetch])

  const upsert = async (payload) => {
    const { error } = await supabase.from('budgets').upsert(
      { ...payload, user_id: user.id, month },
      { onConflict: 'user_id,category_id,month' }
    )
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { budgets, spending, loading, upsert, remove, refetch: fetch }
}
