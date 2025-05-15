import { NextResponse } from "next/server"
import { getAccessToken, getFeaturedPlaylists, getWorshipPlaylists } from "@/lib/spotify"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || "featured"

    // Get an access token
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get Spotify access token" }, { status: 500 })
    }

    let playlists = []

    if (type === "worship") {
      playlists = await getWorshipPlaylists(accessToken)
    } else {
      playlists = await getFeaturedPlaylists(accessToken)
    }

    return NextResponse.json({ playlists })
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}
