import { useEffect, useState } from 'react'
import { useSocket } from '../context/SocketContext'

const DRIVER_ACTIVE_STATUSES = ['driver_assigned', 'driver_arriving', 'ride_started']

const useLiveDriverLocation = (ride, isActive) => {
  const { socket, connected, joinRideRoom, leaveRideRoom } = useSocket()

  const [driverLocation, setDriverLocation] = useState(null)

  const rideId = ride?._id || ride?.id
  const status = ride?.rideStatus || ride?.status

  const driverId =
    typeof ride?.driver === 'object' ? ride.driver?._id || ride.driver?.id : ride?.driver

  const hasAssignedDriver = Boolean(driverId) && DRIVER_ACTIVE_STATUSES.includes(status)

  useEffect(() => {
    if (!socket || !connected || !rideId || !isActive || !hasAssignedDriver) {
      setDriverLocation(null)
      return undefined
    }

    let isMounted = true

    const handleDriverLocation = (payload) => {
      if (!isMounted || !payload) return

      if (String(payload.rideId) !== String(rideId)) return

      if (payload.driverId && String(payload.driverId) !== String(driverId)) {
        return
      }

      const latitude = Number(payload.location?.latitude)
      const longitude = Number(payload.location?.longitude)

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return
      }

      setDriverLocation({
        latitude,
        longitude,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      })
    }

    socket.on('driver_location_updated', handleDriverLocation)

    joinRideRoom(rideId)

    return () => {
      isMounted = false

      socket.off('driver_location_updated', handleDriverLocation)
      leaveRideRoom(rideId)
    }
  }, [
    socket,
    connected,
    rideId,
    driverId,
    isActive,
    hasAssignedDriver,
    joinRideRoom,
    leaveRideRoom,
  ])

  return driverLocation
}

export default useLiveDriverLocation
