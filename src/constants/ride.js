export const ACTIVE_RIDE_STATUSES = [
  'requested',
  'driver_assigned',
  'driver_arriving',
  'ride_started',
]

export const CANCELLABLE_RIDE_STATUSES = ['requested', 'driver_assigned', 'driver_arriving']

export const VEHICLE_LABELS = {
  car: 'Car',
  bike: 'Bike',
  cng: 'CNG',
}

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  stripe: 'Card',
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

export const RIDE_STATUS_META = {
  requested: {
    title: 'Finding your driver',
    description: 'We are looking for an available driver.',
    tone: 'amber',
  },
  driver_assigned: {
    title: 'Driver assigned',
    description: 'Your driver has accepted the ride.',
    tone: 'blue',
  },
  driver_arriving: {
    title: 'Driver is arriving',
    description: 'Your driver is on the way to the pickup point.',
    tone: 'blue',
  },
  ride_started: {
    title: 'Ride in progress',
    description: 'You are on your way to your destination.',
    tone: 'emerald',
  },
  ride_completed: {
    title: 'Ride completed',
    description: 'You have reached your destination.',
    tone: 'emerald',
  },
  cancelled: {
    title: 'Ride cancelled',
    description: 'This ride has been cancelled.',
    tone: 'red',
  },
}

export const TRACKING_STEPS = [
  { status: 'requested', label: 'Finding driver' },
  { status: 'driver_assigned', label: 'Driver assigned' },
  { status: 'driver_arriving', label: 'Driver arriving' },
  { status: 'ride_started', label: 'On the way' },
  { status: 'ride_completed', label: 'Completed' },
]
