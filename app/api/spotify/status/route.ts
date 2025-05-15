import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserAccessToken, checkUserSubscription, SpotifySubscriptionType } from "@/lib/spotify"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ connected: false, authenticated: false })
    }

    // Check if the user has Spotify tokens
    const { data, error } = await supabase
      .from("user_spotify_tokens")
      .select("refresh_token, expires_at, subscription_type")
      .eq("user_id", session.user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ connected: false, authenticated: true })
    }

    // Check if user has premium
    const subscriptionType = await checkUserSubscription(session.user.id)
    const isPremium = subscriptionType === SpotifySubscriptionType.PREMIUM

    // Get access token for premium users
    let accessToken = null
    if (isPremium) {
      accessToken = await getUserAccessToken(session.user.id)
    }

    return NextResponse.json({
      connected: true,
      authenticated: true,
      isPremium,
      expiresAt: data.expires_at,
      accessToken,
    })
  } catch (error) {
    console.error("Error checking Spotify connection status:", error)
    return NextResponse.json({ error: "Failed to check connection status" }, { status: 500 })
  }
}
