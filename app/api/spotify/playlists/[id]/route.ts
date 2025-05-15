import { NextResponse } from "next/server"
import { getAccessToken, getPlaylistDetails } from "@/lib/spotify"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const playlistId = params.id

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    // Get an access token
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get Spotify access token" }, { status: 500 })
    }

    const playlist = await getPlaylistDetails(accessToken, playlistId)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}
