import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Calendar, PieChart, Target, Tags, LogOut, Wallet
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transacciones' },
  { to: '/debts', icon: CreditCard, label: 'Deudas' },
  { to: '/fixed-payments', icon: Calendar, label: 'Pagos Fijos' },
  { to: '/budgets', icon: PieChart, label: 'Presupuesto' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/categories', icon: Tags, label: 'Categorías' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="hidden md:flex flex-col w-60 bg-bg-surface border-r border-white/5 h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <p className="text-txt-primary font-bold text-sm leading-none">Cashflow</p>
          <p className="text-txt-muted text-xs mt-0.5">Control personal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 px-3 py-2 mb-1 w-full rounded-xl hover:bg-bg-elevated transition-colors text-left group"
          title="Ver perfil"
        >
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user?.user_metadata?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {user?.user_metadata?.full_name && (
              <p className="text-txt-primary text-xs font-semibold truncate leading-tight">
                {user.user_metadata.full_name}
              </p>
            )}
            <p className="text-txt-muted text-xs truncate">{user?.email}</p>
          </div>
        </button>
        <button
          onClick={signOut}
          className="nav-link w-full text-danger hover:text-danger hover:bg-danger/10"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
