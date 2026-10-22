import { MapPin, Search, X } from 'lucide-react'

const LocationInput = ({
  label = 'Location',
  placeholder = 'Enter a location',
  value = '',
  onChange,
  onClear,
  icon: Icon = MapPin,
  disabled = false,
  error = '',
  name,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={name || label} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div
        className={`flex min-h-12 items-center gap-3 rounded-xl border bg-white px-3 transition ${
          error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100'
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
        } ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-70' : ''}`}
      >
        <Icon size={19} className="shrink-0 text-emerald-600" />

        <input
          id={name || label}
          name={name}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />

        {value && !disabled && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label}`}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={17} />
          </button>
        )}

        {!value && <Search size={17} className="shrink-0 text-slate-400" />}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default LocationInput
