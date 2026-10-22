import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const RideContext = createContext(null)

const DEFAULT_RIDE_STATE = {
  pickup: null,
  destination: null,
  vehicleType: 'car',
  paymentMethod: 'cash',
}

export const RideProvider = ({ children }) => {
  const [pickup, setPickupState] = useState(DEFAULT_RIDE_STATE.pickup)
  const [destination, setDestinationState] = useState(DEFAULT_RIDE_STATE.destination)
  const [vehicleType, setVehicleTypeState] = useState(DEFAULT_RIDE_STATE.vehicleType)
  const [paymentMethod, setPaymentMethodState] = useState(DEFAULT_RIDE_STATE.paymentMethod)

  const setPickup = useCallback((value) => {
    setPickupState(value)
  }, [])

  const setDestination = useCallback((value) => {
    setDestinationState(value)
  }, [])

  const setVehicleType = useCallback((value) => {
    setVehicleTypeState(value)
  }, [])

  const setPaymentMethod = useCallback((value) => {
    setPaymentMethodState(value)
  }, [])

  const resetRide = useCallback(() => {
    setPickupState(DEFAULT_RIDE_STATE.pickup)
    setDestinationState(DEFAULT_RIDE_STATE.destination)
    setVehicleTypeState(DEFAULT_RIDE_STATE.vehicleType)
    setPaymentMethodState(DEFAULT_RIDE_STATE.paymentMethod)
  }, [])

  const value = useMemo(
    () => ({
      pickup,
      setPickup,
      destination,
      setDestination,
      vehicleType,
      setVehicleType,
      paymentMethod,
      setPaymentMethod,
      resetRide,
    }),
    [
      pickup,
      setPickup,
      destination,
      setDestination,
      vehicleType,
      setVehicleType,
      paymentMethod,
      setPaymentMethod,
      resetRide,
    ]
  )

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>
}

export const useRide = () => {
  const context = useContext(RideContext)

  if (!context) {
    throw new Error('useRide must be used inside a RideProvider')
  }

  return context
}

export default RideContext
