import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Pencil, Palette } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme, THEMES } from '../../hooks/useTheme'

const nameSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

function Section({ title, description, children }) {
  return (
    <div className="card space-y-4">
      <div className="pb-3 border-b border-white/5">
        <h2 className="font-semibold text-txt-primary">{title}</h2>
        {description && <p className="text-txt-muted text-sm mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SuccessBadge({ message }) {
  return (
    <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success text-sm rounded-xl px-4 py-3">
      <CheckCircle size={15} />
      {message}
    </div>
  )
}

function NameForm({ user, updateProfile }) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const currentName = user?.user_metadata?.full_name ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { fullName: currentName },
  })

  const onSubmit = async ({ fullName }) => {
    setError('')
    setSuccess(false)
    try {
      await updateProfile({ fullName })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message || 'Error al actualizar el nombre')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && <SuccessBadge message="Nombre actualizado correctamente" />}
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
            value={user?.email ?? ''}
            readOnly
            className="input pl-10 opacity-50 cursor-not-allowed"
          />
        </div>
        <p className="text-txt-muted text-xs mt-1">El email no se puede cambiar</p>
      </div>

      <div>
        <label className="label">Nombre completo</label>
        <div className="relative">
          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            {...register('fullName')}
            placeholder="Tu nombre"
            className="input pl-10"
          />
        </div>
        {errors.fullName && (
          <p className="text-danger text-xs mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        <Pencil size={14} />
        {isSubmitting ? 'Guardando...' : 'Actualizar nombre'}
      </button>
    </form>
  )
}

function PasswordForm({ updatePassword }) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async ({ password }) => {
    setError('')
    setSuccess(false)
    try {
      await updatePassword(password)
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message || 'Error al cambiar la contraseña')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && <SuccessBadge message="Contraseña actualizada correctamente" />}
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="label">Nueva contraseña</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            {...register('password')}
            type={showPwd ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
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
        {errors.password && (
          <p className="text-danger text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="label">Confirmar nueva contraseña</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            {...register('confirm')}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repite la contraseña"
            className="input pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors"
          >
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.confirm && (
          <p className="text-danger text-xs mt-1">{errors.confirm.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
        <Lock size={14} />
        {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="grid grid-cols-4 gap-3">
      {THEMES.map((t) => {
        const active = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${
              active
                ? 'border-white/30 bg-white/5 scale-105'
                : 'border-white/5 hover:border-white/15 hover:bg-white/3'
            }`}
          >
            {/* Color circle */}
            <div
              className="w-10 h-10 rounded-full shadow-lg transition-transform"
              style={{
                backgroundColor: t.color,
                boxShadow: active ? `0 0 18px ${t.color}80` : undefined,
              }}
            >
              {active && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <CheckCircle size={18} className="text-white drop-shadow" />
                </div>
              )}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-txt-primary' : 'text-txt-muted'}`}>
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function Profile() {
  const { user, updatePassword, updateProfile } = useAuth()
  const initials = (user?.user_metadata?.full_name ?? user?.email ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold glow-primary">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-txt-primary">
            {user?.user_metadata?.full_name || 'Mi perfil'}
          </h1>
          <p className="text-txt-muted text-sm">{user?.email}</p>
        </div>
      </div>

      <Section
        title="Información personal"
        description="Actualiza tu nombre de perfil"
      >
        <NameForm user={user} updateProfile={updateProfile} />
      </Section>

      <Section
        title="Apariencia"
        description="Elige el color principal de la plataforma"
      >
        <ThemePicker />
      </Section>

      <Section
        title="Seguridad"
        description="Cambia tu contraseña de acceso"
      >
        <PasswordForm updatePassword={updatePassword} />
      </Section>
    </div>
  )
}
