"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { setServerSession, clearServerSession } from "@/lib/auth-cookies"
import { logger } from "@/lib/logger"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Changed from true to false
  const [isHydrated, setIsHydrated] = useState(false) // Add this new state

  const refreshSession = async () => {
    try {
      logger.info("Refreshing auth session")
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        logger.error("Error refreshing session:", error)
        clearServerSession()
        setSession(null)
        setUser(null)
        return
      }

      if (data.session) {
        logger.info("Session refreshed successfully", {
          userId: data.session.user.id,
          email: data.session.user.email,
        })
        await setServerSession()
        setSession(data.session)
        setUser(data.session.user)
      } else {
        logger.warn("No session after refresh")
        clearServerSession()
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      logger.error("Unexpected error during session refresh:", error)
      clearServerSession()
      setSession(null)
      setUser(null)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      logger.info("AuthProvider: Initializing and checking session")
      try {
        setIsLoading(true)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error("AuthProvider: Error getting session", error)
          clearServerSession()
          setSession(null)
          setUser(null)
          setIsLoading(false)
          return
        }

        if (session) {
          logger.info("AuthProvider: Session found", {
            userId: session.user?.id,
            email: session.user?.email,
            expiresAt: session.expires_at,
          })

          // Set our custom cookie
          await setServerSession()
          setSession(session)
          setUser(session.user)
        } else {
          logger.info("AuthProvider: No session found")
          clearServerSession()
          setSession(null)
          setUser(null)
        }
      } catch (e) {
        logger.error("AuthProvider: Unexpected error during initialization", e)
        clearServerSession()
        setSession(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info("AuthProvider: Auth state changed", {
        event,
        userId: session?.user?.id,
        authenticated: !!session,
      })

      if (session) {
        await setServerSession()
        setSession(session)
        setUser(session.user)
      } else {
        clearServerSession()
        setSession(null)
        setUser(null)
      }
    })

    return () => {
      logger.info("AuthProvider: Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [])

  // Add this useEffect after the existing one
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const signOut = async () => {
    logger.info("AuthProvider: Signing out user")
    try {
      await supabase.auth.signOut()
      clearServerSession()
      logger.info("AuthProvider: User signed out successfully")
      setSession(null)
      setUser(null)
      router.push("/auth/signin")
    } catch (error) {
      logger.error("AuthProvider: Error signing out", error)
    }
  }

  const value = {
    user,
    session,
    isLoading: isLoading || !isHydrated, // Modified this line
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
