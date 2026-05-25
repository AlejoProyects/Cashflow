import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)   // recovery session established
  const [invalid, setInvalid] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
    // It processes the URL hash automatically and establishes a temporary session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Also check if there's already a session (user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else {
        // Give a moment for the hash to be processed before showing invalid
        setTimeout(() => setInvalid((prev) => !prev && !ready), 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async ({ password }) => {
    setError('')
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => navigate('/'), 2500)
    } catch (e) {
      setError(e.message || 'Error al actualizar la contraseña')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-txt-primary">Nueva contraseña</h1>
          <p className="text-txt-secondary text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center space-y-3 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-2">
                <CheckCircle size={28} className="text-success" />
              </div>
              <p className="text-txt-primary font-semibold">¡Contraseña actualizada!</p>
              <p className="text-txt-muted text-sm">Redirigiendo al inicio...</p>
            </div>
          ) : invalid ? (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger/10 mb-2">
                <XCircle size={28} className="text-danger" />
              </div>
              <div>
                <p className="text-txt-primary font-semibold">Enlace inválido o expirado</p>
                <p className="text-txt-muted text-sm mt-1">
                  Solicita un nuevo enlace de recuperación.
                </p>
              </div>
              <button onClick={() => navigate('/forgot-password')} className="btn-primary w-full">
                Solicitar nuevo enlace
              </button>
            </div>
          ) : !ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-txt-muted text-sm">Verificando enlace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    autoFocus
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
                <label className="label">Confirmar contraseña</label>
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

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                {isSubmitting ? 'Guardando...' : 'Establecer nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
