import { useCallback, useEffect, useState } from 'react'
import { CreditCard, LoaderCircle, RefreshCw, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import paymentService from '../services/paymentService'
import { formatFare } from '../utils/formatCurrency'

const getPaymentList = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.payments)) return response.payments
  if (Array.isArray(response?.data?.payments)) return response.data.payments
  if (Array.isArray(response?.data)) return response.data
  return []
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPayments = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const response = await paymentService.getPaymentHistory({
        page: 1,
        limit: 20,
      })

      setPayments(getPaymentList(response))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load payment history.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const statusClasses = {
    paid: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    processing: 'bg-blue-50 text-blue-700',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-purple-50 text-purple-700',
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ReceiptText size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Payment History</h1>
            <p className="mt-1 text-sm text-slate-500">Review your previous ride payments.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadPayments(false)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <section className="mt-7 space-y-3">
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
            <LoaderCircle className="animate-spin text-emerald-600" size={30} />
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <CreditCard size={36} className="mx-auto text-slate-300" />
            <h2 className="mt-4 font-bold text-slate-800">No payment history</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your payment records will appear here when available.
            </p>
            <Link
              to="/history"
              className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              View ride history
            </Link>
          </div>
        ) : (
          payments.map((payment, index) => {
            const id = payment._id || payment.id || `payment-${index}`
            const rideId =
              payment.ride?._id ||
              payment.rideId ||
              (typeof payment.ride === 'string' ? payment.ride : null)

            const amount =
              payment.amount ?? payment.totalAmount ?? payment.fare ?? payment.ride?.fare

            const status = String(payment.status || 'pending').toLowerCase()
            const method = String(payment.method || payment.paymentMethod || 'unknown')

            return (
              <article key={id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                    <CreditCard size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-extrabold text-slate-900">
                        {amount !== undefined && amount !== null
                          ? formatFare(amount)
                          : 'Amount unavailable'}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusClasses[status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {status.replaceAll('_', ' ')}
                      </span>
                    </div>

                    <p className="mt-2 text-sm capitalize text-slate-600">
                      Method: {method.replaceAll('_', ' ')}
                    </p>

                    {payment.createdAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    )}

                    {rideId && (
                      <Link
                        to={`/rides/${rideId}`}
                        className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        View ride details
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default PaymentHistory
