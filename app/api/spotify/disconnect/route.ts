import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Delete the user's Spotify tokens
    const { error } = await supabase.from("user_spotify_tokens").delete().eq("user_id", session.user.id)

    if (error) {
      console.error("Error deleting Spotify tokens:", error)
      return NextResponse.json({ error: "Failed to disconnect from Spotify" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting from Spotify:", error)
    return NextResponse.json({ error: "Failed to disconnect from Spotify" }, { status: 500 })
  }
}
