"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, LogOut, UserCircle } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthButton() {
  const { user, session, signOut, isLoading, refreshSession } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Check session on mount and refresh if needed
  useEffect(() => {
    const checkSession = async () => {
      if (session) {
        // Check if session is about to expire (within 10 minutes)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // If session expires in less than 10 minutes, refresh it
        if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log("Session expiring soon, refreshing...")
          setIsRefreshing(true)
          await refreshSession()
          setIsRefreshing(false)
        }
      }
    }

    checkSession()
  }, [session, refreshSession])

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      setIsSigningOut(false)
    }
  }

  if (isLoading || isRefreshing) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/sign-in">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium">{user.user_metadata.full_name || user.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/saved" className="cursor-pointer">
            Saved Items
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-500 focus:text-red-500 cursor-pointer"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
