import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const topicId = params.id
    const supabase = createServerSupabaseClient()

    // Increment view count using our new function
    const { error: viewError } = await supabase.rpc("increment_topic_view_count", { topic_id: topicId })

    if (viewError) {
      console.error("Error incrementing view count:", viewError)
      // Continue anyway, this shouldn't fail the whole request
    }

    // Get the topic details
    const { data: topic, error: topicError } = await supabase
      .from("community_topics")
      .select(`
        *,
        author:profiles(id, full_name, avatar_url)
      `)
      .eq("id", topicId)
      .single()

    if (topicError) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Get the posts (replies) for this topic
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select(`
        *,
        author:profiles(id, full_name, avatar_url),
        likes:community_likes(user_id)
      `)
      .eq("topic_id", topicId)
      .is("parent_id", null) // Only top-level posts, not replies to posts
      .order("created_at", { ascending: true })

    if (postsError) {
      throw postsError
    }

    // For each post, get its replies
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const { data: replies, error: repliesError } = await supabase
          .from("community_posts")
          .select(`
          *,
          author:profiles(id, full_name, avatar_url),
          likes:community_likes(user_id)
        `)
          .eq("parent_id", post.id)
          .order("created_at", { ascending: true })

        if (repliesError) {
          console.error(`Error fetching replies for post ${post.id}:`, repliesError)
          return {
            ...post,
            replies: [],
          }
        }

        return {
          ...post,
          replies: replies || [],
        }
      }),
    )

    // Get current user's session to check liked status
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // Format the response
    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      tags: topic.tags,
      createdAt: topic.created_at,
      views: topic.views_count || 0,
      replies: topic.replies_count || 0,
      author: {
        id: topic.author?.id || "",
        name: topic.author?.full_name || "Unknown",
        avatar: topic.author?.avatar_url || `/placeholder.svg?height=40&width=40&query=UK`,
      },
    }

    const formattedPosts = postsWithReplies.map((post) => {
      // Check if current user liked this post
      const isLiked = currentUserId ? post.likes.some((like: any) => like.user_id === currentUserId) : false

      // Format the post replies
      const formattedReplies = post.replies.map((reply: any) => {
        const isReplyLiked = currentUserId ? reply.likes.some((like: any) => like.user_id === currentUserId) : false

        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.created_at,
          likes: reply.likes_count || 0,
          isLiked: isReplyLiked,
          author: {
            id: reply.author?.id || "",
            name: reply.author?.full_name || "Unknown",
            avatar: reply.author?.avatar_url || `/placeholder.svg?height=40&width=40&query=UK`,
          },
        }
      })

      return {
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        isLiked,
        author: {
          id: post.author?.id || "",
          name: post.author?.full_name || "Unknown",
          avatar: post.author?.avatar_url || `/placeholder.svg?height=40&width=40&query=UK`,
        },
        replies: formattedReplies,
      }
    })

    return NextResponse.json({
      topic: formattedTopic,
      posts: formattedPosts,
    })
  } catch (error) {
    console.error("Error fetching topic:", error)
    return NextResponse.json({ error: "Failed to fetch topic" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const topicId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the existing topic to verify ownership
    const { data: existingTopic, error: fetchError } = await supabase
      .from("community_topics")
      .select("user_id")
      .eq("id", topicId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Verify ownership
    if (existingTopic.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to update this topic" }, { status: 403 })
    }

    const { title, description, category, tags } = await request.json()

    // Format tags
    const tagArray =
      tags && typeof tags === "string"
        ? tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : tags || []

    // Update the topic
    const { data: topic, error } = await supabase
      .from("community_topics")
      .update({
        title,
        description,
        category,
        tags: tagArray,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topicId)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      topic,
    })
  } catch (error) {
    console.error("Error updating topic:", error)
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const topicId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the existing topic to verify ownership
    const { data: existingTopic, error: fetchError } = await supabase
      .from("community_topics")
      .select("user_id")
      .eq("id", topicId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Verify ownership
    if (existingTopic.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this topic" }, { status: 403 })
    }

    // Delete the topic (will cascade to delete all posts and likes)
    const { error } = await supabase.from("community_topics").delete().eq("id", topicId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting topic:", error)
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
  }
}
