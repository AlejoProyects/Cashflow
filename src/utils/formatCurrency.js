export function formatCurrency(amount, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
}

export function formatNumber(amount) {
  return new Intl.NumberFormat('es-CO').format(amount ?? 0)
}
