import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, gradient, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-txt-muted'

  return (
    <div className="stat-card group hover:border-white/10 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0 flex-1 mr-4">
          <p className="label">{title}</p>
          <p className="text-2xl font-bold text-txt-primary mt-1">{value}</p>
          {subtitle && <p className="text-txt-muted text-xs mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon size={22} className="text-white" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={13} />
          <span>{Math.abs(trend)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )
}
