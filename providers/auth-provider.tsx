"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setSession(session)
        setUser(session?.user ?? null)

        // Log session details for debugging
        if (session) {
          console.log("Session found:", {
            userId: session.user.id,
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            currentTime: new Date().toISOString(),
          })
        } else {
          console.log("No session found")
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Set up the auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (session) {
        console.log("New session:", {
          userId: session.user.id,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          currentTime: new Date().toISOString(),
        })
      }

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      // Force a page reload to clear any cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const refreshSession = async () => {
    try {
      console.log("Attempting to refresh session...")

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Error refreshing session:", error)
        return false
      }

      if (data.session) {
        console.log("Session refreshed successfully:", {
          userId: data.session.user.id,
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
          currentTime: new Date().toISOString(),
        })

        setSession(data.session)
        setUser(data.session.user)
        return true
      }

      return false
    } catch (error) {
      console.error("Exception refreshing session:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
