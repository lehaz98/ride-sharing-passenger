// ======================================================
// LOCATION PICKER MAP
//
// A "dumb", fully controlled map. It owns NO location state
// and NO form UI. The parent page decides everything.
//
// Props
//   pickup, destination   { latitude, longitude } | null
//   driverLocation        { latitude, longitude } | null
//                         shows a live driver marker (tracking page).
//                         The marker glides smoothly to every new position.
//   driverLabel           tooltip text for the driver, default "Your driver"
//   selectionMode         'pickup' | 'destination'  (what a map click sets)
//   onSelectLocation      (type, { latitude, longitude }) => void
//                         called on map click AND when a pin is dragged
//   focusRequest          { id, type: 'point', latitude, longitude }
//                         | { id, type: 'fit' } | null
//                         Change the object to move the camera. 'fit' shows
//                         every known point (pickup, destination, driver).
//                         The map never moves on its own after a normal
//                         click, so it does not "jump" under the cursor.
//   routeLine             [[lat, lng], ...] | null   (optional real route)
//   disabled              block clicks / dragging (also hides the hint)
//   scrollWheelZoom       default true
//   center, zoom          initial camera
//   height                px number or CSS string, default 380
//   className             extra classes for the wrapper
//
// Optional .env
//   VITE_MAP_TILE_URL, VITE_MAP_TILE_ATTRIBUTION
// ======================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ------------------------------------------------------
// CONFIG
// ------------------------------------------------------

const DEFAULT_CENTER = [23.8103, 90.4125]
const DEFAULT_ZOOM = 12

const POINT_FOCUS_ZOOM = 15 // zoom used when flying to a single point
const MAX_FIT_ZOOM = 16
const FIT_PADDING = [56, 56]
const FLY_DURATION_SECONDS = 0.7

// Driver marker glide
const DRIVER_ANIMATION_MS = 900
const DRIVER_JUMP_METERS = 2000 // farther than this: jump instead of gliding

const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const PIN_COLORS = {
  pickup: '#059669',
  destination: '#f97316',
}

const PIN_LABELS = {
  pickup: 'Pickup',
  destination: 'Destination',
}

// ------------------------------------------------------
// ICONS
// Drawn with inline SVG / HTML, so there are no marker image
// files to import and nothing to break in the bundler.
// ------------------------------------------------------

const createPinIcon = (color) =>
  L.divIcon({
    className: 'ride-pin',
    html: `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"
           style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35)); display: block;">
        <path d="M16 1C7.7 1 1 7.7 1 16c0 11 15 25 15 25s15-14 15-25C31 7.7 24.3 1 16 1z"
              fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="5.5" fill="#ffffff"/>
      </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 41],
  })

const PIN_ICONS = {
  pickup: createPinIcon(PIN_COLORS.pickup),
  destination: createPinIcon(PIN_COLORS.destination),
}

const DRIVER_ICON = L.divIcon({
  className: 'driver-location-pin',
  html: `
    <div style="
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      font-size: 22px;
      line-height: 1;
    ">🚗</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

// null / undefined / '' must NOT become 0, or "no value" turns into (0, 0)
const toNumber = (value) =>
  value === null || value === undefined || value === '' ? Number.NaN : Number(value)

// { latitude, longitude } (numbers or numeric strings) -> clean point | null
const toPoint = (position) => {
  if (!position) return null

  const latitude = toNumber(position.latitude)
  const longitude = toNumber(position.longitude)

  const isValid =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180

  return isValid ? { latitude, longitude } : null
}

const toLatLng = (point) => [point.latitude, point.longitude]

// ------------------------------------------------------
// MAP CLICK  ->  set the active point
// ------------------------------------------------------

const MapClickHandler = ({ selectionMode, disabled, onSelectLocation }) => {
  useMapEvents({
    click(event) {
      if (disabled || !onSelectLocation) return

      // wrap() keeps longitude inside -180..180 when the world repeats
      const { lat, lng } = event.latlng.wrap()

      onSelectLocation(selectionMode, { latitude: lat, longitude: lng })
    },
  })

  return null
}

// ------------------------------------------------------
// CAMERA + RESIZE
// ------------------------------------------------------

const MapController = ({ focusRequest, pickup, destination, driver }) => {
  const map = useMap()

  // always read the latest points without re-running the camera effect
  const latestPoints = useRef({ pickup, destination, driver })
  latestPoints.current = { pickup, destination, driver }

  // keep tiles correct when the container changes size
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => map.invalidateSize())

    observer.observe(map.getContainer())

    return () => observer.disconnect()
  }, [map])

  // move the camera only when the parent asks for it
  useEffect(() => {
    if (!focusRequest) return

    if (focusRequest.type === 'fit') {
      const points = Object.values(latestPoints.current).filter(Boolean).map(toLatLng)

      if (points.length >= 2) {
        map.flyToBounds(points, {
          padding: FIT_PADDING,
          maxZoom: MAX_FIT_ZOOM,
          duration: FLY_DURATION_SECONDS,
        })

        return
      }

      if (points.length === 1) {
        map.flyTo(points[0], Math.max(map.getZoom(), POINT_FOCUS_ZOOM), {
          duration: FLY_DURATION_SECONDS,
        })
      }

      return
    }

    const target = toPoint(focusRequest)

    if (target) {
      map.flyTo(toLatLng(target), Math.max(map.getZoom(), POINT_FOCUS_ZOOM), {
        duration: FLY_DURATION_SECONDS,
      })
    }
  }, [focusRequest, map])

  return null
}

// ------------------------------------------------------
// DRAGGABLE PIN (pickup / destination)
// ------------------------------------------------------

const PinMarker = ({ type, position, active, draggable, onMove }) => {
  const eventHandlers = useMemo(
    () => ({
      dragend(event) {
        if (!onMove) return

        const { lat, lng } = event.target.getLatLng().wrap()

        onMove(type, { latitude: lat, longitude: lng })
      },
    }),
    [type, onMove]
  )

  return (
    <Marker
      position={toLatLng(position)}
      icon={PIN_ICONS[type]}
      draggable={draggable}
      zIndexOffset={active ? 1000 : 0}
      eventHandlers={eventHandlers}
    >
      <Tooltip direction="top" offset={[0, -38]}>
        {PIN_LABELS[type]}
      </Tooltip>
    </Marker>
  )
}

// ------------------------------------------------------
// LIVE DRIVER MARKER
// Glides to each new position instead of jumping.
// ------------------------------------------------------

const DriverMarker = ({ position, label }) => {
  const markerRef = useRef(null)
  const frameRef = useRef(null)

  // The Marker gets a FIXED start position. Only the animation below
  // moves it afterwards, so React re-renders can never snap it back.
  const [startPosition] = useState(() => toLatLng(position))

  useEffect(() => {
    const marker = markerRef.current

    if (!marker) return undefined

    const from = marker.getLatLng()
    const to = L.latLng(position.latitude, position.longitude)

    cancelAnimationFrame(frameRef.current)

    // already there, or too far to be a believable drive: jump
    if (from.equals(to) || from.distanceTo(to) > DRIVER_JUMP_METERS) {
      marker.setLatLng(to)
      return undefined
    }

    const startTime = performance.now()

    const step = (now) => {
      const progress = Math.min((now - startTime) / DRIVER_ANIMATION_MS, 1)

      marker.setLatLng([
        from.lat + (to.lat - from.lat) * progress,
        from.lng + (to.lng - from.lng) * progress,
      ])

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frameRef.current)
  }, [position.latitude, position.longitude])

  return (
    <Marker ref={markerRef} position={startPosition} icon={DRIVER_ICON} zIndexOffset={2000}>
      <Tooltip direction="top" offset={[0, -24]}>
        {label}
      </Tooltip>
    </Marker>
  )
}

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------

const LocationPickerMap = ({
  pickup = null,
  destination = null,
  driverLocation = null,
  driverLabel = 'Your driver',
  selectionMode = 'pickup',
  onSelectLocation,
  focusRequest = null,
  routeLine = null,
  disabled = false,
  scrollWheelZoom = true,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = 380,
  className = '',
}) => {
  const pickupPoint = toPoint(pickup)
  const destinationPoint = toPoint(destination)
  const driverPoint = toPoint(driverLocation)

  const hasRouteLine = Array.isArray(routeLine) && routeLine.length > 1

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

        <MapClickHandler
          selectionMode={selectionMode}
          disabled={disabled}
          onSelectLocation={onSelectLocation}
        />

        <MapController
          focusRequest={focusRequest}
          pickup={pickupPoint}
          destination={destinationPoint}
          driver={driverPoint}
        />

        {/* Real route when provided, otherwise a dashed straight guide line */}
        {hasRouteLine ? (
          <Polyline positions={routeLine} pathOptions={{ color: PIN_COLORS.pickup, weight: 5 }} />
        ) : (
          pickupPoint &&
          destinationPoint && (
            <Polyline
              positions={[toLatLng(pickupPoint), toLatLng(destinationPoint)]}
              pathOptions={{ color: '#64748b', weight: 3, dashArray: '6 8' }}
            />
          )
        )}

        {pickupPoint && (
          <PinMarker
            type="pickup"
            position={pickupPoint}
            active={selectionMode === 'pickup'}
            draggable={!disabled}
            onMove={onSelectLocation}
          />
        )}

        {destinationPoint && (
          <PinMarker
            type="destination"
            position={destinationPoint}
            active={selectionMode === 'destination'}
            draggable={!disabled}
            onMove={onSelectLocation}
          />
        )}

        {driverPoint && <DriverMarker position={driverPoint} label={driverLabel} />}
      </MapContainer>

      {/* Hint (only while the user can pick locations) */}
      {!disabled && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
          Tap the map to set{' '}
          <span style={{ color: PIN_COLORS[selectionMode] }}>
            {PIN_LABELS[selectionMode]?.toLowerCase()}
          </span>
          {' · '}drag a pin to adjust
        </div>
      )}

      {/* Live driver badge */}
      {driverPoint && (
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          Driver location live
        </div>
      )}
    </div>
  )
}

export default LocationPickerMap
