export default function Badge({ variant = 'muted', children, className = '' }) {
  const variants = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    primary: 'badge-primary',
    muted: 'badge-muted',
  }
  return (
    <span className={`${variants[variant] ?? 'badge-muted'} ${className}`}>
      {children}
    </span>
  )
}
