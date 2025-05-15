import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Generate a random string for the state parameter
function generateRandomString(length: number) {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Generate a random state value
    const state = generateRandomString(16)

    // Store the state in the session for verification later
    await supabase.from("user_sessions").upsert({
      user_id: session.user.id,
      spotify_auth_state: state,
      updated_at: new Date().toISOString(),
    })

    // Define the scopes we need
    const scope = [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative",
      "user-library-read",
      "streaming",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
    ].join(" ")

    // Create the authorization URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      scope,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/spotify/callback`,
      state,
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Error generating Spotify auth URL:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}
