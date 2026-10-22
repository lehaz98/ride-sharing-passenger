import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, MessageSquareText, RefreshCw, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import reviewService from '../services/reviewService'

const getReviewList = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.reviews)) return response.reviews
  if (Array.isArray(response?.data?.reviews)) return response.data.reviews
  if (Array.isArray(response?.data)) return response.data
  return []
}

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadReviews = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const response = await reviewService.getReviews({
        page: 1,
        limit: 20,
      })

      setReviews(getReviewList(response))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load your reviews.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Star size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Reviews</h1>
            <p className="mt-1 text-sm text-slate-500">Reviews associated with your rides.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadReviews(false)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <section className="mt-7 space-y-4">
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
            <LoaderCircle size={30} className="animate-spin text-emerald-600" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <MessageSquareText size={36} className="mx-auto text-slate-300" />

            <h2 className="mt-4 font-bold text-slate-800">No reviews found</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your submitted ride reviews will appear here when available.
            </p>
          </div>
        ) : (
          reviews.map((review, index) => {
            const id = review._id || review.id || `review-${index}`
            const rating = Number(review.rating ?? review.stars ?? 0)
            const comment = review.comment || review.review || review.feedback
            const rideId =
              review.ride?._id ||
              review.rideId ||
              (typeof review.ride === 'string' ? review.ride : null)

            return (
              <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{review.title || 'Ride review'}</h2>

                    {review.createdAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700"
                    aria-label={`${rating} out of 5 stars`}
                  >
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {Number.isFinite(rating) ? `${rating}/5` : 'Not rated'}
                  </div>
                </div>

                {comment && (
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {comment}
                  </p>
                )}

                {review.driver?.name && (
                  <p className="mt-3 text-sm text-slate-500">Driver: {review.driver.name}</p>
                )}

                {rideId && (
                  <p className="mt-3 break-all text-xs text-slate-400">Ride ID: {rideId}</p>
                )}
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default Reviews
