import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'purple', label: 'Morado',  color: '#7c3aed' },
  { id: 'pink',   label: 'Rosado',  color: '#db2777' },
  { id: 'blue',   label: 'Azul',    color: '#2563eb' },
  { id: 'green',  label: 'Verde',   color: '#059669' },
  { id: 'red',    label: 'Rojo',    color: '#dc2626' },
  { id: 'yellow', label: 'Amarillo',color: '#d97706' },
  { id: 'orange', label: 'Naranja', color: '#ea580c' },
]

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('app-theme') || 'purple'
  )

  const setTheme = (id) => {
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('app-theme', id)
    setThemeState(id)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
