import { useCallback, useEffect, useRef, useState } from 'react'

import { ACTIVE_RIDE_STATUSES } from '../constants/ride'

import {
  fetchRideById,
  getErrorMessage,
  getErrorStatus,
  isAbortError,
} from '../services/rideService'

const POLL_INTERVAL_MS = 5000

const PERMANENT_ERROR_STATUSES = [400, 401, 403, 404]

const createLoadingState = () => ({
  status: 'loading',
  error: '',
  errorStatus: null,
  stale: false,
})

const createReadyState = () => ({
  status: 'ready',
  error: '',
  errorStatus: null,
  stale: false,
})

const getRideStatus = (ride) => ride?.rideStatus || ride?.status || ''

export const useRideTracking = (rideId) => {
  const [ride, setRide] = useState(null)
  const [state, setState] = useState(createLoadingState)

  const controllerRef = useRef(null)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(false)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!rideId || !mountedRef.current) return

      controllerRef.current?.abort()

      const controller = new AbortController()
      const requestId = ++requestIdRef.current

      controllerRef.current = controller

      if (!silent) {
        setState(createLoadingState())
      }

      try {
        const latestRide = await fetchRideById(rideId, {
          signal: controller.signal,
        })

        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return
        }

        setRide(latestRide)
        setState(createReadyState())
      } catch (error) {
        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestId !== requestIdRef.current ||
          isAbortError(error)
        ) {
          return
        }

        const errorStatus = getErrorStatus(error) ?? null
        const isPermanent = PERMANENT_ERROR_STATUSES.includes(errorStatus)

        setState((previous) => {
          if (silent && previous.status === 'ready' && !isPermanent) {
            return {
              ...previous,
              stale: true,
              error: getErrorMessage(error, 'Unable to refresh ride details.'),
              errorStatus,
            }
          }

          return {
            status: 'error',
            error: getErrorMessage(error, 'Could not load this ride.'),
            errorStatus,
            stale: false,
          }
        })
      } finally {
        if (controllerRef.current === controller && requestId === requestIdRef.current) {
          controllerRef.current = null
        }
      }
    },
    [rideId]
  )

  // Initial load and cleanup when ride ID changes.
  useEffect(() => {
    mountedRef.current = true

    setRide(null)
    setState(createLoadingState())

    void load()

    return () => {
      mountedRef.current = false
      requestIdRef.current += 1
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [load])

  // IMPORTANT: backend uses rideStatus, not only status.
  const currentStatus = getRideStatus(ride)

  const isActive = Boolean(ride && ACTIVE_RIDE_STATUSES.includes(currentStatus))

  // Refresh active rides every 5 seconds.
  // Pause polling when the tab is hidden or browser is offline.
  useEffect(() => {
    if (!isActive) return undefined

    const refreshQuietly = () => {
      if (!document.hidden && navigator.onLine) {
        void load({ silent: true })
      }
    }

    const intervalId = setInterval(refreshQuietly, POLL_INTERVAL_MS)

    document.addEventListener('visibilitychange', refreshQuietly)
    window.addEventListener('online', refreshQuietly)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshQuietly)
      window.removeEventListener('online', refreshQuietly)
    }
  }, [isActive, load])

  const refresh = useCallback(() => load({ silent: true }), [load])
  const reload = useCallback(() => load(), [load])

  return {
    ride,
    setRide,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    error: state.error,
    errorStatus: state.errorStatus,
    isStale: state.stale,
    isActive,
    refresh,
    reload,
  }
}

export default useRideTracking
