import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth()

  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  const userId = user?.id || user?._id
  const userRole = user?.role

  useEffect(() => {
    if (!token || !userId) {
      setSocket(null)
      setConnected(false)
      setConnectionError('')
      return undefined
    }

    let isMounted = true

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },

      // Start with polling and upgrade to WebSocket.
      transports: ['polling', 'websocket'],
      upgrade: true,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,

      withCredentials: true,
    })

    const onConnect = () => {
      if (!isMounted) return

      setConnected(true)
      setConnectionError('')

      console.log('Passenger Socket connected:', newSocket.id)
      console.log('Passenger Socket transport:', newSocket.io.engine.transport.name)
    }

    const onDisconnect = (reason) => {
      if (!isMounted) return

      setConnected(false)

      console.warn('Passenger Socket disconnected:', reason)
    }

    const onConnectError = (error) => {
      if (!isMounted) return

      setConnected(false)
      setConnectionError(error.message || 'Socket connection failed')

      console.error('Passenger Socket error:', error.message)
    }

    newSocket.on('connect', onConnect)
    newSocket.on('disconnect', onDisconnect)
    newSocket.on('connect_error', onConnectError)

    setSocket(newSocket)

    return () => {
      isMounted = false

      newSocket.off('connect', onConnect)
      newSocket.off('disconnect', onDisconnect)
      newSocket.off('connect_error', onConnectError)

      newSocket.disconnect()

      setConnected(false)
    }
  }, [token, userId, userRole])

  const joinRideRoom = useCallback(
    (rideId) => {
      if (!socket || !socket.connected || !rideId) {
        return
      }

      socket.emit('join_ride_room', rideId)
    },
    [socket]
  )

  const leaveRideRoom = useCallback(
    (rideId) => {
      if (!socket || !socket.connected || !rideId) {
        return
      }

      socket.emit('leave_ride_room', rideId)
    },
    [socket]
  )

  const value = useMemo(
    () => ({
      socket,
      connected,
      connectionError,
      joinRideRoom,
      leaveRideRoom,
    }),
    [socket, connected, connectionError, joinRideRoom, leaveRideRoom]
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)

  if (context === null) {
    throw new Error('useSocket must be used within SocketProvider')
  }

  return context
}
