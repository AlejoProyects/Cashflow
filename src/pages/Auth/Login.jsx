import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MiniThemePicker from '../../components/ui/MiniThemePicker'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setError('')
    try {
      await signIn(data)
      navigate('/')
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">Toma el control de tus finanzas</h1>
          <p className="text-txt-secondary text-sm mt-1">Ingresa a tu cuenta de Cashflow</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu@email.com"
                  className="input pl-10"
                />
              </div>
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-txt-muted hover:text-primary-light transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-txt-secondary text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>

        <MiniThemePicker />
      </div>
    </div>
  )
}
