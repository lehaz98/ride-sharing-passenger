// ======================================================
// FORMATTERS
// Small display helpers shared by all passenger pages.
// ======================================================

// 188 -> ৳188
export const formatFare = (amount) =>
  Number.isFinite(Number(amount)) ? `৳${Math.round(Number(amount)).toLocaleString('en-BD')}` : '—'

// 4.26 -> 4.3 km
export const formatDistance = (km) => (Number.isFinite(km) ? `${km.toFixed(1)} km` : '—')

// 75 -> 1 h 15 min
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes)) return '—'

  const total = Math.max(1, Math.round(minutes))

  if (total < 60) return `${total} min`

  const hours = Math.floor(total / 60)
  const rest = total % 60

  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

// ISO date -> 12 Oct, 03:45 pm
export const formatDateTime = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Mongo id -> last 6 characters, easy to read out loud
export const shortId = (id) => (id ? String(id).slice(-6).toUpperCase() : '—')
