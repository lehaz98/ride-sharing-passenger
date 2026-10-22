import { Calculator, Info } from 'lucide-react'
import { formatFare } from '../utils/formatCurrency'

const FareSummary = ({
  fare,
  distance,
  duration,
  vehicleType,
  paymentMethod = 'cash',
  loading = false,
  className = '',
}) => {
  const numericFare = Number(fare)
  const hasFare =
    fare !== null &&
    fare !== undefined &&
    fare !== '' &&
    Number.isFinite(numericFare) &&
    numericFare >= 0

  const formatDistance = (value) => {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const number = Number(value)

    if (!Number.isFinite(number) || number < 0) {
      return null
    }

    return `${number.toFixed(1)} km`
  }

  const formatDuration = (value) => {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const number = Number(value)

    if (!Number.isFinite(number) || number < 0) {
      return null
    }

    return `${Math.round(number)} min`
  }

  const readableVehicle = vehicleType
    ? String(vehicleType)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null

  const readablePayment = paymentMethod
    ? String(paymentMethod).toLowerCase() === 'stripe'
      ? 'Card'
      : String(paymentMethod).replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}
      aria-label="Fare summary"
    >
      <div className="flex items-center gap-2">
        <Calculator size={19} className="text-emerald-600" />
        <h2 className="font-bold text-slate-900">Fare Summary</h2>
      </div>

      <div className="mt-5 space-y-3">
        {readableVehicle && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-500">Vehicle</span>
            <span className="font-medium text-slate-800">{readableVehicle}</span>
          </div>
        )}

        {formatDistance(distance) && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-500">Distance</span>
            <span className="font-medium text-slate-800">{formatDistance(distance)}</span>
          </div>
        )}

        {formatDuration(duration) && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-500">Estimated time</span>
            <span className="font-medium text-slate-800">{formatDuration(duration)}</span>
          </div>
        )}

        {readablePayment && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-500">Payment method</span>
            <span className="font-medium text-slate-800">{readablePayment}</span>
          </div>
        )}
      </div>

      <div className="my-4 border-t border-dashed border-slate-200" />

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Estimated fare</p>
          <p className="mt-1 text-xs text-slate-500">Final fare is determined by the server.</p>
        </div>

        <p className="shrink-0 text-2xl font-extrabold text-emerald-700">
          {loading ? 'Calculating…' : hasFare ? formatFare(numericFare) : '—'}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-xs leading-5 text-slate-600">
          This amount is an estimate. Your final fare may vary depending on the ride details and the
          server's fare calculation.
        </p>
      </div>
    </section>
  )
}

export default FareSummary
