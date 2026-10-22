import api from './api'

const reviewService = {
  async getReviews(params = {}) {
    const response = await api.get('/reviews', {
      params,
    })

    return response.data
  },

  async getReviewById(reviewId) {
    if (!reviewId) {
      throw new Error('Review ID is required.')
    }

    const response = await api.get(`/reviews/${reviewId}`)
    return response.data
  },

  async getRideReview(rideId) {
    if (!rideId) {
      throw new Error('Ride ID is required.')
    }

    const response = await api.get(`/reviews/ride/${rideId}`)
    return response.data
  },

  async createReview(reviewData) {
    if (!reviewData || typeof reviewData !== 'object') {
      throw new Error('Valid review information is required.')
    }

    const response = await api.post('/reviews', reviewData)
    return response.data
  },

  async updateReview(reviewId, reviewData) {
    if (!reviewId) {
      throw new Error('Review ID is required.')
    }

    if (!reviewData || typeof reviewData !== 'object') {
      throw new Error('Valid review information is required.')
    }

    const response = await api.put(`/reviews/${reviewId}`, reviewData)

    return response.data
  },

  async deleteReview(reviewId) {
    if (!reviewId) {
      throw new Error('Review ID is required.')
    }

    const response = await api.delete(`/reviews/${reviewId}`)
    return response.data
  },
}

export const {
  getReviews,
  getReviewById,
  getRideReview,
  createReview,
  updateReview,
  deleteReview,
} = reviewService

export default reviewService
