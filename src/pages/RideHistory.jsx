import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CarFront, Clock3, MapPin, RefreshCw } from 'lucide-react'
import { fetchMyRides, getErrorMessage } from '../services/rideService'

const getStatus = (ride) => ride?.status || ride?.rideStatus || 'unknown'

const statusStyles = {
  requested: 'bg-amber-100 text-amber-800',
  driver_assigned: 'bg-blue-100 text-blue-800',
  driver_arriving: 'bg-indigo-100 text-indigo-800',
  ride_started: 'bg-violet-100 text-violet-800',
  ride_completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const formatStatus = (status) =>
  String(status)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatDate = (date) => {
  if (!date) return 'Date unavailable'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable'
  }

  return parsedDate.toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatFare = (ride) => {
  const fare = ride?.totalFare ?? ride?.fare ?? ride?.estimatedFare

  if (fare === undefined || fare === null || fare === '') {
    return 'Not available'
  }

  const amount = Number(fare)

  return Number.isFinite(amount) ? `৳${amount.toLocaleString('en-BD')}` : 'Not available'
}

const getRideList = (rides) => (Array.isArray(rides) ? rides : [])

const RideHistory = () => {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRides = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await fetchMyRides()
      setRides(getRideList(result))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your ride history. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRides()
  }, [loadRides])

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      {' '}
      <header className="flex flex-wrap items-center justify-between gap-4">
        {' '}
        <div>
          {' '}
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Your journeys{' '}
          </p>
          ```
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Ride History</h1>
          <p className="mt-2 text-slate-500">Review your previous and ongoing rides.</p>
        </div>
        <button
          type="button"
          onClick={loadRides}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {loading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <RefreshCw className="mx-auto animate-spin text-indigo-600" size={30} />
          <p className="mt-3 font-medium text-slate-600">Loading your rides...</p>
        </section>
      )}
      {!loading && error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-bold text-red-800">Unable to load rides</h2>

          <p className="mt-2 text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={loadRides}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
          >
            Try again
          </button>
        </section>
      )}
      {!loading && !error && rides.length === 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <CarFront size={32} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">No rides yet</h2>

          <p className="mx-auto mt-2 max-w-md text-slate-500">
            Your ride requests and completed trips will appear here.
          </p>

          <Link
            to="/book"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"
          >
            Book your first ride
          </Link>
        </section>
      )}
      {!loading && !error && rides.length > 0 && (
        <section className="grid gap-4">
          {rides.map((ride, index) => {
            const id = ride._id || ride.id
            const status = getStatus(ride)

            const pickup = ride.pickup?.address || ride.pickupAddress || 'Pickup unavailable'

            const destination =
              ride.destination?.address || ride.destinationAddress || 'Destination unavailable'

            return (
              <article
                key={id || `ride-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CarFront size={25} />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        {ride.vehicleType
                          ? `${formatStatus(ride.vehicleType)} ride`
                          : 'Passenger ride'}
                      </h2>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <CalendarDays size={14} />
                        {formatDate(ride.createdAt || ride.requestedAt || ride.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-lg font-extrabold text-slate-900">{formatFare(ride)}</p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        statusStyles[status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 shrink-0 text-emerald-600" size={18} />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Pickup
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-slate-700">
                        {pickup}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 shrink-0 text-red-500" size={18} />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Destination
                      </p>

                      <p className="mt-1 break-words text-sm font-medium text-slate-700">
                        {destination}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={16} />

                    {ride.distanceKm != null
                      ? `${ride.distanceKm} km`
                      : ride.distance != null
                        ? `${ride.distance} km`
                        : 'Distance unavailable'}
                  </p>

                  {id && (
                    <Link
                      to={`/rides/${id}`}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      View ride details
                    </Link>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default RideHistory
