import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    // Handle error from Spotify
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?error=${error}`,
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?error=missing_params`,
      )
    }

    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/sign-in?redirect=/features/worship-music`,
      )
    }

    // Verify the state parameter
    const { data: sessionData } = await supabase
      .from("user_sessions")
      .select("spotify_auth_state")
      .eq("user_id", session.user.id)
      .single()

    if (!sessionData || sessionData.spotify_auth_state !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?error=invalid_state`,
      )
    }

    // Exchange the code for an access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/spotify/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Error exchanging code for token:", tokenData.error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?error=token_exchange_failed`,
      )
    }

    // Calculate when the token expires
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    // Get user profile to check subscription type
    const userProfileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userProfile = await userProfileResponse.json()
    const subscriptionType = userProfile.product || "free"
    const accountType = userProfile.type || "user"

    // Store the tokens in the database
    await supabase.from("user_spotify_tokens").upsert({
      user_id: session.user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      subscription_type: subscriptionType,
      account_type: accountType,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Clear the state from the session
    await supabase.from("user_sessions").update({ spotify_auth_state: null }).eq("user_id", session.user.id)

    // Redirect back to the worship music page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?connected=true&premium=${subscriptionType === "premium"}`,
    )
  } catch (error) {
    console.error("Error in Spotify callback:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/features/worship-music?error=server_error`,
    )
  }
}
