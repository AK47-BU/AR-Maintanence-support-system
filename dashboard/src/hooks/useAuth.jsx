import { createContext, useContext, useState, useCallback } from 'react'
import { authApi, setToken, clearToken } from '../services/api.js'

// ─────────────────────────────────────────────────
// Auth Context
//
// Provides login/logout and the current user
// to the whole app. Keeps the JWT in memory only.
// ─────────────────────────────────────────────────

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      const data = await authApi.login(email, password)
      setToken(data.data.token)
      setUser(data.data.user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
