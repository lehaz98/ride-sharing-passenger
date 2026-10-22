import { Bike, CarFront, Check, Users } from 'lucide-react'
import { formatFare } from '../utils/formatCurrency'

const VEHICLE_OPTIONS = {
  car: {
    label: 'Car',
    description: 'Comfortable everyday travel',
    capacity: '4 seats',
    Icon: CarFront,
  },
  bike: {
    label: 'Bike',
    description: 'Quick rides through traffic',
    capacity: '1 passenger',
    Icon: Bike,
  },
  cng: {
    label: 'CNG',
    description: 'Affordable city travel',
    capacity: '3 seats',
    Icon: CarFront,
  },
}

const VehicleCard = ({ vehicle, selected = false, onSelect, disabled = false, className = '' }) => {
  const type =
    typeof vehicle === 'string'
      ? vehicle
      : vehicle?.type || vehicle?.vehicleType || vehicle?.name || 'car'

  const normalizedType = String(type).toLowerCase()
  const option = VEHICLE_OPTIONS[normalizedType] || {
    label: String(type),
    description: 'Choose this ride option',
    capacity: 'Capacity varies',
    Icon: CarFront,
  }

  const Icon = option.Icon

  const fare =
    typeof vehicle === 'object' && vehicle !== null
      ? (vehicle.fare ?? vehicle.estimatedFare ?? vehicle.price)
      : undefined

  const handleSelect = () => {
    if (!disabled && typeof onSelect === 'function') {
      onSelect(normalizedType)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition sm:gap-4 ${
        selected
          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-100'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
          selected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
        }`}
      >
        <Icon size={29} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">{option.label}</span>
          {selected && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <Check size={12} />
              Selected
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">{option.description}</p>

        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Users size={13} />
          {option.capacity}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {fare !== undefined && fare !== null && (
          <p className="font-extrabold text-slate-900">{formatFare(fare)}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">Estimate</p>
      </div>
    </button>
  )
}

export default VehicleCard
