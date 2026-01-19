import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Demo password
const DEMO_PASSWORD = 'nomi2026'
const AUTH_KEY = 'nomi_auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session in localStorage
    const savedAuth = localStorage.getItem(AUTH_KEY)
    if (savedAuth) {
      setUser(JSON.parse(savedAuth))
    }
    setLoading(false)
  }, [])

  const signIn = async (password) => {
    if (password === DEMO_PASSWORD) {
      const demoUser = { 
        id: 'demo-user', 
        email: 'jessie@nomi.studio',
        name: 'Jessie'
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    } else {
      throw new Error('Invalid password')
    }
  }

  const signOut = async () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
