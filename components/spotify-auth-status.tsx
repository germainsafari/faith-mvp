"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"

interface SpotifyAuthStatusProps {
  onStatusChange?: (connected: boolean) => void
}

export function SpotifyAuthStatus({ onStatusChange }: SpotifyAuthStatusProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/spotify/status")
        const data = await response.json()

        setIsConnected(data.connected)

        if (onStatusChange) {
          onStatusChange(data.connected)
        }
      } catch (error) {
        console.error("Error checking Spotify status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()
  }, [user, onStatusChange])

  const connectSpotify = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect with Spotify.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const response = await fetch("/api/spotify/auth")
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Failed to get authorization URL")
      }
    } catch (error) {
      console.error("Error connecting to Spotify:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to Spotify. Please try again later.",
        variant: "destructive",
      })
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (isConnected) {
    return (
      <Button variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Connected to Spotify
      </Button>
    )
  }

  return (
    <Button onClick={connectSpotify} disabled={isConnecting}>
      {isConnecting ? (
        <>
          Connecting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </>
      ) : (
        "Connect Spotify"
      )}
    </Button>
  )
}
