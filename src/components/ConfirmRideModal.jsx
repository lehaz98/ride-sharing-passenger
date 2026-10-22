import { AlertCircle, CarFront, MapPin, Navigation, X } from 'lucide-react'
import { formatFare } from '../utils/formatCurrency'

const ConfirmRideModal = ({
  open = false,
  pickup,
  destination,
  vehicleType = 'car',
  fare,
  paymentMethod = 'cash',
  loading = false,
  error = '',
  onConfirm,
  onClose,
}) => {
  if (!open) {
    return null
  }

  const pickupAddress =
    typeof pickup === 'string' ? pickup : pickup?.address || 'Pickup location not selected'

  const destinationAddress =
    typeof destination === 'string'
      ? destination
      : destination?.address || 'Destination not selected'

  const readableVehicle = String(vehicleType || 'car')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

  const readablePayment =
    String(paymentMethod).toLowerCase() === 'stripe'
      ? 'Card'
      : String(paymentMethod)
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase())

  const hasFare =
    fare !== null &&
    fare !== undefined &&
    fare !== '' &&
    Number.isFinite(Number(fare)) &&
    Number(fare) >= 0

  const handleConfirm = () => {
    if (!loading && typeof onConfirm === 'function') {
      onConfirm()
    }
  }

  const handleClose = () => {
    if (!loading && typeof onClose === 'function') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-ride-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-ride-title" className="text-xl font-extrabold text-slate-900">
              Confirm your ride
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Check your trip details before requesting.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close confirmation"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <div className="flex gap-3">
            <MapPin size={19} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Pickup</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {pickupAddress}
              </p>
            </div>
          </div>

          <div className="ml-2 my-3 h-5 border-l-2 border-dashed border-slate-300" />

          <div className="flex gap-3">
            <Navigation size={19} className="mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Destination</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {destinationAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
            <CarFront size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">{readableVehicle}</p>
            <p className="mt-1 text-sm text-slate-500">Payment: {readablePayment}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Estimated fare</p>
            <p className="mt-1 font-extrabold text-emerald-700">
              {hasFare ? formatFare(Number(fare)) : '—'}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go back
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Requesting ride…' : 'Confirm and request'}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          Your ride request will be sent to available drivers.
        </p>
      </section>
    </div>
  )
}

export default ConfirmRideModal
