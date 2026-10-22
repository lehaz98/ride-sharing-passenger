import api from './api'

const userService = {
  async getProfile() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async updateProfile(profileData) {
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Valid profile information is required.')
    }

    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  async changePassword(passwordData) {
    if (!passwordData || typeof passwordData !== 'object') {
      throw new Error('Valid password information is required.')
    }

    const response = await api.put('/auth/change-password', passwordData)
    return response.data
  },
}

export const { getProfile, updateProfile, changePassword } = userService

export default userService
