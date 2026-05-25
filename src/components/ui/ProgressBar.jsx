export default function ProgressBar({ value, max, colorClass = 'gradient-primary', showLabel = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color =
    pct >= 100 ? 'gradient-danger' :
    pct >= 80  ? 'gradient-warning' :
    colorClass

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between text-xs text-txt-muted">
          <span>{Math.round(pct)}%</span>
          <span>{max > 0 ? `${Math.round(pct)}%` : '—'}</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
