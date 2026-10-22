import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CarFront,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  ReceiptText,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { formatFare } from '../utils/formatCurrency'
import { RIDE_STATUS_META } from '../utils/constants'

const RideDetails = () => {
  const { rideId } = useParams()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadRide = async () => {
      if (!rideId) {
        setError('Ride ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/rides/${rideId}`)
        const result =
          response.data?.ride || response.data?.data?.ride || response.data?.data || response.data

        if (!cancelled) setRide(result)
      } catch (requestError) {
        if (!cancelled) {
          const message = requestError.response?.data?.message || 'Could not load ride details.'

          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRide()

    return () => {
      cancelled = true
    }
  }, [rideId])

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle size={25} className="animate-spin text-emerald-600" />
        Loading ride details...
      </div>
    )
  }

  if (error || !ride) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <CarFront size={38} className="mx-auto text-slate-400" />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Ride details unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'No ride information was found.'}</p>
          <Link
            to="/history"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <ArrowLeft size={17} />
            Back to ride history
          </Link>
        </section>
      </main>
    )
  }

  const status = ride.status || 'requested'
  const statusInfo = RIDE_STATUS_META[status]
  const pickupAddress = ride.pickup?.address || ride.pickupAddress || 'Pickup unavailable'
  const destinationAddress =
    ride.destination?.address || ride.destinationAddress || 'Destination unavailable'
  const vehicleType = ride.vehicleType || ride.vehicle?.type || ride.vehicle?.vehicleType || 'car'
  const fare = ride.fare ?? ride.estimatedFare ?? ride.totalFare
  const paymentMethod = ride.paymentMethod || ride.payment?.method || 'Unknown'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <Link
        to="/history"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft size={17} />
        Back to ride history
      </Link>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CarFront size={25} />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ride Details</h1>
          <p className="mt-1 break-all text-xs text-slate-500">
            Ride ID: {ride._id || ride.id || rideId}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">Current status</h2>

          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold capitalize text-emerald-700">
            {statusInfo?.title || status.replaceAll('_', ' ')}
          </span>
        </div>

        {statusInfo?.description && (
          <p className="mt-2 text-sm text-slate-500">{statusInfo.description}</p>
        )}

        <div className="my-6 border-t border-slate-100" />

        <div className="space-y-5">
          <div className="flex gap-3">
            <MapPin size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs font-medium text-slate-500">Pickup</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {pickupAddress}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Navigation size={19} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-medium text-slate-500">Destination</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {destinationAddress}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="font-bold text-slate-900">Trip summary</h2>

        <dl className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="flex items-center gap-2 text-slate-500">
              <CarFront size={17} />
              Vehicle
            </dt>
            <dd className="font-semibold capitalize text-slate-800">
              {String(vehicleType).replaceAll('_', ' ')}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="flex items-center gap-2 text-slate-500">
              <ReceiptText size={17} />
              Payment method
            </dt>
            <dd className="font-semibold capitalize text-slate-800">
              {String(paymentMethod).replaceAll('_', ' ')}
            </dd>
          </div>

          {ride.createdAt && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="flex items-center gap-2 text-slate-500">
                <Clock3 size={17} />
                Requested
              </dt>
              <dd className="text-right font-medium text-slate-800">
                {new Date(ride.createdAt).toLocaleString()}
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <dt className="font-semibold text-slate-700">Fare</dt>
            <dd className="text-xl font-extrabold text-emerald-700">
              {fare !== undefined && fare !== null ? formatFare(fare) : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/rides/${rideId}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open ride tracking
        </Link>

        <Link
          to={`/payment?rideId=${encodeURIComponent(rideId)}`}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          View payment
        </Link>
      </div>
    </main>
  )
}

export default RideDetails
