"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAuth } from "@/providers/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createSpotifyPlayer } from "@/utils/spotify-sdk-loader"

// Define types
export type SpotifySubscriptionType = "free" | "premium"

interface SpotifyContextType {
  isConnected: boolean
  isPremium: boolean
  isLoading: boolean
  connectSpotify: () => Promise<void>
  disconnectSpotify: () => Promise<void>
  player: Spotify.Player | null
  deviceId: string | null
  currentTrack: Spotify.Track | null
  isPlaying: boolean
  playbackState: Spotify.PlaybackState | null
  playTrack: (uri: string) => Promise<boolean>
  playContext: (contextUri: string, offset?: number) => Promise<boolean>
  pausePlayback: () => Promise<boolean>
  resumePlayback: () => Promise<boolean>
  nextTrack: () => Promise<boolean>
  previousTrack: () => Promise<boolean>
  seekToPosition: (positionMs: number) => Promise<boolean>
  setVolume: (volumePercent: number) => Promise<boolean>
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

// Declare Spotify global type to prevent Typescript errors
declare global {
  interface Window {
    Spotify: any
  }
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isConnected, setIsConnected] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackState, setPlaybackState] = useState<Spotify.PlaybackState | null>(null)

  // Check if user is connected to Spotify
  useEffect(() => {
    async function checkSpotifyConnection() {
      if (!user) {
        setIsConnected(false)
        setIsPremium(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/spotify/status")
        const data = await response.json()

        setIsConnected(data.connected)
        setIsPremium(data.isPremium)

        if (data.connected && data.isPremium && data.accessToken) {
          setAccessToken(data.accessToken)
        }
      } catch (error) {
        console.error("Error checking Spotify connection:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSpotifyConnection()
  }, [user])

  // Initialize Spotify player when we have an access token and premium
  useEffect(() => {
    if (!accessToken || !isPremium) {
      return
    }

    let spotifyPlayer: Spotify.Player | null = null

    async function initializePlayer() {
      try {
        spotifyPlayer = await createSpotifyPlayer(accessToken, "Faith+ Web Player")

        // Ready
        spotifyPlayer.addListener("ready", ({ device_id }) => {
          console.log("Spotify player ready with device ID", device_id)
          setDeviceId(device_id)
          setPlayer(spotifyPlayer)
        })

        // Not Ready
        spotifyPlayer.addListener("not_ready", ({ device_id }) => {
          console.log("Device ID has gone offline", device_id)
          setDeviceId(null)
        })

        // Player State Changed
        spotifyPlayer.addListener("player_state_changed", (state) => {
          if (!state) return

          setCurrentTrack(state.track_window.current_track)
          setIsPlaying(!state.paused)
          setPlaybackState(state)
        })
      } catch (error) {
        console.error("Error initializing Spotify player:", error)
        toast({
          title: "Spotify Player Error",
          description: "Failed to initialize Spotify player. Please try again.",
          variant: "destructive",
        })
      }
    }

    initializePlayer()

    return () => {
      if (spotifyPlayer) {
        spotifyPlayer.disconnect()
      }
    }
  }, [accessToken, isPremium, toast])

  // Connect to Spotify
  const connectSpotify = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect with Spotify.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

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
      setIsLoading(false)
    }
  }, [user, toast])

  // Disconnect from Spotify
  const disconnectSpotify = useCallback(async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/spotify/disconnect", {
        method: "POST",
      })

      if (response.ok) {
        setIsConnected(false)
        setIsPremium(false)
        setAccessToken(null)
        setPlayer(null)
        setDeviceId(null)
        setCurrentTrack(null)
        setIsPlaying(false)
        setPlaybackState(null)

        toast({
          title: "Disconnected",
          description: "Successfully disconnected from Spotify.",
        })
      } else {
        throw new Error("Failed to disconnect from Spotify")
      }
    } catch (error) {
      console.error("Error disconnecting from Spotify:", error)
      toast({
        title: "Disconnection Error",
        description: "Failed to disconnect from Spotify. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  // Play a track
  const playTrack = useCallback(
    async (uri: string) => {
      if (!accessToken || !deviceId) return false

      try {
        const response = await fetch("/api/spotify/playback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "play",
            uris: [uri],
            device_id: deviceId,
          }),
        })

        const data = await response.json()
        return data.success
      } catch (error) {
        console.error("Error playing track:", error)
        return false
      }
    },
    [accessToken, deviceId],
  )

  // Play a context (album, playlist, etc.)
  const playContext = useCallback(
    async (contextUri: string, offset = 0) => {
      if (!accessToken || !deviceId) return false

      try {
        const response = await fetch("/api/spotify/playback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "play",
            context_uri: contextUri,
            offset: { position: offset },
            device_id: deviceId,
          }),
        })

        const data = await response.json()
        return data.success
      } catch (error) {
        console.error("Error playing context:", error)
        return false
      }
    },
    [accessToken, deviceId],
  )

  // Pause playback
  const pausePlayback = useCallback(async () => {
    if (!accessToken) return false

    try {
      const response = await fetch("/api/spotify/playback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "pause",
        }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error pausing playback:", error)
      return false
    }
  }, [accessToken])

  // Resume playback
  const resumePlayback = useCallback(async () => {
    if (!accessToken) return false

    try {
      const response = await fetch("/api/spotify/playback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "play",
        }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error resuming playback:", error)
      return false
    }
  }, [accessToken])

  // Skip to next track
  const nextTrack = useCallback(async () => {
    if (!accessToken) return false

    try {
      const response = await fetch("/api/spotify/playback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "next",
        }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error skipping to next track:", error)
      return false
    }
  }, [accessToken])

  // Skip to previous track
  const previousTrack = useCallback(async () => {
    if (!accessToken) return false

    try {
      const response = await fetch("/api/spotify/playback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "previous",
        }),
      })

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error skipping to previous track:", error)
      return false
    }
  }, [accessToken])

  // Seek to position
  const seekToPosition = useCallback(
    async (positionMs: number) => {
      if (!accessToken) return false

      try {
        const response = await fetch("/api/spotify/playback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "seek",
            position_ms: positionMs,
          }),
        })

        const data = await response.json()
        return data.success
      } catch (error) {
        console.error("Error seeking to position:", error)
        return false
      }
    },
    [accessToken],
  )

  // Set volume
  const setVolume = useCallback(
    async (volumePercent: number) => {
      if (!accessToken) return false

      try {
        const response = await fetch("/api/spotify/playback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "volume",
            volume_percent: volumePercent,
          }),
        })

        const data = await response.json()
        return data.success
      } catch (error) {
        console.error("Error setting volume:", error)
        return false
      }
    },
    [accessToken],
  )

  const value = {
    isConnected,
    isPremium,
    isLoading,
    connectSpotify,
    disconnectSpotify,
    player,
    deviceId,
    currentTrack,
    isPlaying,
    playbackState,
    playTrack,
    playContext,
    pausePlayback,
    resumePlayback,
    nextTrack,
    previousTrack,
    seekToPosition,
    setVolume,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export function useSpotify() {
  const context = useContext(SpotifyContext)

  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider")
  }

  return context
}
