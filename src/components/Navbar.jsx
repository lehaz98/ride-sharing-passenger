import { CarFront, Clock3, LogOut, Menu, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('You have been logged out.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error?.message || 'Unable to log out.')
    } finally {
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CarFront size={25} />
          </span>

          <span>
            <span className="block text-lg font-extrabold text-slate-900">RideGo</span>
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

        <div className="hidden items-center gap-3 md:flex">
          <div className="max-w-36 text-right">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.name || 'Passenger'}
            </p>
            <p className="text-xs text-slate-500">Passenger account</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <p className="font-semibold text-slate-900">{user?.name || 'Passenger'}</p>
            <p className="text-sm text-slate-500">Passenger account</p>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>
              <CarFront size={17} />
              Book a ride
            </NavLink>

            <NavLink to="/history" className={navClass} onClick={() => setMenuOpen(false)}>
              <Clock3 size={17} />
              Ride history
            </NavLink>

            <NavLink to="/profile" className={navClass} onClick={() => setMenuOpen(false)}>
              <UserRound size={17} />
              Profile
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
