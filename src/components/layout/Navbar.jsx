import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Calendar, PieChart,
  Target, Tags, User, LogOut, Wallet, MoreHorizontal, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const primaryLinks = [
  { to: '/',                icon: LayoutDashboard, label: 'Inicio' },
  { to: '/transactions',    icon: ArrowLeftRight,  label: 'Movimientos' },
  { to: '/debts',           icon: CreditCard,      label: 'Deudas' },
  { to: '/fixed-payments',  icon: Calendar,        label: 'Pagos' },
]

const secondaryLinks = [
  { to: '/budgets',    icon: PieChart, label: 'Presupuesto' },
  { to: '/goals',      icon: Target,   label: 'Metas' },
  { to: '/categories', icon: Tags,     label: 'Categorías' },
  { to: '/profile',    icon: User,     label: 'Mi perfil' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  const avatar = (user?.user_metadata?.full_name ?? user?.email ?? '?')[0].toUpperCase()

  const handleSecondaryNav = (to) => {
    setDrawerOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-bg-surface/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Wallet size={15} className="text-white" />
            </div>
            <span className="text-txt-primary font-bold text-sm">Cashflow</span>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white glow-primary"
          >
            {avatar}
          </button>
        </div>
      </header>

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface/95 backdrop-blur-md border-t border-white/5 safe-bottom">
        <div className="flex items-stretch h-16">
          {primaryLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-primary-light active' : 'text-txt-muted hover:text-txt-secondary'
                }`
              }
            >
              <div className="p-1.5 rounded-xl transition-all duration-150 group-[.active]:bg-primary/15">
                <Icon size={19} />
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </NavLink>
          ))}

          {/* More */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-txt-muted hover:text-txt-secondary transition-colors"
          >
            <div className="p-1.5 rounded-xl">
              <MoreHorizontal size={19} />
            </div>
            <span className="text-[10px] font-medium leading-none">Más</span>
          </button>
        </div>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-bg-base/70 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-bg-surface border-t border-white/10 rounded-t-3xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-txt-primary font-semibold text-sm">Menú</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-elevated transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-3 pb-6 space-y-0.5">
              {secondaryLinks.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => handleSecondaryNav(to)}
                  className="nav-link w-full text-left"
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2">
                <button
                  onClick={() => { setDrawerOpen(false); signOut() }}
                  className="nav-link w-full text-left text-danger hover:text-danger hover:bg-danger/10"
                >
                  <LogOut size={17} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
