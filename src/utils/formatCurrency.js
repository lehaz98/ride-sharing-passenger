const isValidNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return false
  }

  return Number.isFinite(Number(value))
}

export const formatCurrency = (amount, currency = 'BDT') => {
  if (!isValidNumber(amount)) {
    return '—'
  }

  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount))
  } catch {
    return `৳${Number(amount).toLocaleString('en-BD', {
      maximumFractionDigits: 2,
    })}`
  }
}

export const formatFare = (amount) => {
  if (!isValidNumber(amount)) {
    return '—'
  }

  return `৳${Math.round(Number(amount)).toLocaleString('en-BD')}`
}

export default formatCurrency
