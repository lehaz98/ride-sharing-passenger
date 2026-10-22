// ======================================================
// BOOK RIDE
//
// Flow
//   1. Choose pickup + destination  (search, map click, drag pin, GPS)
//   2. Server calculates route + fare for every vehicle
//   3. Choose vehicle + payment, review the summary
//   4. Request the ride
//
// This page only orchestrates. The work is done by:
//   services/locationService.js   search / reverse geocode / GPS
//   services/rideService.js       fare estimate + create ride API
//   components/LocationPickerMap.jsx
//   components/LocationSearchInput.jsx
//
// Optional .env
//   VITE_ENABLED_PAYMENT_METHODS=cash,bkash   (default: cash)
// ======================================================

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MapPin,
  Navigation,
  CarFront,
  Bike,
  LocateFixed,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  MapPinned,
  X,
  Route as RouteIcon,
  TriangleAlert,
  RefreshCw,
} from 'lucide-react'

import LocationPickerMap from '../components/LocationPickerMap'
import LocationSearchInput from '../components/LocationSearchInput'

import {
  distanceInMeters,
  fallbackAddress,
  formatCoordinates,
  getCurrentPosition,
  describeLocationError,
  isAbortError,
  reverseGeocode,
  toMapPosition,
} from '../services/locationService'

import {
  fetchRideEstimate,
  getErrorMessage,
  getErrorStatus,
  requestRide,
} from '../services/rideService'

import { formatDistance, formatDuration, formatFare } from '../utils/formatters'

// ======================================================
// CONFIG  (change things here, nowhere else)
// ======================================================

const ROUTES = {
  login: '/login',
  history: '/history',
  rideDetails: (rideId) => `/rides/${rideId}`,
}

// Pickup and destination closer than this are treated as the same place
const MIN_TRIP_DISTANCE_METERS = 50

// Wait a little after the last pin move before asking for a fare
const ESTIMATE_DEBOUNCE_MS = 400

// Vehicle metadata. Prices come from the server.
const VEHICLES = [
  { value: 'car', label: 'Car', description: 'Comfortable', icon: CarFront },
  { value: 'bike', label: 'Bike', description: 'Quick & cheap', icon: Bike },
  { value: 'cng', label: 'CNG', description: 'Everyday', icon: Navigation },
]

// Only methods listed in VITE_ENABLED_PAYMENT_METHODS can be chosen.
// Online methods need a payment gateway, so they stay "Soon" until enabled.
const ENABLED_PAYMENT_METHODS = new Set(
  (import.meta.env.VITE_ENABLED_PAYMENT_METHODS || 'cash')
    .split(',')
    .map((method) => method.trim().toLowerCase())
    .filter(Boolean)
)

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'stripe', label: 'Stripe' },
].map((method) => ({ ...method, enabled: ENABLED_PAYMENT_METHODS.has(method.value) }))

const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS.find((method) => method.enabled)?.value ?? 'cash'

const LOCATION_TYPES = {
  pickup: {
    title: 'Pickup',
    placeholder: 'Search pickup or tap the map',
    icon: MapPin,
    iconBox: 'bg-emerald-50 text-emerald-600',
    activeRing: 'border-emerald-400 ring-4 ring-emerald-500/10',
    chip: 'bg-emerald-50 text-emerald-800',
  },
  destination: {
    title: 'Destination',
    placeholder: 'Where do you want to go?',
    icon: Navigation,
    iconBox: 'bg-orange-50 text-orange-600',
    activeRing: 'border-orange-400 ring-4 ring-orange-500/10',
    chip: 'bg-orange-50 text-orange-800',
  },
}

const EMPTY_LOCATION = { address: '', latitude: null, longitude: null }
const IDLE_ESTIMATE = { status: 'idle', route: null, fares: null, error: '' }

// ======================================================
// SMALL COMPONENTS
// ======================================================

const SummaryRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-semibold text-slate-900">{value}</span>
  </div>
)

// ------------------------------------------------------
// One location (pickup or destination): search + coordinates
// ------------------------------------------------------

const LocationBlock = ({
  type,
  location,
  resolving,
  active,
  locating,
  disabled,
  onActivate,
  onAddressChange,
  onSelectPlace,
  onClear,
  onUseCurrentLocation,
}) => {
  const config = LOCATION_TYPES[type]
  const Icon = config.icon
  const position = toMapPosition(location)
  const hasValue = Boolean(location.address) || Boolean(position)

  return (
    <div
      onClick={onActivate}
      className={`rounded-2xl border p-4 transition ${
        active ? config.activeRing : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.iconBox}`}>
            <Icon size={18} />
          </div>

          <h3 className="text-sm font-bold text-slate-900">{config.title}</h3>
        </div>

        <div className="flex items-center gap-1">
          {type === 'pickup' && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onUseCurrentLocation()
              }}
              disabled={locating || disabled}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
            >
              {locating ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <LocateFixed size={14} />
              )}
              My location
            </button>
          )}

          {hasValue && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onClear()
              }}
              disabled={disabled}
              aria-label={`Clear ${config.title.toLowerCase()}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <LocationSearchInput
        id={`${type}-address`}
        ariaLabel={`${config.title} address`}
        value={location.address}
        loading={resolving}
        disabled={disabled}
        placeholder={resolving ? 'Finding address...' : config.placeholder}
        onChange={onAddressChange}
        onSelectPlace={onSelectPlace}
        onFocus={onActivate}
      />

      <p
        className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-xs font-medium ${
          position ? config.chip : 'bg-slate-100 text-slate-500'
        }`}
      >
        {position ? `📍 ${formatCoordinates(position)}` : 'Search above or tap the map'}
      </p>
    </div>
  )
}

// ------------------------------------------------------
// Vehicle option with live fare
// ------------------------------------------------------

const VehicleOption = ({ vehicle, selected, fareText, onSelect }) => {
  const Icon = vehicle.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
        selected
          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon size={22} />
      </div>

      <p className="text-sm font-bold text-slate-900">{vehicle.label}</p>
      <p className="text-[11px] leading-4 text-slate-500">{vehicle.description}</p>
      <p className={`text-sm font-extrabold ${selected ? 'text-emerald-700' : 'text-slate-700'}`}>
        {fareText}
      </p>
    </button>
  )
}

// ======================================================
// PAGE
// ======================================================

const BookRide = () => {
  const navigate = useNavigate()

  // ---------- form ----------
  const [pickup, setPickup] = useState(EMPTY_LOCATION)
  const [destination, setDestination] = useState(EMPTY_LOCATION)
  const [selectionMode, setSelectionMode] = useState('pickup')
  const [vehicleType, setVehicleType] = useState(VEHICLES[0].value)
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD)

  // ---------- async state ----------
  const [resolving, setResolving] = useState({ pickup: false, destination: false })
  const [locating, setLocating] = useState(false)
  const [estimate, setEstimate] = useState(IDLE_ESTIMATE)
  const [estimateNonce, setEstimateNonce] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [createdRide, setCreatedRide] = useState(null)

  // ---------- map camera ----------
  const [focusRequest, setFocusRequest] = useState(null)

  // ---------- refs ----------
  const reverseRef = useRef({
    pickup: { id: 0, controller: null },
    destination: { id: 0, controller: null },
  })
  const focusCounterRef = useRef(0)
  const submittingRef = useRef(false)

  const pickupPosition = toMapPosition(pickup)
  const destinationPosition = toMapPosition(destination)

  const tripTooClose =
    Boolean(pickupPosition) &&
    Boolean(destinationPosition) &&
    distanceInMeters(pickupPosition, destinationPosition) < MIN_TRIP_DISTANCE_METERS

  // ====================================================
  // LOCATION STATE HELPERS
  // ====================================================

  const setLocation = (type, updater) => {
    const setter = type === 'pickup' ? setPickup : setDestination

    setter(updater)
  }

  const requestFocus = (focus) => {
    focusCounterRef.current += 1

    setFocusRequest({ id: focusCounterRef.current, ...focus })
  }

  // Stop any address lookup that is still running for this point
  const cancelReverse = (type) => {
    const entry = reverseRef.current[type]

    entry.id += 1
    entry.controller?.abort()
    entry.controller = null

    setResolving((current) => ({ ...current, [type]: false }))
  }

  // Coordinates -> address. Never leaves the address empty.
  const resolveAddress = async (type, latitude, longitude) => {
    const entry = reverseRef.current[type]

    entry.controller?.abort()

    const controller = new AbortController()

    entry.controller = controller
    entry.id += 1

    const requestId = entry.id

    setResolving((current) => ({ ...current, [type]: true }))

    let address = fallbackAddress(latitude, longitude)

    try {
      const place = await reverseGeocode(latitude, longitude, { signal: controller.signal })

      if (place?.address) address = place.address
    } catch (error) {
      if (isAbortError(error)) return
      // any other error: keep the fallback address
    }

    // a newer request (or a clear) took over, ignore this result
    if (requestId !== entry.id) return

    // do not overwrite text the user typed in the meantime
    setLocation(type, (current) => (current.address ? current : { ...current, address }))
    setResolving((current) => ({ ...current, [type]: false }))
  }

  // Single entry point for every way of choosing a location
  // source: 'map' | 'search' | 'gps'
  const applyLocation = (type, { latitude, longitude, address }, source) => {
    const hasAddress = typeof address === 'string' && address.trim().length > 0

    setLocation(type, () => ({
      address: hasAddress ? address : '',
      latitude,
      longitude,
    }))

    if (hasAddress) {
      cancelReverse(type)
    } else {
      resolveAddress(type, latitude, longitude)
    }

    const otherPosition = type === 'pickup' ? destinationPosition : pickupPosition

    if (otherPosition) {
      requestFocus({ type: 'fit' })
    } else if (source !== 'map') {
      requestFocus({ type: 'point', latitude, longitude })
    }

    // first pick: move on to the destination automatically
    if (type === 'pickup' && !pickupPosition && !destinationPosition) {
      setSelectionMode('destination')
    }
  }

  // ====================================================
  // EVENT HANDLERS
  // ====================================================

  const handleMapSelect = (type, coordinates) => {
    applyLocation(
      type,
      { latitude: Number(coordinates.latitude), longitude: Number(coordinates.longitude) },
      'map'
    )
  }

  const handlePlaceSelect = (type, place) => {
    applyLocation(
      type,
      { latitude: place.latitude, longitude: place.longitude, address: place.address },
      'search'
    )
  }

  const handleAddressChange = (type, address) => {
    // the user is typing, so stop filling the address automatically
    if (reverseRef.current[type].controller) cancelReverse(type)

    setLocation(type, (current) => ({ ...current, address }))
  }

  const handleClear = (type) => {
    cancelReverse(type)
    setLocation(type, () => EMPTY_LOCATION)
    setSelectionMode(type)
  }

  const handleUseCurrentLocation = async () => {
    if (locating) return

    setLocating(true)

    try {
      const position = await getCurrentPosition()

      applyLocation('pickup', { latitude: position.latitude, longitude: position.longitude }, 'gps')

      toast.success('Pickup set to your current location.')
    } catch (error) {
      toast.error(describeLocationError(error))
    } finally {
      setLocating(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (submittingRef.current) return

    if (!pickupPosition) {
      toast.error('Select your pickup location.')
      setSelectionMode('pickup')
      return
    }

    if (!destinationPosition) {
      toast.error('Select your destination.')
      setSelectionMode('destination')
      return
    }

    if (pickup.address.trim().length < 2) {
      toast.error('Please enter a pickup address.')
      document.getElementById('pickup-address')?.focus()
      return
    }

    if (destination.address.trim().length < 2) {
      toast.error('Please enter a destination address.')
      document.getElementById('destination-address')?.focus()
      return
    }

    if (tripTooClose) {
      toast.error('Pickup and destination are too close. Please choose different points.')
      return
    }

    const selectedMethod = PAYMENT_METHODS.find((method) => method.value === paymentMethod)

    if (!selectedMethod?.enabled) {
      toast.error('Please choose an available payment method.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setCreatedRide(null)

    try {
      const { ride, message } = await requestRide({
        pickup,
        destination,
        vehicleType,
        paymentMethod,
      })

      setCreatedRide(ride)
      toast.success(message || 'Ride requested successfully.')
    } catch (error) {
      const activeRideId = error?.response?.data?.rideId

      if (getErrorStatus(error) === 401) {
        toast.error('Your session may have expired. Please log in again.')
        navigate(ROUTES.login)
      } else if (getErrorStatus(error) === 409 && activeRideId) {
        toast.error(getErrorMessage(error, 'You already have an active ride.'))
        navigate(ROUTES.rideDetails(activeRideId))
      } else {
        toast.error(getErrorMessage(error, 'Something went wrong while requesting your ride.'))
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    cancelReverse('pickup')
    cancelReverse('destination')

    setCreatedRide(null)
    setPickup(EMPTY_LOCATION)
    setDestination(EMPTY_LOCATION)
    setSelectionMode('pickup')
    setVehicleType(VEHICLES[0].value)
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setEstimate(IDLE_ESTIMATE)
    setFocusRequest(null)
  }

  // ====================================================
  // FARE ESTIMATE  (re-runs whenever a pin moves)
  // ====================================================

  useEffect(() => {
    const from = toMapPosition({ latitude: pickup.latitude, longitude: pickup.longitude })
    const to = toMapPosition({ latitude: destination.latitude, longitude: destination.longitude })

    if (!from || !to || distanceInMeters(from, to) < MIN_TRIP_DISTANCE_METERS) {
      setEstimate(IDLE_ESTIMATE)
      return undefined
    }

    const controller = new AbortController()

    setEstimate({ ...IDLE_ESTIMATE, status: 'loading' })

    const timer = setTimeout(async () => {
      try {
        const { route, fares } = await fetchRideEstimate(
          { pickup: from, destination: to },
          { signal: controller.signal }
        )

        setEstimate({ status: 'success', route, fares, error: '' })
      } catch (error) {
        if (isAbortError(error)) return

        setEstimate({
          status: 'error',
          route: null,
          fares: null,
          error: getErrorMessage(error, 'Could not calculate the fare.'),
        })
      }
    }, ESTIMATE_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [
    pickup.latitude,
    pickup.longitude,
    destination.latitude,
    destination.longitude,
    estimateNonce,
  ])

  // ====================================================
  // CLEANUP
  // ====================================================

  useEffect(() => {
    const reverseEntries = reverseRef.current

    return () => {
      Object.values(reverseEntries).forEach((entry) => entry.controller?.abort())
    }
  }, [])

  // ====================================================
  // DERIVED VALUES
  // ====================================================

  const selectedFare = estimate.fares?.[vehicleType]?.totalFare ?? null
  const selectedPayment = PAYMENT_METHODS.find((method) => method.value === paymentMethod)

  const isResolvingAddress = resolving.pickup || resolving.destination
  const isEstimating = estimate.status === 'loading'

  const submitDisabled = submitting || locating || isResolvingAddress || isEstimating

  const getFareText = (vehicle) => {
    const fare = estimate.fares?.[vehicle.value]?.totalFare

    if (Number.isFinite(fare)) return formatFare(fare)

    return isEstimating ? '...' : '—'
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* HEADER */}

      <div className="mb-6">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
          RideGo · Passenger
        </p>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Book your ride
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Search or pick your route on the map, compare fares and request a ride.
        </p>
      </div>

      {createdRide ? (
        /* ================= SUCCESS ================= */

        <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">Ride request created!</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your request has been sent to nearby drivers. Driver assignment may take a little time.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Ride status</p>
              <p className="mt-2 font-bold capitalize text-slate-900">
                {String(createdRide.rideStatus || 'requested').replaceAll('_', ' ')}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Estimated fare</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">
                {formatFare(createdRide.estimatedFare ?? createdRide.fare ?? 0)}
              </p>
            </div>

            {createdRide.distance > 0 && (
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-slate-500">Trip</p>
                <p className="mt-2 font-bold text-slate-900">
                  {formatDistance(createdRide.distance)} · about{' '}
                  {formatDuration(createdRide.duration)}
                </p>
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500">Ride ID</p>
              <p className="mt-2 break-all font-mono text-sm text-slate-800">
                {createdRide._id || createdRide.id || 'Created'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(ROUTES.rideDetails(createdRide._id || createdRide.id))}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Track your ride
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.history)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              View ride history
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Book another ride
            </button>
          </div>
        </section>
      ) : (
        /* ================= BOOKING FORM ================= */

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]"
        >
          {/* ---------- LEFT: MAP ---------- */}

          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MapPinned size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">Select on map</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Choose what you are setting, then tap the map.
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              {Object.entries(LOCATION_TYPES).map(([type, config]) => {
                const Icon = config.icon
                const isActive = selectionMode === type

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectionMode(type)}
                    aria-pressed={isActive}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                      isActive
                        ? type === 'pickup'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} />
                    {config.title}
                  </button>
                )
              })}
            </div>

            <LocationPickerMap
              pickup={pickupPosition}
              destination={destinationPosition}
              selectionMode={selectionMode}
              onSelectLocation={handleMapSelect}
              focusRequest={focusRequest}
              disabled={submitting}
            />
          </section>

          {/* ---------- RIGHT: DETAILS ---------- */}

          <div className="space-y-5">
            {/* LOCATIONS */}

            <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="font-bold text-slate-900">Your trip</h2>

              {['pickup', 'destination'].map((type) => {
                const location = type === 'pickup' ? pickup : destination

                return (
                  <LocationBlock
                    key={type}
                    type={type}
                    location={location}
                    resolving={resolving[type]}
                    active={selectionMode === type}
                    locating={type === 'pickup' ? locating : false}
                    disabled={submitting}
                    onActivate={() => setSelectionMode(type)}
                    onAddressChange={(value) => handleAddressChange(type, value)}
                    onSelectPlace={(place) => handlePlaceSelect(type, place)}
                    onClear={() => handleClear(type)}
                    onUseCurrentLocation={handleUseCurrentLocation}
                  />
                )
              })}

              {tripTooClose && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                  Pickup and destination are too close. Please choose different points.
                </p>
              )}
            </section>

            {/* VEHICLE */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="font-bold text-slate-900">Vehicle</h2>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {VEHICLES.map((vehicle) => (
                  <VehicleOption
                    key={vehicle.value}
                    vehicle={vehicle}
                    selected={vehicleType === vehicle.value}
                    fareText={getFareText(vehicle)}
                    onSelect={() => setVehicleType(vehicle.value)}
                  />
                ))}
              </div>
            </section>

            {/* PAYMENT */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-slate-500" />
                <h2 className="font-bold text-slate-900">Payment</h2>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const selected = paymentMethod === method.value

                  return (
                    <button
                      key={method.value}
                      type="button"
                      disabled={!method.enabled}
                      onClick={() => setPaymentMethod(method.value)}
                      aria-pressed={selected}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        !method.enabled
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                          : selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method.label}
                      {!method.enabled && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase">Soon</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* SUMMARY */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <RouteIcon size={18} className="text-slate-500" />
                <h2 className="font-bold text-slate-900">Trip summary</h2>
              </div>

              <div className="mt-4 space-y-3">
                {estimate.status === 'idle' && (
                  <p className="text-sm leading-6 text-slate-500">
                    Choose both locations to see the distance, travel time and fare.
                  </p>
                )}

                {isEstimating && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <LoaderCircle size={16} className="animate-spin" />
                    Calculating your fare...
                  </p>
                )}

                {estimate.status === 'error' && (
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="flex items-start gap-2 text-sm text-red-700">
                      <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                      {estimate.error}
                    </p>

                    <button
                      type="button"
                      onClick={() => setEstimateNonce((value) => value + 1)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"
                    >
                      <RefreshCw size={13} />
                      Try again
                    </button>
                  </div>
                )}

                {estimate.status === 'success' && (
                  <>
                    <SummaryRow label="Distance" value={formatDistance(estimate.route.distance)} />
                    <SummaryRow
                      label="Travel time"
                      value={`about ${formatDuration(estimate.route.duration)}`}
                    />
                    <SummaryRow
                      label={`${VEHICLES.find((v) => v.value === vehicleType)?.label} fare`}
                      value={formatFare(selectedFare)}
                    />
                    <SummaryRow label="Payment" value={selectedPayment?.label || '—'} />

                    {estimate.route.source === 'estimated' && (
                      <p className="text-xs leading-5 text-slate-400">
                        Route service is busy, so distance and time are approximate. The final fare
                        is confirmed when you request.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={submitDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Requesting ride...
                </>
              ) : (
                <>
                  <CarFront size={20} />
                  {Number.isFinite(selectedFare)
                    ? `Request ${VEHICLES.find((v) => v.value === vehicleType)?.label} · ${formatFare(selectedFare)}`
                    : 'Request a ride'}
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-slate-400">
              By requesting a ride, you confirm your pickup and destination are correct.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

export default BookRide
