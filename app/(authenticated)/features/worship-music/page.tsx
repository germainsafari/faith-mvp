"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Music } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"
import { useSpotify } from "@/providers/spotify-provider"
import { SpotifyConnectionStatus } from "@/components/spotify/connection-status"
import { PlaylistCard } from "@/components/spotify/playlist-card"
import { TrackList } from "@/components/spotify/track-list"
import { PremiumPlayer } from "@/components/spotify/premium-player"

interface Playlist {
  id: string
  name: string
  description: string
  images: { url: string }[]
  uri: string
  tracks: {
    total: number
    items?: {
      track: Track
    }[]
  }
  external_urls: {
    spotify: string
  }
}

interface Track {
  id: string
  name: string
  uri: string
  artists: { name: string }[]
  duration_ms: number
  album: {
    name: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

// Sample playlists for when Spotify is not connected
const SAMPLE_PLAYLISTS = [
  {
    id: "worship-favorites",
    name: "Worship Favorites",
    description: "Popular contemporary worship songs to lift your spirit",
    images: [{ url: "/uplifting-worship.png" }],
    tracks: { total: 5 },
  },
  {
    id: "peaceful-worship",
    name: "Peaceful Worship",
    description: "Calm and reflective worship songs for prayer and meditation",
    images: [{ url: "/peaceful-worship.png" }],
    tracks: { total: 5 },
  },
  {
    id: "gospel-classics",
    name: "Gospel Classics",
    description: "Timeless gospel songs that have inspired generations",
    images: [{ url: "/gospel-music-scene.png" }],
    tracks: { total: 5 },
  },
]

export default function WorshipMusicPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { isConnected, isPremium } = useSpotify()

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("featured")

  // Fetch playlists based on connection status
  useEffect(() => {
    async function fetchPlaylists() {
      setLoading(true)

      if (!isConnected) {
        // Use sample playlists if not connected
        setPlaylists(SAMPLE_PLAYLISTS as Playlist[])
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/spotify/playlists?type=${activeTab}`)
        const data = await response.json()

        if (data.playlists) {
          setPlaylists(data.playlists)
        }
      } catch (error) {
        console.error("Error fetching playlists:", error)
        toast({
          title: "Error",
          description: "Failed to load playlists. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [activeTab, isConnected, toast])

  // Fetch playlist details when a playlist is selected
  useEffect(() => {
    if (!selectedPlaylist?.id || !isConnected) return

    async function fetchPlaylistDetails() {
      try {
        const response = await fetch(`/api/spotify/playlists/${selectedPlaylist.id}`)
        const data = await response.json()

        if (data.playlist) {
          setSelectedPlaylist(data.playlist)

          // Extract tracks from the playlist
          const tracks = data.playlist.tracks.items?.map((item: any) => item.track) || []
          setPlaylistTracks(tracks)
        }
      } catch (error) {
        console.error("Error fetching playlist details:", error)
        toast({
          title: "Error",
          description: "Failed to load playlist details. Please try again later.",
          variant: "destructive",
        })
      }
    }

    fetchPlaylistDetails()
  }, [selectedPlaylist?.id, isConnected, toast])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (playlist.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container py-10 pb-24">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Worship Music</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Input
            type="search"
            placeholder="Search playlists..."
            className="max-w-md"
            value={searchQuery}
            onChange={handleSearch}
          />
          <SpotifyConnectionStatus />
        </div>
      </div>

      <Tabs defaultValue="featured" className="w-full">
        <TabsList>
          <TabsTrigger value="featured" onClick={() => setActiveTab("featured")}>
            Featured
          </TabsTrigger>
          <TabsTrigger value="worship" onClick={() => setActiveTab("worship")}>
            Worship
          </TabsTrigger>
          {isConnected && (
            <TabsTrigger value="my-playlists" onClick={() => setActiveTab("my-playlists")}>
              My Playlists
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="featured" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlaylists.length > 0 ? (
                filteredPlaylists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} onSelect={setSelectedPlaylist} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p>No playlists found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="worship" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlaylists.length > 0 ? (
                filteredPlaylists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} onSelect={setSelectedPlaylist} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p>No playlists found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-playlists" className="mt-4">
          {isConnected ? (
            loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlaylists.length > 0 ? (
                  filteredPlaylists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} onSelect={setSelectedPlaylist} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p>No playlists found. Try a different search term.</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <p>Connect your Spotify account to view your playlists.</p>
              <SpotifyConnectionStatus />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedPlaylist && (
        <div className="mt-8">
          <div className="flex flex-col md:flex-row gap-4 items-start mb-6">
            <img
              src={
                (selectedPlaylist.images && selectedPlaylist.images[0]?.url) ||
                "/placeholder.svg?height=200&width=200&query=music"
              }
              alt={selectedPlaylist.name || "Playlist"}
              className="rounded-md w-full max-w-[200px] aspect-square object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold">{selectedPlaylist.name}</h2>
              <p className="text-gray-500 mt-1">{selectedPlaylist.description}</p>
              <p className="text-sm mt-2">{selectedPlaylist.tracks?.total || 0} tracks</p>
              <div className="mt-4 flex gap-2">
                {selectedPlaylist.external_urls?.spotify && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedPlaylist.external_urls.spotify, "_blank")}
                  >
                    Open in Spotify
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedPlaylist(null)}>
                  Back to Playlists
                </Button>
              </div>
            </div>
          </div>

          {isConnected ? (
            <TrackList tracks={playlistTracks} />
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <Music className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Connect to Spotify</h3>
                  <p className="text-gray-500 mb-4">
                    Connect your Spotify account to listen to this playlist and access millions of songs.
                  </p>
                  <SpotifyConnectionStatus />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Premium Player */}
      <PremiumPlayer />
    </div>
  )
}
