import { useEffect, useState } from 'react'
import { LoaderCircle, Save, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import userService from '../services/userService'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const response = await userService.getProfile()
        const profile = response?.user || response?.data?.user || response?.data || response

        if (!cancelled && profile) {
          setForm({
            name: profile.name || user?.name || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || user?.phone || '',
          })
        }
      } catch (error) {
        if (!cancelled) {
          setForm({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
          })

          toast.error(
            error.response?.data?.message || 'Could not load your profile from the server.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Please enter your name.')
      return
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email.')
      return
    }

    setSaving(true)

    try {
      await userService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600">
        <LoaderCircle size={25} className="animate-spin text-emerald-600" />
        Loading profile...
      </div>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <UserRound size={25} />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your passenger account information.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
      >
        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-700">
            Full name
          </label>

          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email address
          </label>

          <input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Phone number
          </label>

          <input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving changes...' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}

export default Profile
