"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api'

interface User {
  id: string
  username: string
  email: string
  full_name: string | null
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && apiClient.isAuthenticated()

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth, token exists:', apiClient.isAuthenticated());
      
      if (apiClient.isAuthenticated()) {
        try {
          console.log('[AuthContext] Fetching user data...');
          const userData = await apiClient.getCurrentUser()
          console.log('[AuthContext] Got user data:', userData);
          setUser(userData)
        } catch (error: any) {
          // Only log error if it's not a common authentication failure
          if (error.message?.includes('401') || error.message?.includes('User not found')) {
            console.log('[AuthContext] Token expired or user deleted, clearing auth state');
          } else {
            console.error('Failed to load user data:', error)
          }
          // Clear invalid token
          apiClient.clearToken()
          setUser(null)
        }
      }
      setIsLoading(false)
      console.log('[AuthContext] Auth initialization complete');
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      console.log('[AuthContext] Logging in...');
      const response = await apiClient.login(username, password)
      console.log('[AuthContext] Login successful, setting user:', response.user);
      setUser(response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = async (credential: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.googleLogin(credential)
      setUser(response.user)
    } catch (error) {
      console.error('Google login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
      // Redirect to login page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const refreshUser = async () => {
    if (apiClient.isAuthenticated()) {
      try {
        const userData = await apiClient.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Failed to refresh user data:', error)
        // Clear invalid token and logout
        apiClient.clearToken()
        setUser(null)
      }
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    googleLogin,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}