import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { currentMonth } from '../utils/dateHelpers'

export function useFixedPayments(month = currentMonth()) {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('fixed_payments')
      .select('*, categories(name, color, icon)')
      .eq('user_id', user.id)
      .eq('month', month)
      .order('due_day')
    setPayments(data ?? [])
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetch() }, [fetch])

  const ensureMonthExists = async () => {
    if (payments.length > 0) return
    const { data: prev } = await supabase
      .from('fixed_payments')
      .select('*')
      .eq('user_id', user.id)
      .neq('month', month)
      .order('month', { ascending: false })
      .limit(50)

    if (!prev || prev.length === 0) return

    const seen = new Set()
    const unique = prev.filter((p) => {
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })

    const newRows = unique.map(({ id, created_at, status, ...rest }) => ({
      ...rest,
      month,
      status: 'pending',
    }))

    if (newRows.length > 0) {
      await supabase.from('fixed_payments').insert(newRows)
      await fetch()
    }
  }

  const add = async (payload) => {
    const { error } = await supabase
      .from('fixed_payments')
      .insert({ ...payload, user_id: user.id, month })
    if (error) throw error
    await fetch()
  }

  const togglePaid = async (id, currentStatus) => {
    const { error } = await supabase
      .from('fixed_payments')
      .update({ status: currentStatus === 'paid' ? 'pending' : 'paid' })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('fixed_payments').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { payments, loading, add, togglePaid, remove, ensureMonthExists, refetch: fetch }
}
