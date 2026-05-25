import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MiniThemePicker from '../../components/ui/MiniThemePicker'

const schema = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ fullName, email, password }) => {
    setError('')
    try {
      await signUp({ email, password, fullName })
      setSuccess(true)
    } catch (e) {
      setError(e.message || 'Error al registrarse')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl gradient-success flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h2 className="text-txt-primary font-bold text-lg mb-2">¡Cuenta creada!</h2>
          <p className="text-txt-secondary text-sm mb-4">
            Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </p>
          <Link to="/login" className="btn-primary inline-block">Ir al login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-pink/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">Crear cuenta</h1>
          <p className="text-txt-secondary text-sm mt-1">Empieza a controlar tus finanzas hoy</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="label">Nombre completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input {...register('fullName')} placeholder="Juan Pérez" className="input pl-10" />
              </div>
              {errors.fullName && <p className="text-danger text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input {...register('email')} type="email" placeholder="tu@email.com" className="input pl-10" />
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

            <div>
              <label className="label">Confirmar contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
                <input
                  {...register('confirm')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
              {errors.confirm && <p className="text-danger text-xs mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-txt-secondary text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>

        <MiniThemePicker />
      </div>
    </div>
  )
}
