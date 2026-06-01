"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'staff' | 'customer'
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]))
          const decodedUser: User = {
            id: payload.userId,
            email: payload.email,
            first_name: payload.email.split('@')[0],
            last_name: '',
            role: payload.role,
            is_active: true,
            created_at: new Date().toISOString(),
          }
          setUser(decodedUser)

          try {
            const res = await fetch('/api/auth', {
              headers: { Authorization: `Bearer ${storedToken}` }
            })
            const data = await res.json()
            if (!data.user) {
              setUser(null)
              setToken(null)
              localStorage.removeItem('token')
            }
          } catch {
            setUser(null)
            setToken(null)
            localStorage.removeItem('token')
          }
        } catch {
          setUser(null)
          setToken(null)
          localStorage.removeItem('token')
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('token', data.token)
  }

  const logout = async () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    try {
      await fetch('/api/auth', { method: 'DELETE' })
    } catch {
      // Ignore
    }
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}