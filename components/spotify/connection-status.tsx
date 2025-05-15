"use client"

import { useSpotify } from "@/providers/spotify-provider"
import { Button } from "@/components/ui/button"
import { Loader2, Music } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SpotifyConnectionStatus() {
  const { isConnected, isPremium, isLoading, connectSpotify, disconnectSpotify } = useSpotify()

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="min-w-[180px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking Spotify...
      </Button>
    )
  }

  if (isConnected) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <Badge variant={isPremium ? "default" : "outline"} className="px-3 py-1">
          <Music className="mr-1 h-3 w-3" />
          {isPremium ? "Spotify Premium" : "Spotify Connected"}
        </Badge>
        <Button variant="outline" size="sm" onClick={disconnectSpotify}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connectSpotify}>
      <Music className="mr-2 h-4 w-4" />
      Connect Spotify
    </Button>
  )
}
