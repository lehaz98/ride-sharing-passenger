// ======================================================
// LOCATION SEARCH INPUT
//
// A reusable address input with live place search.
//
// - Debounced search (Nominatim friendly), cancels old requests
// - Keyboard support: ArrowUp / ArrowDown / Enter / Escape
// - Accessible combobox (ARIA)
// - The parent owns the text (`value`); typing calls `onChange`,
//   choosing a result calls `onSelectPlace(place)` where
//   place = { id, name, secondary, address, latitude, longitude }
//
// Props
//   id, value, onChange, onSelectPlace
//   onFocus, placeholder, ariaLabel
//   loading        show a spinner (e.g. while resolving an address)
//   disabled
//   countryCodes   override geocoder country filter (optional)
//   limit          max results (optional)
// ======================================================

import { useEffect, useId, useRef, useState } from 'react'
import { LoaderCircle, MapPin, TriangleAlert } from 'lucide-react'

import {
  MIN_SEARCH_LENGTH,
  describeLocationError,
  isAbortError,
  searchPlaces,
} from '../services/locationService'

const DEBOUNCE_MS = 500

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60'

// ------------------------------------------------------
// useDebouncedValue
// ------------------------------------------------------

const useDebouncedValue = (value, delay) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------

const LocationSearchInput = ({
  id,
  value,
  onChange,
  onSelectPlace,
  onFocus,
  placeholder = 'Search for a place',
  ariaLabel,
  loading = false,
  disabled = false,
  countryCodes,
  limit,
}) => {
  const listboxId = useId()
  const containerRef = useRef(null)
  const abortRef = useRef(null)

  // `query` only changes when the USER types.
  // Programmatic address changes (map click, GPS) never trigger a search.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(trimmedQuery, DEBOUNCE_MS)

  const isLongEnough = trimmedQuery.length >= MIN_SEARCH_LENGTH
  const isPending = isLongEnough && trimmedQuery !== debouncedQuery
  const isSearching = isPending || status === 'loading'
  const showDropdown = open && trimmedQuery.length > 0

  // ----------------------------------------------------
  // SEARCH
  // ----------------------------------------------------

  useEffect(() => {
    if (debouncedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setStatus('idle')
      setActiveIndex(-1)

      return undefined
    }

    const controller = new AbortController()

    abortRef.current = controller

    setStatus('loading')
    setErrorMessage('')

    searchPlaces(debouncedQuery, {
      signal: controller.signal,
      countryCodes,
      limit,
    })
      .then((places) => {
        setResults(places)
        setStatus('success')
        setActiveIndex(places.length > 0 ? 0 : -1)
      })
      .catch((error) => {
        if (isAbortError(error)) return

        setResults([])
        setStatus('error')
        setErrorMessage(describeLocationError(error))
        setActiveIndex(-1)
      })

    return () => controller.abort()
  }, [debouncedQuery, countryCodes, limit])

  // ----------------------------------------------------
  // CLOSE ON OUTSIDE CLICK
  // ----------------------------------------------------

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  const handleInputChange = (event) => {
    const text = event.target.value

    onChange(text)
    setQuery(text)
    setOpen(true)
  }

  const handleSelect = (place) => {
    abortRef.current?.abort()

    setQuery('')
    setResults([])
    setStatus('idle')
    setActiveIndex(-1)
    setOpen(false)

    onSelectPlace(place)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (!showDropdown || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      handleSelect(results[activeIndex])
    }
  }

  const handleFocus = () => {
    if (trimmedQuery.length > 0) setOpen(true)

    onFocus?.()
  }

  // ----------------------------------------------------
  // DROPDOWN CONTENT
  // ----------------------------------------------------

  const renderDropdownBody = () => {
    if (!isLongEnough) {
      return (
        <p className="px-4 py-3 text-xs text-slate-500">
          Type at least {MIN_SEARCH_LENGTH} characters to search.
        </p>
      )
    }

    if (isSearching && results.length === 0) {
      return (
        <p className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
          <LoaderCircle size={14} className="animate-spin" />
          Searching...
        </p>
      )
    }

    if (status === 'error') {
      return (
        <p className="flex items-start gap-2 px-4 py-3 text-xs text-amber-700">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          {errorMessage}
        </p>
      )
    }

    if (status === 'success' && results.length === 0) {
      return (
        <p className="px-4 py-3 text-xs text-slate-500">
          No places found. Try a different name, or tap the map.
        </p>
      )
    }

    return (
      <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
        {results.map((place, index) => {
          const isActive = index === activeIndex

          return (
            <li
              key={place.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={isActive}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(place)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 ${
                isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'
              }`}
            >
              <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{place.name}</p>

                {place.secondary && (
                  <p className="truncate text-xs text-slate-500">{place.secondary}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={
          showDropdown && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        autoComplete="off"
        maxLength={500}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={inputClass}
      />

      {(loading || isSearching) && (
        <LoaderCircle
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
        />
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[1100] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {renderDropdownBody()}
        </div>
      )}
    </div>
  )
}

export default LocationSearchInput
