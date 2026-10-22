// ======================================================
// RIDE CONSTANTS
//
// One place for ride statuses and labels, so the tracking
// page, the history page and anything else stay in sync
// with the backend Ride model.
// ======================================================

// Statuses where the ride is still in progress (the page keeps updating)
export const ACTIVE_RIDE_STATUSES = [
  'requested',
  'driver_assigned',
  'driver_arriving',
  'ride_started',
]

// Statuses where the passenger may still cancel (matches the backend)
export const CANCELLABLE_RIDE_STATUSES = ['requested', 'driver_assigned', 'driver_arriving']

// Steps shown in the progress bar, in order
export const TRACKING_STEPS = [
  { status: 'requested', label: 'Requested' },
  { status: 'driver_assigned', label: 'Driver assigned' },
  { status: 'driver_arriving', label: 'On the way' },
  { status: 'ride_started', label: 'In ride' },
  { status: 'ride_completed', label: 'Completed' },
]

// tone: amber | blue | emerald | red  (colors are mapped in the page)
export const RIDE_STATUS_META = {
  requested: {
    label: 'Finding a driver',
    title: 'Finding you a driver',
    description: 'We sent your request to nearby drivers. This usually takes a few minutes.',
    tone: 'amber',
  },
  driver_assigned: {
    label: 'Driver assigned',
    title: 'Driver assigned',
    description: 'A driver accepted your ride and will head to your pickup point soon.',
    tone: 'blue',
  },
  driver_arriving: {
    label: 'Driver on the way',
    title: 'Your driver is on the way',
    description: 'Please be ready at your pickup location.',
    tone: 'blue',
  },
  ride_started: {
    label: 'Ride in progress',
    title: 'Ride in progress',
    description: 'You are on your way to the destination.',
    tone: 'emerald',
  },
  ride_completed: {
    label: 'Completed',
    title: 'Ride completed',
    description: 'You have reached your destination. Thank you for riding with us!',
    tone: 'emerald',
  },
  cancelled: {
    label: 'Cancelled',
    title: 'Ride cancelled',
    description: 'This ride was cancelled.',
    tone: 'red',
  },
}

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
  stripe: 'Stripe',
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}
