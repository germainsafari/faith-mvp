"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSpotify } from "@/providers/spotify-provider"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PlaylistCardProps {
  playlist: {
    id: string
    name: string
    description?: string
    images?: { url: string }[]
    uri?: string
    external_urls?: { spotify?: string }
    tracks?: { total?: number }
  }
  onSelect: (playlist: any) => void
}

export function PlaylistCard({ playlist, onSelect }: PlaylistCardProps) {
  const { isPremium, isPlaying, currentTrack, playbackState, playContext, pausePlayback } = useSpotify()
  const [isHovered, setIsHovered] = useState(false)

  // Check if this playlist is currently playing
  const isThisPlaylistPlaying = () => {
    if (!isPlaying || !playbackState || !playlist.uri) return false

    // Extract the playlist ID from the context URI
    const contextUri = playbackState.context?.uri
    if (!contextUri) return false

    return contextUri === playlist.uri
  }

  const playlistIsPlaying = isThisPlaylistPlaying()

  // Handle play/pause
  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isPremium || !playlist.uri) return

    if (playlistIsPlaying) {
      pausePlayback()
    } else {
      playContext(playlist.uri)
    }
  }

  // Open in Spotify
  const openInSpotify = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (playlist.external_urls?.spotify) {
      window.open(playlist.external_urls.spotify, "_blank")
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
      onClick={() => onSelect(playlist)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
        {playlist.description && <CardDescription className="line-clamp-2">{playlist.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative">
          <img
            src={(playlist.images && playlist.images[0]?.url) || "/placeholder.svg?height=200&width=200&query=music"}
            alt={playlist.name}
            className="rounded-md w-full aspect-square object-cover"
          />

          {isPremium && playlist.uri && (
            <div
              className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity rounded-md ${
                isHovered || playlistIsPlaying ? "opacity-100" : "opacity-0"
              }`}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handlePlayPause}
              >
                {playlistIsPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-500">{playlist.tracks?.total || 0} tracks</div>

          {playlist.external_urls?.spotify && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={openInSpotify}>
              Open in Spotify
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
