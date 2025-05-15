import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Check if the user has already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from("community_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("post_id", postId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned" which is expected if the user hasn't liked the post
      console.error("Error checking existing like:", checkError)
      throw checkError
    }

    if (existingLike) {
      return NextResponse.json({ error: "You have already liked this post" }, { status: 400 })
    }

    // Add the like
    const { data: like, error } = await supabase
      .from("community_likes")
      .insert({
        user_id: session.user.id,
        post_id: postId,
      })
      .select()

    if (error) {
      console.error("Error adding like:", error)
      throw error
    }

    // Increment the likes count on the post
    const { error: updateError } = await supabase.rpc("increment_post_likes_count", { post_id: postId })

    if (updateError) {
      console.error("Error incrementing likes count:", updateError)
      // Continue anyway, as the like was added
    }

    return NextResponse.json({
      success: true,
      like: like && like[0] ? like[0] : null,
    })
  } catch (error) {
    console.error("Error adding like:", error)
    return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const postId = url.searchParams.get("postId")

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove the like
    const { error } = await supabase
      .from("community_likes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId)

    if (error) {
      console.error("Error removing like:", error)
      throw error
    }

    // Decrement the likes count on the post
    const { error: updateError } = await supabase.rpc("decrement_post_likes_count", { post_id: postId })

    if (updateError) {
      console.error("Error decrementing likes count:", updateError)
      // Continue anyway, as the like was removed
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error removing like:", error)
    return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
  }
}
