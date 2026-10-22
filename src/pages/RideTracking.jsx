// ======================================================
// RIDE TRACKING   (route: /rides/:rideId)
//
// Shows one ride from "finding a driver" to "completed":
// status banner, progress steps, live map (with the driver
// marker), driver + vehicle, trip details, fare / payment,
// and cancel.
//
// Data sources
//   useRideTracking(rideId)          ride + status updates
//   useLiveDriverLocation(ride, ...) live driver position
// To change HOW updates arrive, edit those hooks. This page
// does not change.
// ======================================================

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CarFront,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  TriangleAlert,
  UserRound,
  Wallet,
} from 'lucide-react'

import LocationPickerMap from '../components/LocationPickerMap'
import { useRideTracking } from '../hooks/useRideTracking'
import useLiveDriverLocation from '../hooks/useLiveDriverLocation'
import { toMapPosition } from '../services/locationService'
import { cancelRide, getErrorMessage, getErrorStatus } from '../services/rideService'
import {
  CANCELLABLE_RIDE_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  RIDE_STATUS_META,
  TRACKING_STEPS,
  VEHICLE_LABELS,
} from '../constants/ride'
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatFare,
  shortId,
} from '../utils/formatters'

// ======================================================
// CONFIG
// ======================================================

const ROUTES = {
  login: '/login',
  book: '/book',
  history: '/history',
}

const STATUS_ICONS = {
  requested: LoaderCircle,
  driver_assigned: UserRound,
  driver_arriving: Navigation,
  ride_started: CarFront,
  ride_completed: CircleCheck,
  cancelled: CircleX,
}

// Full class names (so Tailwind can see them)
const STATUS_TONES = {
  amber: {
    banner: 'border-amber-200 bg-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    title: 'text-amber-900',
    description: 'text-amber-800',
  },
  blue: {
    banner: 'border-sky-200 bg-sky-50',
    icon: 'bg-sky-100 text-sky-700',
    title: 'text-sky-900',
    description: 'text-sky-800',
  },
  emerald: {
    banner: 'border-emerald-200 bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-900',
    description: 'text-emerald-800',
  },
  red: {
    banner: 'border-red-200 bg-red-50',
    icon: 'bg-red-100 text-red-700',
    title: 'text-red-900',
    description: 'text-red-800',
  },
  slate: {
    banner: 'border-slate-200 bg-slate-50',
    icon: 'bg-slate-100 text-slate-700',
    title: 'text-slate-900',
    description: 'text-slate-700',
  },
}

const PAYMENT_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-sky-50 text-sky-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-slate-100 text-slate-600',
}

// ======================================================
// HELPERS
// ======================================================

const getRideStatus = (ride) => ride?.rideStatus || ride?.status || ''

const getRideFare = (ride) =>
  ride?.totalFare ?? ride?.fare ?? ride?.estimatedFare ?? ride?.fareEstimate

// ======================================================
// SMALL COMPONENTS
// ======================================================

const Card = ({ title, icon: Icon, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    {title && (
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon size={19} className="text-emerald-600" />}
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
    )}

    {children}
  </section>
)

const MessageCard = ({ icon: Icon, title, text, children }) => (
  <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <Icon size={28} />
    </div>

    <h2 className="mt-5 text-xl font-extrabold text-slate-900">{title}</h2>

    {text && <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>}

    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
  </section>
)

const StatusBanner = ({ status, cancellationReason }) => {
  const meta = RIDE_STATUS_META[status] || {
    title: status || 'Ride status unavailable',
    description: 'Your ride information is being updated.',
    tone: 'slate',
  }

  const tone = STATUS_TONES[meta.tone] || STATUS_TONES.slate
  const Icon = STATUS_ICONS[status] || Clock3

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-5 ${tone.banner}`}>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
      >
        <Icon size={24} className={status === 'requested' ? 'animate-spin' : ''} />
      </div>

      <div className="min-w-0">
        <h2 className={`text-lg font-extrabold ${tone.title}`}>{meta.title}</h2>

        <p className={`mt-1 text-sm leading-6 ${tone.description}`}>
          {status === 'cancelled' && cancellationReason ? cancellationReason : meta.description}
        </p>
      </div>
    </div>
  )
}

const Stepper = ({ status }) => {
  const currentIndex = TRACKING_STEPS.findIndex((step) => step.status === status)
  const isCompleted = status === 'ride_completed'

  return (
    <ol className="flex items-start">
      {TRACKING_STEPS.map((step, index) => {
        const done = isCompleted || (currentIndex >= 0 && index < currentIndex)
        const current = index === currentIndex && !isCompleted

        return (
          <li
            key={step.status}
            className="relative flex min-w-0 flex-1 flex-col items-center text-center"
          >
            {index > 0 && (
              <span
                className={`absolute left-[-50%] top-3.5 h-0.5 w-full ${
                  done || current ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-emerald-500 text-white'
                  : current
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <CircleCheck size={16} /> : index + 1}
            </span>

            <span
              className={`mt-2 px-1 text-[10px] font-semibold leading-4 sm:text-xs ${
                done || current ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const DriverCard = ({ driver, vehicle }) => {
  const vehicleName = [vehicle?.brand, vehicle?.model].filter(Boolean).join(' ')
  const vehicleType = vehicle?.vehicleType

  return (
    <Card title="Your driver" icon={UserRound}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500">
          {driver?.avatar ? (
            <img
              src={driver.avatar}
              alt={driver.name || 'Driver'}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound size={26} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{driver?.name || 'Driver'}</p>
          {driver?.phone && <p className="mt-1 text-sm text-slate-500">{driver.phone}</p>}
        </div>

        {driver?.phone && (
          <a
            href={`tel:${driver.phone}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 sm:px-4"
          >
            <Phone size={16} />
            <span>Call</span>
          </a>
        )}
      </div>

      {vehicle && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <CarFront size={22} className="shrink-0 text-slate-500" />

          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold text-slate-900">
              {vehicleName || VEHICLE_LABELS[vehicleType] || 'Vehicle'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {[VEHICLE_LABELS[vehicleType], vehicle.registrationNumber || vehicle.plateNumber]
                .filter(Boolean)
                .join(' · ') || 'Vehicle details unavailable'}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

const TripCard = ({ ride }) => (
  <Card title="Trip details" icon={MapPin}>
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <MapPin size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500">Pickup location</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {ride.pickup?.address || 'Pickup address unavailable'}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Navigation size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500">Destination</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {ride.destination?.address || 'Destination unavailable'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <div className="min-w-0">
          <CarFront size={18} className="mx-auto text-slate-400" />
          <p className="mt-1 text-xs text-slate-500">Vehicle</p>
          <p className="mt-1 break-words text-xs font-bold text-slate-900 sm:text-sm">
            {VEHICLE_LABELS[ride.vehicleType] || ride.vehicleType || '—'}
          </p>
        </div>

        <div className="min-w-0">
          <Navigation size={18} className="mx-auto text-slate-400" />
          <p className="mt-1 text-xs text-slate-500">Distance</p>
          <p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm">
            {formatDistance(ride.distance)}
          </p>
        </div>

        <div className="min-w-0">
          <Clock3 size={18} className="mx-auto text-slate-400" />
          <p className="mt-1 text-xs text-slate-500">Duration</p>
          <p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm">
            {formatDuration(ride.duration)}
          </p>
        </div>
      </div>
    </div>
  </Card>
)

const PaymentCard = ({ ride }) => {
  const status = getRideStatus(ride)
  const paymentStatus = ride.paymentStatus || ride.payment?.status || 'pending'
  const paymentMethod = ride.paymentMethod || ride.payment?.method
  const isCash = paymentMethod === 'cash'

  const showCashHint = isCash && paymentStatus !== 'paid' && status !== 'cancelled'

  return (
    <Card title="Fare & payment" icon={Wallet}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {status === 'ride_completed' ? 'Total fare' : 'Estimated fare'}
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {formatFare(getRideFare(ride))}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            PAYMENT_STYLES[paymentStatus] || PAYMENT_STYLES.pending
          }`}
        >
          {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        Payment method:{' '}
        <span className="font-semibold text-slate-800">
          {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod || 'Not specified'}
        </span>
      </p>

      {showCashHint && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Please pay the driver in cash at the end of your trip.
        </p>
      )}
    </Card>
  )
}

// ======================================================
// PAGE
// ======================================================

const RideTracking = () => {
  const { rideId } = useParams()
  const navigate = useNavigate()

  const {
    ride,
    setRide,
    isLoading,
    isError,
    error,
    errorStatus,
    isStale,
    isActive,
    refresh,
    reload,
  } = useRideTracking(rideId)

  // Live driver position  ->  { latitude, longitude } | null
  const driverLocation = useLiveDriverLocation(ride, isActive)

  const [cancelling, setCancelling] = useState(false)

  // not logged in -> login
  useEffect(() => {
    if (errorStatus === 401) {
      navigate(ROUTES.login, { replace: true })
    }
  }, [errorStatus, navigate])

  // Fit the map to the whole trip once per ride, and once more
  // when the driver's location first arrives so the driver is in view
  const rideKey = ride?._id
  const hasDriverLocation = Boolean(driverLocation)

  const focusRequest = useMemo(
    () =>
      rideKey ? { id: `${rideKey}:${hasDriverLocation ? 'driver' : 'trip'}`, type: 'fit' } : null,
    [rideKey, hasDriverLocation]
  )

  const status = getRideStatus(ride)

  // ----------------------------------------------------
  // CANCEL
  // ----------------------------------------------------

  const handleCancel = async () => {
    if (cancelling || !ride?._id) return

    if (!CANCELLABLE_RIDE_STATUSES.includes(status)) {
      toast.error('This ride can no longer be cancelled.')
      return
    }

    const question =
      status === 'requested'
        ? 'Cancel this ride request?'
        : 'A driver has already accepted this ride. Cancel it anyway?'

    if (!window.confirm(question)) return

    setCancelling(true)

    try {
      const { ride: updatedRide, message } = await cancelRide(ride._id)

      setRide(updatedRide)
      toast.success(message || 'Ride cancelled.')
    } catch (cancelError) {
      // 401 = session expired. (403 means "not allowed", the user IS logged in)
      if (getErrorStatus(cancelError) === 401) {
        navigate(ROUTES.login, { replace: true })
        return
      }

      toast.error(getErrorMessage(cancelError, 'Could not cancel the ride.'))

      // the status may have changed (e.g. the ride already started)
      refresh()
    } finally {
      setCancelling(false)
    }
  }

  // ----------------------------------------------------
  // LOADING / ERROR
  // ----------------------------------------------------

  if (isLoading && !ride) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4">
        <div className="text-center">
          <LoaderCircle size={42} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading your ride...</p>
        </div>
      </div>
    )
  }

  if (isError && !ride) {
    const notFound = errorStatus === 404 || errorStatus === 400
    const forbidden = errorStatus === 403

    return (
      <div className="py-10">
        <MessageCard
          icon={TriangleAlert}
          title={notFound ? 'Ride not found' : forbidden ? 'Access denied' : 'Something went wrong'}
          text={
            notFound
              ? 'This ride does not exist or the link is incorrect.'
              : forbidden
                ? 'You cannot view a ride belonging to another account.'
                : error || 'We could not load your ride. Please try again.'
          }
        >
          {!notFound && !forbidden && (
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          )}

          <Link
            to={ROUTES.history}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Ride history
          </Link>
        </MessageCard>
      </div>
    )
  }

  if (!ride) return null

  // ----------------------------------------------------
  // READY
  // ----------------------------------------------------

  const pickupPosition = toMapPosition(ride.pickup)
  const destinationPosition = toMapPosition(ride.destination)

  const driver = ride.driver && typeof ride.driver === 'object' ? ride.driver : null
  const vehicle = ride.vehicle && typeof ride.vehicle === 'object' ? ride.vehicle : null

  const canCancel = CANCELLABLE_RIDE_STATUSES.includes(status)
  const isCancelled = status === 'cancelled'
  const isFinished = !isActive

  // a background refresh failed, but we still have the last known ride
  const hasConnectionProblem = isStale || isError

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* HEADER */}

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
            RideGo · Passenger
          </p>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Your ride
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ride #{shortId(ride._id)} · Requested{' '}
            {formatDateTime(ride.requestedAt || ride.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasConnectionProblem ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700">
              <TriangleAlert size={15} />
              Connection problem. Retrying...
            </span>
          ) : (
            isActive && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Updating automatically
              </span>
            )
          )}

          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      {/* STATUS */}

      <section className="space-y-4">
        <StatusBanner status={status} cancellationReason={ride.cancellationReason} />

        {!isCancelled && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white px-3 py-5 sm:px-6">
            <div className="min-w-[300px]">
              <Stepper status={status} />
            </div>
          </div>
        )}
      </section>

      {/* MAP + DETAILS */}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Trip route</h2>

            <span className="text-xs text-slate-500">
              {hasDriverLocation
                ? 'Driver location is live'
                : isActive
                  ? 'Live ride status'
                  : 'Ride overview'}
            </span>
          </div>

          <LocationPickerMap
            pickup={pickupPosition}
            destination={destinationPosition}
            driverLocation={isActive ? driverLocation : null}
            driverLabel={driver?.name || 'Your driver'}
            focusRequest={focusRequest}
            center={
              pickupPosition ? [pickupPosition.latitude, pickupPosition.longitude] : undefined
            }
            zoom={14}
            height={420}
            disabled
          />
        </section>

        <div className="min-w-0 space-y-5">
          {driver && <DriverCard driver={driver} vehicle={vehicle} />}

          {status === 'requested' && !driver && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <LoaderCircle size={21} className="mt-0.5 animate-spin text-amber-700" />

                <div>
                  <p className="font-bold text-amber-900">Finding your driver</p>
                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    Your ride details will update when a driver is assigned.
                  </p>
                </div>
              </div>
            </div>
          )}

          <TripCard ride={ride} />

          <PaymentCard ride={ride} />

          {/* ACTIONS */}

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <CircleX size={18} />
                  Cancel ride
                </>
              )}
            </button>
          )}

          {isFinished && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.book}
                className="flex-1 rounded-2xl bg-emerald-600 px-5 py-4 text-center text-sm font-extrabold text-white transition hover:bg-emerald-700"
              >
                Book another ride
              </Link>

              <Link
                to={ROUTES.history}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
              >
                Ride history
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RideTracking
