import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }) => {
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (e) {
      setError(e.message || 'Error al enviar el correo')
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
          <h1 className="text-2xl font-bold text-txt-primary">Recuperar contraseña</h1>
          <p className="text-txt-secondary text-sm mt-1">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 mb-2">
                <CheckCircle size={28} className="text-success" />
              </div>
              <div>
                <p className="text-txt-primary font-semibold">¡Correo enviado!</p>
                <p className="text-txt-secondary text-sm mt-1">
                  Revisa tu bandeja de entrada en{' '}
                  <span className="text-primary-light font-medium">{getValues('email')}</span>
                  {' '}y sigue el enlace para crear una nueva contraseña.
                </p>
              </div>
              <p className="text-txt-muted text-xs">
                ¿No lo encuentras? Revisa la carpeta de spam.
              </p>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
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
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <p className="text-danger text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <div className="divider" />

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-txt-secondary hover:text-txt-primary text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
