import { createServerSupabaseClient } from "@/lib/supabase/server"

// Spotify API endpoints
const SPOTIFY_API_BASE = "https://api.spotify.com/v1"
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const PLAYER_ENDPOINT = `${SPOTIFY_API_BASE}/me/player`

// Spotify subscription types
export enum SpotifySubscriptionType {
  FREE = "free",
  PREMIUM = "premium",
}

// Get access token using client credentials flow (for non-user-specific operations)
export async function getAccessToken(): Promise<string | null> {
  try {
    const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString(
      "base64",
    )

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    })

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Error getting Spotify access token:", error)
    return null
  }
}

// Get user-specific access token using the stored refresh token
export async function getUserAccessToken(userId: string): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient()

    // Get user's refresh token from database
    const { data, error } = await supabase
      .from("user_spotify_tokens")
      .select("refresh_token, expires_at")
      .eq("user_id", userId)
      .single()

    if (error || !data?.refresh_token) {
      console.error("No refresh token found for user:", userId)
      return null
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = data.expires_at ? new Date(data.expires_at) : null

    // If token is still valid, no need to refresh
    if (expiresAt && expiresAt > now) {
      const { data: tokenData } = await supabase
        .from("user_spotify_tokens")
        .select("access_token")
        .eq("user_id", userId)
        .single()

      if (tokenData?.access_token) {
        return tokenData.access_token
      }
    }

    // Exchange refresh token for access token
    const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString(
      "base64",
    )

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: data.refresh_token,
      }),
      cache: "no-store",
    })

    const tokenData = await response.json()

    if (tokenData.error) {
      console.error("Error refreshing token:", tokenData.error)
      return null
    }

    // Calculate when the token expires
    const expiresIn = tokenData.expires_in || 3600
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresIn)

    // Update the token in the database
    await supabase
      .from("user_spotify_tokens")
      .update({
        access_token: tokenData.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        // If we got a new refresh token, update it
        ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
      })
      .eq("user_id", userId)

    return tokenData.access_token
  } catch (error) {
    console.error("Error refreshing Spotify access token:", error)
    return null
  }
}

// Check if user has Spotify Premium
export async function checkUserSubscription(userId: string): Promise<SpotifySubscriptionType> {
  try {
    const supabase = createServerSupabaseClient()

    // Check if we already have the subscription type stored
    const { data: userData } = await supabase
      .from("user_spotify_tokens")
      .select("subscription_type, last_sync_at")
      .eq("user_id", userId)
      .single()

    // If we have recent data (less than 1 day old), use it
    if (userData?.subscription_type && userData?.last_sync_at) {
      const lastSync = new Date(userData.last_sync_at)
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      if (lastSync > oneDayAgo) {
        return userData.subscription_type as SpotifySubscriptionType
      }
    }

    // Otherwise, fetch from Spotify API
    const accessToken = await getUserAccessToken(userId)

    if (!accessToken) {
      return SpotifySubscriptionType.FREE
    }

    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return SpotifySubscriptionType.FREE
    }

    const userData2 = await response.json()
    const subscriptionType =
      userData2.product === "premium" ? SpotifySubscriptionType.PREMIUM : SpotifySubscriptionType.FREE

    // Update the database with the subscription type
    await supabase
      .from("user_spotify_tokens")
      .update({
        subscription_type: subscriptionType,
        account_type: userData2.type,
        last_sync_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    return subscriptionType
  } catch (error) {
    console.error("Error checking user subscription:", error)
    return SpotifySubscriptionType.FREE
  }
}

// Fetch featured playlists
export async function getFeaturedPlaylists(accessToken: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/browse/featured-playlists?limit=10`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return data.playlists?.items || []
  } catch (error) {
    console.error("Error fetching featured playlists:", error)
    return []
  }
}

// Fetch worship playlists
export async function getWorshipPlaylists(accessToken: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/search?q=worship+christian&type=playlist&limit=10`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return data.playlists?.items || []
  } catch (error) {
    console.error("Error fetching worship playlists:", error)
    return []
  }
}

// Fetch playlist details including tracks
export async function getPlaylistDetails(accessToken: string, playlistId: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    return await response.json()
  } catch (error) {
    console.error(`Error fetching playlist ${playlistId}:`, error)
    return null
  }
}

// Fetch user's playlists
export async function getUserPlaylists(accessToken: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error fetching user playlists:", error)
    return []
  }
}

// Premium user functions - these only work for premium users

// Start/resume playback
export async function startPlayback(
  accessToken: string,
  options: {
    context_uri?: string
    uris?: string[]
    offset?: { position: number } | { uri: string }
    position_ms?: number
  } = {},
) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/play`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (response.status === 204) {
      return true
    }

    const data = await response.json()
    console.error("Error starting playback:", data)
    return false
  } catch (error) {
    console.error("Error starting playback:", error)
    return false
  }
}

// Pause playback
export async function pausePlayback(accessToken: string) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/pause`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.status === 204
  } catch (error) {
    console.error("Error pausing playback:", error)
    return false
  }
}

// Skip to next track
export async function skipToNext(accessToken: string) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/next`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.status === 204
  } catch (error) {
    console.error("Error skipping to next track:", error)
    return false
  }
}

// Skip to previous track
export async function skipToPrevious(accessToken: string) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/previous`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.status === 204
  } catch (error) {
    console.error("Error skipping to previous track:", error)
    return false
  }
}

// Get current playback state
export async function getPlaybackState(accessToken: string) {
  try {
    const response = await fetch(PLAYER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (response.status === 204) {
      return null // No active device
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting playback state:", error)
    return null
  }
}

// Set volume
export async function setVolume(accessToken: string, volumePercent: number) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/volume?volume_percent=${volumePercent}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.status === 204
  } catch (error) {
    console.error("Error setting volume:", error)
    return false
  }
}

// Seek to position
export async function seekToPosition(accessToken: string, positionMs: number) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/seek?position_ms=${positionMs}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.status === 204
  } catch (error) {
    console.error("Error seeking to position:", error)
    return false
  }
}

// Get available devices
export async function getAvailableDevices(accessToken: string) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}/devices`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return data.devices || []
  } catch (error) {
    console.error("Error getting available devices:", error)
    return []
  }
}

// Transfer playback to another device
export async function transferPlayback(accessToken: string, deviceId: string, play = true) {
  try {
    const response = await fetch(`${PLAYER_ENDPOINT}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play,
      }),
    })

    return response.status === 204
  } catch (error) {
    console.error("Error transferring playback:", error)
    return false
  }
}

// Get recently played tracks
export async function getRecentlyPlayed(accessToken: string, limit = 20) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/recently-played?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error getting recently played tracks:", error)
    return []
  }
}

// Save track to user's library
export async function saveTrack(accessToken: string, trackId: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/tracks`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: [trackId],
      }),
    })

    return response.status === 200
  } catch (error) {
    console.error("Error saving track:", error)
    return false
  }
}

// Remove track from user's library
export async function removeTrack(accessToken: string, trackId: string) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/tracks`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: [trackId],
      }),
    })

    return response.status === 200
  } catch (error) {
    console.error("Error removing track:", error)
    return false
  }
}

// Check if tracks are in user's library
export async function checkSavedTracks(accessToken: string, trackIds: string[]) {
  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/tracks/contains?ids=${trackIds.join(",")}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    return await response.json()
  } catch (error) {
    console.error("Error checking saved tracks:", error)
    return trackIds.map(() => false)
  }
}
