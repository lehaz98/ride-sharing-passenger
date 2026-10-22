import { ArrowLeft, Home, SearchX } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <SearchX size={42} strokeWidth={1.6} />
        </div>

        <p className="mt-6 text-sm font-bold tracking-[0.2em] text-emerald-700">ERROR 404</p>

        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Page not found</h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          Sorry, the page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Go back
          </button>

          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <Home size={17} />
            Go home
          </Link>
        </div>
      </section>
    </main>
  )
}

export default NotFound
