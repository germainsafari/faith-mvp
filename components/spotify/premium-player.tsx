"use client"

import { useState, useEffect, useRef } from "react"
import { useSpotify } from "@/providers/spotify-provider"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from "lucide-react"

export function PremiumPlayer() {
  const {
    isPremium,
    isConnected,
    currentTrack,
    isPlaying,
    playbackState,
    pausePlayback,
    resumePlayback,
    nextTrack,
    previousTrack,
    seekToPosition,
    setVolume,
  } = useSpotify()

  const [volume, setVolumeState] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Update progress and duration when playback state changes
  useEffect(() => {
    if (playbackState) {
      setProgress(playbackState.position)
      setDuration(playbackState.duration)

      // Clear existing interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      // If playing, start interval to update progress
      if (isPlaying) {
        const startTime = Date.now()
        const startPosition = playbackState.position

        progressInterval.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const newPosition = startPosition + elapsed

          if (newPosition < playbackState.duration) {
            setProgress(newPosition)
          } else {
            // If we've reached the end, clear interval
            if (progressInterval.current) {
              clearInterval(progressInterval.current)
            }
          }
        }, 1000)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [playbackState, isPlaying])

  // Format time in MM:SS
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolumeState(newVolume)
    setVolume(newVolume)

    if (isMuted && newVolume > 0) {
      setIsMuted(false)
    }
  }

  // Handle mute toggle
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(volume)
    } else {
      setIsMuted(true)
      setVolume(0)
    }
  }

  // Handle seek
  const handleSeek = (value: number[]) => {
    const position = value[0]
    setProgress(position)
    seekToPosition(position)
  }

  // If not premium or not connected, don't render
  if (!isPremium || !isConnected) {
    return null
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-background">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center">
            {currentTrack ? (
              <>
                {currentTrack.album.images && currentTrack.album.images[0] ? (
                  <img
                    src={currentTrack.album.images[0].url || "/placeholder.svg"}
                    alt={currentTrack.album.name}
                    className="w-12 h-12 mr-3 rounded"
                  />
                ) : (
                  <div className="w-12 h-12 mr-3 rounded bg-gray-200 flex items-center justify-center">
                    <Music className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium line-clamp-1">{currentTrack.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">
                    {currentTrack.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <Music className="mr-2 h-6 w-6" />
                <div className="font-medium">No track playing</div>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex flex-col items-center w-full max-w-md">
            <div className="flex items-center justify-center mb-2">
              <Button variant="ghost" size="icon" onClick={previousTrack} disabled={!currentTrack}>
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={isPlaying ? pausePlayback : resumePlayback}
                disabled={!currentTrack}
                className="mx-2"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={nextTrack} disabled={!currentTrack}>
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 text-right">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration}
                step={1000}
                onValueChange={handleSeek}
                disabled={!currentTrack}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-[100px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
