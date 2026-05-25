export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Icon size={24} className="text-primary-light" />
        </div>
      )}
      <p className="text-txt-primary font-semibold mb-1">{title}</p>
      {description && <p className="text-txt-muted text-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
