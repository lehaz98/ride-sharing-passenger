import api from './api'

const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        ...params,
      },
    })

    return response.data
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count')
    return response.data
  },

  async markNotificationRead(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required.')
    }

    const response = await api.patch(`/notifications/${notificationId}/read`)

    return response.data
  },

  async markAllNotificationsRead() {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },

  async deleteNotification(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required.')
    }

    const response = await api.delete(`/notifications/${notificationId}`)

    return response.data
  },

  async deleteAllNotifications() {
    const response = await api.delete('/notifications')
    return response.data
  },
}

export const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} = notificationService

export default notificationService
