import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', type: 'expense', color: '#f43f5e', icon: 'utensils' },
  { name: 'Transporte', type: 'expense', color: '#f97316', icon: 'car' },
  { name: 'Vivienda', type: 'expense', color: '#eab308', icon: 'home' },
  { name: 'Salud', type: 'expense', color: '#10b981', icon: 'heart' },
  { name: 'Educación', type: 'expense', color: '#06b6d4', icon: 'book' },
  { name: 'Entretenimiento', type: 'expense', color: '#8b5cf6', icon: 'star' },
  { name: 'Ropa', type: 'expense', color: '#ec4899', icon: 'tag' },
  { name: 'Servicios', type: 'expense', color: '#64748b', icon: 'zap' },
  { name: 'Otros gastos', type: 'expense', color: '#94a3b8', icon: 'more-horizontal' },
  { name: 'Salario', type: 'income', color: '#10b981', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#06b6d4', icon: 'laptop' },
  { name: 'Negocio', type: 'income', color: '#8b5cf6', icon: 'trending-up' },
  { name: 'Inversión', type: 'income', color: '#f59e0b', icon: 'bar-chart' },
  { name: 'Otros ingresos', type: 'income', color: '#94a3b8', icon: 'plus-circle' },
]

export function useCategories(type) {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) return
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (type) query = query.eq('type', type)

    const { data } = await query

    // Auto-seed defaults the first time a user has no categories
    if (!type && (data ?? []).length === 0) {
      const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }))
      await supabase.from('categories').insert(rows)
      const { data: seeded } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      setCategories(seeded ?? [])
    } else {
      setCategories(data ?? [])
    }
    setLoading(false)
  }, [user, type])

  useEffect(() => { refetch() }, [refetch])

  const add = async (values) => {
    const { error } = await supabase
      .from('categories')
      .insert({ ...values, user_id: user.id })
    if (error) throw error
    await refetch()
  }

  const update = async (id, values) => {
    const { error } = await supabase
      .from('categories')
      .update(values)
      .eq('id', id)
    if (error) throw error
    await refetch()
  }

  const remove = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await refetch()
  }

  const seedDefaults = async () => {
    const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user.id }))
    const { error } = await supabase.from('categories').insert(rows)
    if (error) throw error
    await refetch()
  }

  return { categories, loading, add, update, remove, seedDefaults }
}
