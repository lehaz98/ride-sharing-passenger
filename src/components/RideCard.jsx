import { ArrowRight, CarFront, Clock3, MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatFare } from '../utils/formatCurrency'
import { RIDE_STATUS_META } from '../utils/constants'

const RideCard = ({ ride, onClick, className = '' }) => {
  if (!ride) return null

  const rideId = ride._id || ride.id || ride.rideId
  const status = ride.status || 'requested'
  const statusInfo = RIDE_STATUS_META[status] || {
    title: status.replaceAll('_', ' '),
    description: 'Check your ride details for more information.',
    tone: 'slate',
  }

  const toneClasses = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  const pickupAddress = ride.pickup?.address || ride.pickupAddress || 'Pickup location'
  const destinationAddress =
    ride.destination?.address || ride.destinationAddress || 'Destination location'

  const vehicleType = ride.vehicleType || ride.vehicle?.type || ride.vehicle?.vehicleType || 'car'

  const fare = ride.fare ?? ride.estimatedFare ?? ride.totalFare
  const createdAt = ride.createdAt || ride.requestedAt

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString('en-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Date unavailable'

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick(ride)
    }
  }

  const content = (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CarFront size={23} />
          </div>

          <div className="min-w-0">
            <p className="font-bold capitalize text-slate-900">
              {String(vehicleType).replaceAll('_', ' ')} ride
            </p>
            <p className="mt-1 text-xs text-slate-500">{formattedDate}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 ${
            toneClasses[statusInfo.tone] || toneClasses.slate
          }`}
        >
          {statusInfo.title}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Pickup</p>
            <p className="mt-1 break-words text-sm font-medium text-slate-800">{pickupAddress}</p>
          </div>
        </div>

        <div className="ml-2 h-4 border-l-2 border-dashed border-slate-200" />

        <div className="flex gap-3">
          <Navigation size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Destination</p>
            <p className="mt-1 break-words text-sm font-medium text-slate-800">
              {destinationAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs text-slate-500">Fare</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">
            {fare !== undefined && fare !== null ? formatFare(fare) : '—'}
          </p>
        </div>

        {status === 'ride_completed' && (
          <span className="flex items-center gap-1 text-xs text-emerald-700">
            <Clock3 size={14} />
            Completed
          </span>
        )}

        {rideId && (
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
            Details <ArrowRight size={16} />
          </span>
        )}
      </div>
    </div>
  )

  const cardClassName = `w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md ${className}`

  if (typeof onClick === 'function') {
    return (
      <button type="button" onClick={handleClick} className={`${cardClassName} block`}>
        {content}
      </button>
    )
  }

  if (rideId) {
    return (
      <Link to={`/rides/${rideId}`} className={`${cardClassName} block`}>
        {content}
      </Link>
    )
  }

  return <article className={cardClassName}>{content}</article>
}

export default RideCard
