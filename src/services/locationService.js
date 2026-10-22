// ======================================================
// LOCATION SERVICE
//
// - searchPlaces()      place name  -> list of places + coordinates
// - reverseGeocode()    coordinates -> address
// - getCurrentPosition() browser GPS (promise based)
// - small geo helpers   (validation, distance, formatting)
//
// Uses a Nominatim-compatible geocoder (OpenStreetMap by default).
// Everything below can be changed from .env, no code change needed:
//
//   VITE_GEOCODER_URL            default https://nominatim.openstreetmap.org
//   VITE_GEOCODER_COUNTRY_CODES  default bd   (comma list, empty = worldwide)
//   VITE_GEOCODER_LANGUAGE       default en
//   VITE_GEOCODER_EMAIL          optional contact email (recommended by Nominatim)
//
// NOTE: the public Nominatim server is for development / light use
// (max ~1 request per second). For production, point
// VITE_GEOCODER_URL to your own Nominatim instance.
// ======================================================

// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------

const GEOCODER_URL = (
  import.meta.env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org'
).replace(/\/$/, '')

const DEFAULT_COUNTRY_CODES = import.meta.env.VITE_GEOCODER_COUNTRY_CODES ?? 'bd'
const GEOCODER_LANGUAGE = import.meta.env.VITE_GEOCODER_LANGUAGE || 'en'
const GEOCODER_EMAIL = import.meta.env.VITE_GEOCODER_EMAIL || ''

export const MIN_SEARCH_LENGTH = 3

const DEFAULT_SEARCH_LIMIT = 6
const MAX_ADDRESS_LENGTH = 500 // matches the backend Ride schema

const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_MAX_ENTRIES = 100

// ------------------------------------------------------
// ERRORS
// ------------------------------------------------------

export class LocationServiceError extends Error {
  constructor(code, message, cause) {
    super(message)
    this.name = 'LocationServiceError'
    this.code = code
    this.cause = cause
  }
}

// True for cancelled requests (fetch AbortError or axios cancel)
export const isAbortError = (error) =>
  error?.name === 'AbortError' || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED'

const ERROR_MESSAGES = {
  NETWORK: 'Could not reach the search service. Check your connection or tap the map instead.',
  RATE_LIMITED: 'Too many searches. Please wait a moment or tap the map instead.',
  SERVER: 'Location search is unavailable right now. Please tap the map instead.',
  UNSUPPORTED: 'Your browser does not support location services.',
  PERMISSION_DENIED: 'Please allow location access in your browser.',
  TIMEOUT: 'Location request timed out. Please try again.',
  UNAVAILABLE: 'Could not get your location.',
}

export const describeLocationError = (error) =>
  ERROR_MESSAGES[error?.code] || 'Something went wrong. Please try again.'

// ------------------------------------------------------
// GEO HELPERS
// ------------------------------------------------------

export const isValidCoordinate = (latitude, longitude) =>
  typeof latitude === 'number' &&
  typeof longitude === 'number' &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180

// { latitude, longitude, ... } -> { latitude, longitude } | null
export const toMapPosition = (location) =>
  location && isValidCoordinate(location.latitude, location.longitude)
    ? { latitude: location.latitude, longitude: location.longitude }
    : null

// Straight-line distance in metres (Haversine)
export const distanceInMeters = (a, b) => {
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const earthRadius = 6371000

  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(h))
}

export const formatCoordinates = (position, digits = 5) =>
  position ? `${position.latitude.toFixed(digits)}, ${position.longitude.toFixed(digits)}` : ''

// Used when an address cannot be found for a pin
export const fallbackAddress = (latitude, longitude) =>
  `Pinned location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`

// ------------------------------------------------------
// SMALL IN-MEMORY CACHE (avoids repeating the same request)
// ------------------------------------------------------

const cache = new Map()

const cacheGet = (key) => {
  const entry = cache.get(key)

  if (!entry) return null

  if (Date.now() - entry.time > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }

  // refresh position (LRU)
  cache.delete(key)
  cache.set(key, entry)

  return entry.value
}

const cacheSet = (key, value) => {
  cache.set(key, { value, time: Date.now() })

  if (cache.size > CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value)
  }
}

// ------------------------------------------------------
// HTTP
// ------------------------------------------------------

const request = async (path, params, { signal } = {}) => {
  const url = new URL(`${GEOCODER_URL}${path}`)

  const query = {
    format: 'jsonv2',
    'accept-language': GEOCODER_LANGUAGE,
    ...(GEOCODER_EMAIL ? { email: GEOCODER_EMAIL } : {}),
    ...params,
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  let response

  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (isAbortError(error)) throw error

    throw new LocationServiceError('NETWORK', ERROR_MESSAGES.NETWORK, error)
  }

  if (response.status === 429) {
    throw new LocationServiceError('RATE_LIMITED', ERROR_MESSAGES.RATE_LIMITED)
  }

  if (!response.ok) {
    throw new LocationServiceError('SERVER', ERROR_MESSAGES.SERVER)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new LocationServiceError('SERVER', ERROR_MESSAGES.SERVER, error)
  }
}

// ------------------------------------------------------
// NORMALISE A GEOCODER RESULT
//
// -> { id, name, secondary, address, latitude, longitude }
// ------------------------------------------------------

const toPlace = (item) => {
  if (!item) return null

  const latitude = Number.parseFloat(item.lat)
  const longitude = Number.parseFloat(item.lon)

  if (!isValidCoordinate(latitude, longitude)) return null

  const displayName = typeof item.display_name === 'string' ? item.display_name : ''

  const parts = displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const name =
    (typeof item.name === 'string' && item.name.trim()) || parts[0] || 'Selected location'

  const secondaryParts = parts[0] === name ? parts.slice(1) : parts

  return {
    id: String(item.place_id ?? `${latitude},${longitude}`),
    name,
    secondary: secondaryParts.slice(0, 3).join(', '),
    address: (displayName || name).slice(0, MAX_ADDRESS_LENGTH),
    latitude,
    longitude,
  }
}

// ------------------------------------------------------
// SEARCH  (place name -> places)
// ------------------------------------------------------

export const searchPlaces = async (query, { signal, limit, countryCodes } = {}) => {
  const text = typeof query === 'string' ? query.trim() : ''

  if (text.length < MIN_SEARCH_LENGTH) return []

  const codes = countryCodes ?? DEFAULT_COUNTRY_CODES
  const maxResults = limit ?? DEFAULT_SEARCH_LIMIT

  const cacheKey = `search|${codes}|${maxResults}|${text.toLowerCase()}`
  const cached = cacheGet(cacheKey)

  if (cached) return cached

  const data = await request(
    '/search',
    {
      q: text,
      limit: maxResults,
      addressdetails: 1,
      countrycodes: codes,
    },
    { signal }
  )

  const places = (Array.isArray(data) ? data : []).map(toPlace).filter(Boolean)

  cacheSet(cacheKey, places)

  return places
}

// ------------------------------------------------------
// REVERSE GEOCODE  (coordinates -> place | null)
// The returned place keeps the coordinates you asked for.
// ------------------------------------------------------

export const reverseGeocode = async (latitude, longitude, { signal } = {}) => {
  if (!isValidCoordinate(latitude, longitude)) return null

  const cacheKey = `reverse|${latitude.toFixed(5)}|${longitude.toFixed(5)}`
  const cached = cacheGet(cacheKey)

  if (cached) return cached

  const data = await request(
    '/reverse',
    {
      lat: latitude.toFixed(6),
      lon: longitude.toFixed(6),
      zoom: 18,
      addressdetails: 1,
    },
    { signal }
  )

  if (!data || data.error) return null

  const place = toPlace(data)

  if (!place) return null

  const result = { ...place, latitude, longitude }

  cacheSet(cacheKey, result)

  return result
}

// ------------------------------------------------------
// BROWSER GPS
// -> { latitude, longitude, accuracy }
// ------------------------------------------------------

export const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new LocationServiceError('UNSUPPORTED', ERROR_MESSAGES.UNSUPPORTED))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (error) => {
        const code =
          error.code === 1 ? 'PERMISSION_DENIED' : error.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE'

        reject(new LocationServiceError(code, ERROR_MESSAGES[code], error))
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        ...options,
      }
    )
  })
