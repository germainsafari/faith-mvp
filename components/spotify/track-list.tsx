"use client"

import { useSpotify } from "@/providers/spotify-provider"
import { Button } from "@/components/ui/button"
import { Play, Pause, Heart } from "lucide-react"
import { useState } from "react"

interface Track {
  id: string
  name: string
  uri?: string
  artists?: { name: string }[]
  duration_ms?: number
  album?: {
    name: string
    images?: { url: string }[]
  }
  external_urls?: { spotify?: string }
}

interface TrackListProps {
  tracks: Track[]
  onOpenInSpotify?: (track: Track) => void
}

export function TrackList({ tracks, onOpenInSpotify }: TrackListProps) {
  const { isPremium, isPlaying, currentTrack, playTrack, pausePlayback, resumePlayback } = useSpotify()

  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({})

  // Format duration from milliseconds to MM:SS
  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00"
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Check if a track is currently playing
  const isTrackPlaying = (track: Track) => {
    if (!isPlaying || !currentTrack || !track.uri) return false
    return currentTrack.uri === track.uri
  }

  // Handle play/pause for a track
  const handlePlayPause = (track: Track) => {
    if (!isPremium || !track.uri) return

    if (isTrackPlaying(track)) {
      pausePlayback()
    } else {
      playTrack(track.uri)
    }
  }

  // Toggle like for a track
  const toggleLike = (trackId: string) => {
    setLikedTracks((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }))
  }

  // Open track in Spotify
  const handleOpenInSpotify = (track: Track) => {
    if (onOpenInSpotify) {
      onOpenInSpotify(track)
    } else if (track.external_urls?.spotify) {
      window.open(track.external_urls.spotify, "_blank")
    }
  }

  if (!tracks.length) {
    return (
      <div className="py-12 text-center">
        <p>No tracks available.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <ul>
        {tracks.map((track) => (
          <li
            key={track.id}
            className={`py-3 px-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 ${
              isTrackPlaying(track) ? "bg-gray-100" : ""
            }`}
          >
            <div className="flex items-center flex-1">
              {isPremium && track.uri && (
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => handlePlayPause(track)}>
                  {isTrackPlaying(track) ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{track.name}</div>
                <div className="text-sm text-gray-500 truncate">
                  {track.artists ? track.artists.map((a) => a.name).join(", ") : "Unknown Artist"}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleLike(track.id)}
                className={likedTracks[track.id] ? "text-red-500" : "text-gray-400"}
              >
                <Heart className="h-4 w-4" />
              </Button>

              <span className="text-gray-500 text-sm w-12 text-right">{formatDuration(track.duration_ms)}</span>

              <Button variant="ghost" size="sm" className="ml-2 text-xs" onClick={() => handleOpenInSpotify(track)}>
                Open
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
