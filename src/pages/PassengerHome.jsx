import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, MapPin, ShieldCheck, CarFront } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PassengerHome = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-indigo-950 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
            Welcome to RideGo
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Hello, {user?.name?.split(' ')[0] || 'Passenger'}!
            <br />
            Where are we going?
          </h1>

          <p className="mt-5 max-w-xl leading-7 text-indigo-100/80">
            Your next journey starts with a few simple steps. Choose where you want to go and
            prepare for your ride.
          </p>

          <Link
            to="/book"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-indigo-950 transition hover:bg-indigo-50"
          >
            Book a ride <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-slate-900">Your journey, made simple</h2>
          <p className="mt-1 text-sm text-slate-500">Everything you need to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin size={24} />
            </span>
            <h3 className="mt-5 font-bold text-slate-900">Choose your destination</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Set your pickup and destination to prepare a new ride.
            </p>
            <Link
              to="/book"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
            >
              Start booking <ArrowRight size={16} />
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </span>
            <h3 className="mt-5 font-bold text-slate-900">Your account</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your passenger information and account details.
            </p>
            <Link
              to="/profile"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
            >
              View profile <ArrowRight size={16} />
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={24} />
            </span>
            <h3 className="mt-5 font-bold text-slate-900">Past journeys</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Visit your ride history to review previous trips.
            </p>
            <Link
              to="/history"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
            >
              Ride history <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <CarFront size={25} />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Ready for your next ride?</h2>
            <p className="mt-1 text-sm text-slate-500">Start a booking whenever you're ready.</p>
          </div>
        </div>

        <Link
          to="/book"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
        >
          Book now <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  )
}

export default PassengerHome
