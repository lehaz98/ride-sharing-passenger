import api from './api'

const paymentService = {
  async getPayments(params = {}) {
    const response = await api.get('/payments', {
      params,
    })

    return response.data
  },

  async getPaymentById(paymentId) {
    if (!paymentId) {
      throw new Error('Payment ID is required.')
    }

    const response = await api.get(`/payments/${paymentId}`)
    return response.data
  },

  async getPaymentByRideId(rideId) {
    if (!rideId) {
      throw new Error('Ride ID is required.')
    }

    const response = await api.get(`/payments/ride/${rideId}`)
    return response.data
  },

  async getPaymentHistory(params = {}) {
    const response = await api.get('/payments/history', {
      params,
    })

    return response.data
  },

  async createPayment(paymentData) {
    if (!paymentData || typeof paymentData !== 'object') {
      throw new Error('Valid payment information is required.')
    }

    const response = await api.post('/payments', paymentData)
    return response.data
  },

  async confirmPayment(paymentId, paymentData = {}) {
    if (!paymentId) {
      throw new Error('Payment ID is required.')
    }

    const response = await api.post(`/payments/${paymentId}/confirm`, paymentData)

    return response.data
  },

  async getPaymentStatus(paymentId) {
    if (!paymentId) {
      throw new Error('Payment ID is required.')
    }

    const response = await api.get(`/payments/${paymentId}/status`)
    return response.data
  },
}

export const {
  getPayments,
  getPaymentById,
  getPaymentByRideId,
  getPaymentHistory,
  createPayment,
  confirmPayment,
  getPaymentStatus,
} = paymentService

export default paymentService
