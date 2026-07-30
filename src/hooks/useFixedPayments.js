import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { currentMonth } from '../utils/dateHelpers'

export function useFixedPayments(month = currentMonth()) {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const ensuringRef = useRef(false)

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

  const ensureMonthExists = useCallback(async () => {
    if (!user) return
    // Evita que dos ejecuciones simultáneas (StrictMode/remontaje) inserten duplicados.
    if (ensuringRef.current) return
    ensuringRef.current = true
    try {
      // Consultamos el mes actual directo de la BD en vez del estado de React,
      // que puede estar obsoleto (vacío) cuando este efecto corre al montar.
      const { data: current } = await supabase
        .from('fixed_payments')
        .select('name')
        .eq('user_id', user.id)
        .eq('month', month)

      const existingNames = new Set((current ?? []).map((p) => p.name))
      if (existingNames.size > 0) return

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
        if (seen.has(p.name) || existingNames.has(p.name)) return false
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
    } finally {
      ensuringRef.current = false
    }
  }, [user, month, fetch])

  const add = async (payload) => {
    const { error } = await supabase
      .from('fixed_payments')
      .insert({ ...payload, user_id: user.id, month })
    if (error) throw error
    await fetch()
  }

  const update = async (id, payload) => {
    const { error } = await supabase
      .from('fixed_payments')
      .update(payload)
      .eq('id', id)
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

  const resetMonth = async () => {
    const ids = payments.map((p) => p.id)
    if (ids.length === 0) return
    const { error } = await supabase
      .from('fixed_payments')
      .update({ status: 'pending' })
      .in('id', ids)
    if (error) throw error
    await fetch()
  }

  return { payments, loading, add, update, togglePaid, remove, resetMonth, ensureMonthExists, refetch: fetch }
}
