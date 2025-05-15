import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the existing post to verify ownership
    const { data: existingPost, error: fetchError } = await supabase
      .from("community_posts")
      .select('user_id")d')
      .eq("id", postId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Verify ownership
    if (existingPost.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this post" }, { status: 403 })
    }

    const { content } = await request.json()

    // Update the post
    const { data: post, error } = await supabase
      .from("community_posts")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const postId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the existing post to verify ownership
    const { data: existingPost, error: fetchError } = await supabase
      .from("community_posts")
      .select("user_id")
      .eq("id", postId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Verify ownership
    if (existingPost.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this post" }, { status: 403 })
    }

    // Delete the post
    const { error } = await supabase.from("community_posts").delete().eq("id", postId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
