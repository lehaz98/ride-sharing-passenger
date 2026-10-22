// ======================================================
// RIDE SERVICE
//
// All passenger ride API calls live here, so pages never
// build request bodies or parse responses themselves.
//
//   POST /api/fare/estimate      route + fare for every vehicle
//   POST /api/rides              create a ride
//   GET  /api/rides/my-rides     passenger ride history
//   GET  /api/rides/:id          one ride
//   PUT  /api/rides/:id/cancel   cancel a ride
//
// Distance, duration and fare are ALWAYS calculated by the
// backend. The client only sends coordinates.
// ======================================================

import api from './api'
import { isAbortError } from './locationService'

export { isAbortError }

// ------------------------------------------------------
// ERROR HELPERS
// ------------------------------------------------------

export const getErrorStatus = (error) => error?.response?.status

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.message || fallback

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const toPoint = ({ latitude, longitude }) => ({ latitude, longitude })

const toLocationPayload = ({ address, latitude, longitude }) => ({
  address: String(address ?? '').trim(),
  latitude,
  longitude,
})

// ------------------------------------------------------
// FARE ESTIMATE
//
// -> {
//      route: { distance (km), duration (minutes), source: 'osrm' | 'estimated' },
//      fares: { car: { totalFare, ... }, bike: {...}, cng: {...} }
//    }
// ------------------------------------------------------

export const fetchRideEstimate = async ({ pickup, destination }, { signal } = {}) => {
  const response = await api.post(
    '/fare/estimate',
    {
      pickup: toPoint(pickup),
      destination: toPoint(destination),
    },
    { signal }
  )

  const data = response.data

  if (!data?.success || !data.route || !data.fares) {
    throw new Error(data?.message || 'Could not calculate the fare.')
  }

  return {
    route: data.route,
    fares: data.fares,
  }
}

// ------------------------------------------------------
// CREATE RIDE
// ------------------------------------------------------

export const requestRide = async ({ pickup, destination, vehicleType, paymentMethod }) => {
  const response = await api.post('/rides', {
    pickup: toLocationPayload(pickup),
    destination: toLocationPayload(destination),
    vehicleType,
    paymentMethod,
  })

  const data = response.data

  if (!data?.success || !data.ride) {
    throw new Error(data?.message || 'The ride request could not be created.')
  }

  return {
    ride: data.ride,
    message: data.message,
  }
}

// ------------------------------------------------------
// PASSENGER RIDE HISTORY
// Backend returns { success, count, rides }, newest first.
// -> Ride[]
// ------------------------------------------------------

export const fetchMyRides = async ({ signal } = {}) => {
  const response = await api.get('/rides/my-rides', { signal })

  const data = response.data

  if (data?.success === false) {
    throw new Error(data.message || 'Could not load your ride history.')
  }

  return Array.isArray(data?.rides) ? data.rides : []
}

// ------------------------------------------------------
// GET ONE RIDE
// Passenger, assigned driver and admin may view it.
// ------------------------------------------------------

export const fetchRideById = async (rideId, { signal } = {}) => {
  const response = await api.get(`/rides/${rideId}`, { signal })

  const data = response.data

  if (!data?.success || !data.ride) {
    throw new Error(data?.message || 'Ride not found.')
  }

  return data.ride
}

// ------------------------------------------------------
// CANCEL RIDE (passenger)
// ------------------------------------------------------

export const cancelRide = async (rideId, reason) => {
  const response = await api.put(`/rides/${rideId}/cancel`, reason ? { reason } : {})

  const data = response.data

  if (!data?.success || !data.ride) {
    throw new Error(data?.message || 'The ride could not be cancelled.')
  }

  return {
    ride: data.ride,
    message: data.message,
  }
}
