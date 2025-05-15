import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const topicId = params.id
    const supabase = createServerSupabaseClient()

    // Call the database function to increment the view count
    const { error } = await supabase.rpc("increment_topic_view_count", { topic_id: topicId })

    if (error) {
      console.error("Error incrementing view count:", error)
      return NextResponse.json({ error: "Failed to update view count" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating view count:", error)
    return NextResponse.json({ error: "Failed to update view count" }, { status: 500 })
  }
}
