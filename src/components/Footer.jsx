import { CarFront, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CarFront size={22} />
          </span>

          <span>
            <span className="block font-extrabold text-slate-900">RideGo</span>
            <span className="block text-xs text-slate-500">Your ride, your way</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={17} className="shrink-0 text-emerald-600" />
          <span>Ride safely. Travel comfortably.</span>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} RideGo. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
