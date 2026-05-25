import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setGoals(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (payload) => {
    const { error } = await supabase
      .from('savings_goals')
      .insert({ ...payload, user_id: user.id })
    if (error) throw error
    await fetch()
  }

  const addContribution = async (id, amount) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return
    const newSaved = Number(goal.saved_amount) + Number(amount)
    const status = newSaved >= Number(goal.target_amount) ? 'completed' : 'active'
    const { error } = await supabase
      .from('savings_goals')
      .update({ saved_amount: newSaved, status })
      .eq('id', id)
    if (error) throw error
    await fetch()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  return { goals, loading, add, addContribution, remove, refetch: fetch }
}
