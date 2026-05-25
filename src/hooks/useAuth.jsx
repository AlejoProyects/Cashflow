import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEFAULT_CATEGORIES = [
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Preserve the same object reference when it's the same user (e.g. token refresh),
      // so hooks with [user] dependencies don't re-run unnecessarily.
      setUser((prev) => {
        const next = session?.user ?? null
        return prev?.id === next?.id ? prev : next
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error

    if (data.user) {
      await seedDefaultCategories(data.user.id)
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateProfile = async ({ fullName }) => {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword, updatePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

async function seedDefaultCategories(userId) {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing?.length > 0) return

  const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }))
  await supabase.from('categories').insert(rows)
}

export const useAuth = () => useContext(AuthContext)
