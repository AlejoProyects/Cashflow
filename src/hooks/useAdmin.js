import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { isSuperAdmin } from '../utils/admin'

// Solo para el superadmin: lee datos de TODOS los usuarios.
// La lista de usuarios viene de la función RPC admin_list_users() (valida el
// email antes de tocar auth.users). Los datos por usuario dependen de las
// políticas RLS "admin_read_all_*" (ver supabase_schema.sql), que permiten
// SELECT sin filtro de user_id cuando auth.jwt() es el correo admin.
export function useAdmin() {
  const { user } = useAuth()
  const admin = isSuperAdmin(user)

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loadingUserData, setLoadingUserData] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!admin) return
    setLoadingUsers(true)
    const { data } = await supabase.rpc('admin_list_users')
    setUsers(data ?? [])
    setLoadingUsers(false)
  }, [admin])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const selectUser = useCallback(async (userId) => {
    if (!admin) return
    setSelectedUserId(userId)
    setUserData(null)
    if (!userId) return
    setLoadingUserData(true)

    const [transactions, debts, fixedPayments, budgets, goals, plannedExpenses] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, color, icon, type), debts(id, name), fixed_payments(id, name)')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('fixed_payments')
        .select('*, categories(name, color, icon)')
        .eq('user_id', userId)
        .order('due_day', { ascending: true }),
      supabase
        .from('budgets')
        .select('*, categories(name, color, icon)')
        .eq('user_id', userId)
        .order('month', { ascending: false }),
      supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('planned_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false }),
    ])

    setUserData({
      transactions: transactions.data ?? [],
      debts: debts.data ?? [],
      fixedPayments: fixedPayments.data ?? [],
      budgets: budgets.data ?? [],
      goals: goals.data ?? [],
      plannedExpenses: plannedExpenses.data ?? [],
    })
    setLoadingUserData(false)
  }, [admin])

  return {
    isAdmin: admin,
    users,
    loadingUsers,
    selectedUserId,
    userData,
    loadingUserData,
    selectUser,
  }
}
