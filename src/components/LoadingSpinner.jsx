import { LoaderCircle } from 'lucide-react'

const LoadingSpinner = ({
  message = 'Loading...',
  fullScreen = false,
  size = 28,
  className = '',
}) => {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-slate-600 ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle size={size} className="animate-spin text-emerald-600" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
      <span className="sr-only">Please wait</span>
    </div>
  )

  if (fullScreen) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        {content}
      </main>
    )
  }

  return content
}

export default LoadingSpinner
