import { Palette } from 'lucide-react'
import { useTheme, THEMES } from '../../hooks/useTheme'

export default function MiniThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <Palette size={13} className="text-txt-muted" />
      <div className="flex items-center gap-2">
        {THEMES.map((t) => {
          const active = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={`rounded-full transition-all duration-200 ${
                active
                  ? 'w-5 h-5 scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-transparent'
                  : 'w-4 h-4 opacity-50 hover:opacity-90 hover:scale-110'
              }`}
              style={{
                backgroundColor: t.color,
                boxShadow: active ? `0 0 10px ${t.color}90` : undefined,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
