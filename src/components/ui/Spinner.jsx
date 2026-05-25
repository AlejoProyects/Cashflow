export default function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${s[size]} border-2 border-primary/20 border-t-primary rounded-full animate-spin`} />
  )
}
