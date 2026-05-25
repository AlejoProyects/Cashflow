import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const currentMonth = () => format(new Date(), 'yyyy-MM')

export const currentMonthLabel = () =>
  format(new Date(), 'MMMM yyyy', { locale: es })

export const monthStart = (month = currentMonth()) =>
  format(startOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd')

export const monthEnd = (month = currentMonth()) =>
  format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd')

export const formatDate = (date) =>
  date ? format(parseISO(date), 'dd MMM yyyy', { locale: es }) : '—'

export const formatDateShort = (date) =>
  date ? format(parseISO(date), 'dd/MM/yy') : '—'

export const daysUntil = (date) => {
  if (!date) return null
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}
