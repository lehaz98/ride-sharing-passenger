import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { loginPassenger, registerPassenger } from '../services/authService'

const AuthContext = createContext(null)

const getPayload = (response) => response?.data ?? response

const getUser = (response) => {
  const payload = getPayload(response)
  return payload?.user ?? payload?.passenger ?? null
}

const getToken = (response) => {
  const payload = getPayload(response)
  return payload?.token ?? payload?.accessToken ?? null
}

const isPassengerAccount = (user) => {
  return user && ['user', 'passenger'].includes(user.role)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('passengerUser')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      localStorage.removeItem('passengerUser')
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('passengerToken') || '')

  const [loading, setLoading] = useState(false)

  const saveSession = useCallback((response) => {
    const nextToken = getToken(response)
    const nextUser = getUser(response)

    if (!nextToken || !nextUser) {
      throw new Error('Authentication response did not include a token and user.')
    }

    if (!isPassengerAccount(nextUser)) {
      throw new Error('This account is not a passenger account.')
    }

    localStorage.setItem('passengerToken', nextToken)
    localStorage.setItem('passengerUser', JSON.stringify(nextUser))

    setToken(nextToken)
    setUser(nextUser)

    return nextUser
  }, [])

  const login = useCallback(
    async (credentials) => {
      setLoading(true)

      try {
        const response = await loginPassenger(credentials)
        return saveSession(response)
      } finally {
        setLoading(false)
      }
    },
    [saveSession]
  )

  const register = useCallback(
    async (userData) => {
      setLoading(true)

      try {
        const response = await registerPassenger(userData)
        const nextToken = getToken(response)
        const nextUser = getUser(response)

        // Some APIs create the account without logging in.
        if (nextToken && nextUser) {
          saveSession(response)
        }

        return response
      } finally {
        setLoading(false)
      }
    },
    [saveSession]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('passengerToken')
    localStorage.removeItem('passengerUser')
    setToken('')
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token || !user || !isPassengerAccount(user)) {
      if (token || user) {
        localStorage.removeItem('passengerToken')
        localStorage.removeItem('passengerUser')
        setToken('')
        setUser(null)
      }
    }
  }, [token, user])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
