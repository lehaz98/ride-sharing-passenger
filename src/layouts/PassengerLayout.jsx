import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CarFront, Clock3, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'

const PassengerLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }) =>
    `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <CarFront size={25} />
            </span>

            <span>
              <span className="block text-lg font-extrabold tracking-tight text-slate-900">
                RideGo
              </span>
              <span className="block text-xs text-slate-500">Your ride, your way</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" end className={navClass}>
              <CarFront size={17} />
              Book a ride
            </NavLink>

            <NavLink to="/history" className={navClass}>
              <Clock3 size={17} />
              Ride history
            </NavLink>

            <NavLink to="/profile" className={navClass}>
              <UserRound size={17} />
              Profile
            </NavLink>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
                {user?.name || 'Passenger'}
              </p>
              <p className="text-xs text-slate-500">Passenger account</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
          <NavLink to="/" end className={navClass}>
            <CarFront size={16} />
            Book a ride
          </NavLink>

          <NavLink to="/history" className={navClass}>
            <Clock3 size={16} />
            History
          </NavLink>

          <NavLink to="/profile" className={navClass}>
            <UserRound size={16} />
            Profile
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default PassengerLayout
