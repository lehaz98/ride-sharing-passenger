import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import PassengerLayout from './layouts/PassengerLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import PassengerHome from './pages/PassengerHome'
import BookRide from './pages/BookRide'
import RideTracking from './pages/RideTracking'
import RideHistory from './pages/RideHistory'

const PassengerProfile = () => (
  <section className="rounded-2xl border border-slate-200 bg-white p-8">
    <h1 className="text-2xl font-extrabold text-slate-900">Passenger Profile</h1>
    <p className="mt-2 text-slate-500">Manage your passenger account here.</p>
  </section>
)

const App = () => {
  return (
    <BrowserRouter>
      {' '}
      <AuthProvider>
        {' '}
        <SocketProvider>
          {' '}
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />{' '}
            </Route>

            {/* Protected passenger routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PassengerLayout />}>
                <Route path="/" element={<PassengerHome />} />
                <Route path="/book" element={<BookRide />} />
                <Route path="/rides/:rideId" element={<RideTracking />} />
                <Route path="/history" element={<RideHistory />} />
                <Route path="/profile" element={<PassengerProfile />} />
              </Route>
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
