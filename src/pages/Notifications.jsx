import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import notificationService from '../services/notificationService'

const getNotificationList = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.notifications)) return response.notifications
  if (Array.isArray(response?.data?.notifications)) return response.data.notifications
  if (Array.isArray(response?.data)) return response.data
  return []
}

const getNotificationId = (notification) => notification?._id || notification?.id

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const loadNotifications = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setRefreshing(true)

    try {
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 50,
      })

      setNotifications(getNotificationList(response))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load notifications.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkRead = async (notification) => {
    const id = getNotificationId(notification)

    if (!id || notification.isRead || notification.read || busyId) return

    setBusyId(id)

    try {
      await notificationService.markNotificationRead(id)

      setNotifications((current) =>
        current.map((item) =>
          getNotificationId(item) === id ? { ...item, isRead: true, read: true } : item
        )
      )

      toast.success('Notification marked as read.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update notification.')
    } finally {
      setBusyId(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (busyId || notifications.length === 0) return

    setBusyId('all')

    try {
      await notificationService.markAllNotificationsRead()

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, read: true })))

      toast.success('All notifications marked as read.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update notifications.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (notification) => {
    const id = getNotificationId(notification)

    if (!id || busyId) return

    setBusyId(id)

    try {
      await notificationService.deleteNotification(id)

      setNotifications((current) => current.filter((item) => getNotificationId(item) !== id))

      toast.success('Notification deleted.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete notification.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (busyId || notifications.length === 0) return

    const confirmed = window.confirm('Are you sure you want to delete all notifications?')

    if (!confirmed) return

    setBusyId('all')

    try {
      await notificationService.deleteAllNotifications()
      setNotifications([])
      toast.success('All notifications deleted.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete notifications.')
    } finally {
      setBusyId(null)
    }
  }

  const unreadCount = notifications.filter((item) => !item.isRead && !item.read).length

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="text-emerald-600" size={25} />
            <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            You have {unreadCount} unread notification
            {unreadCount === 1 ? '' : 's'}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadNotifications(false)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={busyId !== null || unreadCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>

        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={busyId !== null || notifications.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={17} />
          Delete all
        </button>
      </div>

      <section className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white p-12">
            <LoaderCircle className="animate-spin text-emerald-600" size={30} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Bell size={35} className="mx-auto text-slate-300" />
            <h2 className="mt-4 font-bold text-slate-800">No notifications yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ride updates and other important messages will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const id = getNotificationId(notification) || `notification-${index}`
            const isRead = Boolean(notification.isRead || notification.read)
            const title = notification.title || 'Notification'
            const message =
              notification.message ||
              notification.body ||
              notification.description ||
              'You have a new update.'

            return (
              <article
                key={id}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  isRead ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                    <Bell size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-900">{title}</h2>
                      {!isRead && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {message}
                    </p>

                    {notification.createdAt && (
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!isRead && getNotificationId(notification) && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification)}
                          disabled={busyId !== null}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Mark as read
                        </button>
                      )}

                      {getNotificationId(notification) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(notification)}
                          disabled={busyId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
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

export default Notifications
