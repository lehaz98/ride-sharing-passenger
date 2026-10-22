import api from './api'

export const registerPassenger = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const loginPassenger = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

export const getCurrentPassenger = async () => {
  const response = await api.get('/auth/me')
  return response.data
}
