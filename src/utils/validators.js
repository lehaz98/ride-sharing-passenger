export const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6
}

export const isValidName = (name) => {
  return typeof name === 'string' && name.trim().length >= 2
}

export const isValidPhone = (phone) => {
  if (typeof phone !== 'string') {
    return false
  }

  const normalized = phone.trim().replace(/[\s()-]/g, '')

  return /^\+?[0-9]{7,15}$/.test(normalized)
}

export const isValidCoordinate = (latitude, longitude) => {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    latitude === '' ||
    longitude === ''
  ) {
    return false
  }

  const lat = Number(latitude)
  const lng = Number(longitude)

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export const isValidLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return false
  }

  return (
    typeof location.address === 'string' &&
    location.address.trim().length > 0 &&
    isValidCoordinate(location.latitude, location.longitude)
  )
}

export const validateRideLocations = (pickup, destination) => {
  const errors = {}

  if (!isValidLocation(pickup)) {
    errors.pickup = 'Please select a valid pickup location.'
  }

  if (!isValidLocation(destination)) {
    errors.destination = 'Please select a valid destination.'
  }

  if (
    isValidLocation(pickup) &&
    isValidLocation(destination) &&
    Number(pickup.latitude) === Number(destination.latitude) &&
    Number(pickup.longitude) === Number(destination.longitude)
  ) {
    errors.destination = 'Pickup and destination must be different.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
