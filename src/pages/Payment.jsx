import { useEffect, useState } from 'react'
import { CreditCard, LoaderCircle, ReceiptText } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import paymentService from '../services/paymentService'
import { formatFare } from '../utils/formatCurrency'

const getPaymentObject = (response) =>
  response?.payment || response?.data?.payment || response?.data || response || null

const Payment = () => {
  const [searchParams] = useSearchParams()
  const rideId = searchParams.get('rideId')
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(Boolean(rideId))
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadPayment = async () => {
      if (!rideId) {
        setLoading(false)
        setError('A ride ID is required to view payment details.')
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await paymentService.getPaymentByRideId(rideId)

        if (!cancelled) {
          setPayment(getPaymentObject(response))
        }
      } catch (requestError) {
        if (!cancelled) {
          const message = requestError.response?.data?.message || 'Could not load payment details.'

          setError(message)
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPayment()

    return () => {
      cancelled = true
    }
  }, [rideId])

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="animate-spin text-emerald-600" size={25} />
          <span className="font-medium">Loading payment details…</span>
        </div>
      </main>
    )
  }

  if (error || !payment) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ReceiptText size={38} className="mx-auto text-slate-400" />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            Payment details unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || 'No payment record was found for this ride.'}
          </p>
          <Link
            to="/history"
            className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            View ride history
          </Link>
        </section>
      </main>
    )
  }

  const amount = payment.amount ?? payment.totalAmount ?? payment.fare ?? payment.ride?.fare

  const status = String(payment.status || 'pending').toLowerCase()
  const method = String(payment.method || payment.paymentMethod || 'unknown')
  const paymentId = payment._id || payment.id || 'Unavailable'

  const statusClasses = {
    paid: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-blue-50 text-blue-700',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-purple-50 text-purple-700',
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CreditCard size={25} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payment</h1>
          <p className="mt-1 text-sm text-slate-500">Review the payment details for your ride.</p>
        </div>
      </div>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Payment amount</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {amount !== undefined && amount !== null ? formatFare(amount) : '—'}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
              statusClasses[status] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {status.replaceAll('_', ' ')}
          </span>
        </div>

        <div className="my-6 border-t border-slate-100" />

        <dl className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <dt className="text-slate-500">Payment ID</dt>
            <dd className="max-w-[65%] break-all text-right font-medium text-slate-800">
              {paymentId}
            </dd>
          </div>

          <div className="flex justify-between gap-2 text-sm">
            <dt className="text-slate-500">Payment method</dt>
            <dd className="font-semibold capitalize text-slate-800">
              {method.replaceAll('_', ' ')}
            </dd>
          </div>

          <div className="flex justify-between gap-2 text-sm">
            <dt className="text-slate-500">Ride ID</dt>
            <dd className="max-w-[65%] break-all text-right font-medium text-slate-800">
              {rideId}
            </dd>
          </div>

          {payment.createdAt && (
            <div className="flex justify-between gap-2 text-sm">
              <dt className="text-slate-500">Created</dt>
              <dd className="text-right font-medium text-slate-800">
                {new Date(payment.createdAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        This page displays the payment record returned by the server. It does not collect card
        details or initiate a new charge.
      </p>
    </main>
  )
}

export default Payment
