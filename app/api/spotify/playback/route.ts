import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  getUserAccessToken,
  startPlayback,
  pausePlayback,
  skipToNext,
  skipToPrevious,
  getPlaybackState,
  setVolume,
  seekToPosition,
  getAvailableDevices,
  transferPlayback,
  checkUserSubscription,
  SpotifySubscriptionType,
} from "@/lib/spotify"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get("action")

    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has premium
    const subscriptionType = await checkUserSubscription(session.user.id)

    if (subscriptionType !== SpotifySubscriptionType.PREMIUM) {
      return NextResponse.json(
        {
          error: "Premium required",
          message: "This feature requires Spotify Premium",
        },
        { status: 403 },
      )
    }

    const accessToken = await getUserAccessToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json({ error: "Not connected to Spotify" }, { status: 401 })
    }

    // Get current playback state
    if (action === "state") {
      const state = await getPlaybackState(accessToken)
      return NextResponse.json({ state })
    }

    // Get available devices
    if (action === "devices") {
      const devices = await getAvailableDevices(accessToken)
      return NextResponse.json({ devices })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in playback API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has premium
    const subscriptionType = await checkUserSubscription(session.user.id)

    if (subscriptionType !== SpotifySubscriptionType.PREMIUM) {
      return NextResponse.json(
        {
          error: "Premium required",
          message: "This feature requires Spotify Premium",
        },
        { status: 403 },
      )
    }

    const accessToken = await getUserAccessToken(session.user.id)

    if (!accessToken) {
      return NextResponse.json({ error: "Not connected to Spotify" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Start/resume playback
    if (action === "play") {
      const { context_uri, uris, offset, position_ms } = body
      const success = await startPlayback(accessToken, { context_uri, uris, offset, position_ms })
      return NextResponse.json({ success })
    }

    // Pause playback
    if (action === "pause") {
      const success = await pausePlayback(accessToken)
      return NextResponse.json({ success })
    }

    // Skip to next track
    if (action === "next") {
      const success = await skipToNext(accessToken)
      return NextResponse.json({ success })
    }

    // Skip to previous track
    if (action === "previous") {
      const success = await skipToPrevious(accessToken)
      return NextResponse.json({ success })
    }

    // Set volume
    if (action === "volume") {
      const { volume_percent } = body
      const success = await setVolume(accessToken, volume_percent)
      return NextResponse.json({ success })
    }

    // Seek to position
    if (action === "seek") {
      const { position_ms } = body
      const success = await seekToPosition(accessToken, position_ms)
      return NextResponse.json({ success })
    }

    // Transfer playback
    if (action === "transfer") {
      const { device_id, play } = body
      const success = await transferPlayback(accessToken, device_id, play)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in playback API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
