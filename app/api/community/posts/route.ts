import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const topicId = url.searchParams.get("topicId")

    if (!topicId) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the current user's ID if they're logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // First, get the posts without trying to join with profiles
    const { data: posts, error: postsError } = await supabase
      .from("community_posts")
      .select("*")
      .eq("topic_id", topicId)
      .is("parent_id", null) // Only get top-level posts, not replies
      .order("created_at", { ascending: true })

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      throw postsError
    }

    // Get the user IDs for all posts
    const userIds = posts.map((post) => post.user_id).filter(Boolean)

    // Get profiles for these users
    let profiles = {}
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      } else if (profilesData) {
        profiles = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    // Get the post IDs to fetch replies and likes
    const postIds = posts.map((post) => post.id)

    // Get replies for these posts
    let replies = {}
    if (postIds.length > 0) {
      const { data: repliesData, error: repliesError } = await supabase
        .from("community_posts")
        .select("*, user_id")
        .in("parent_id", postIds)
        .order("created_at", { ascending: true })

      if (repliesError) {
        console.error("Error fetching replies:", repliesError)
      } else if (repliesData) {
        // Group replies by parent_id
        replies = repliesData.reduce((acc, reply) => {
          if (!acc[reply.parent_id]) {
            acc[reply.parent_id] = []
          }
          acc[reply.parent_id].push(reply)
          return acc
        }, {})

        // Get user IDs for all replies
        const replyUserIds = repliesData.map((reply) => reply.user_id).filter(Boolean)

        // Get profiles for reply authors
        if (replyUserIds.length > 0) {
          const { data: replyProfilesData, error: replyProfilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", replyUserIds)

          if (replyProfilesError) {
            console.error("Error fetching reply profiles:", replyProfilesError)
          } else if (replyProfilesData) {
            // Add these profiles to the profiles object
            replyProfilesData.forEach((profile) => {
              profiles[profile.id] = profile
            })
          }
        }
      }
    }

    // Get likes for the current user
    let userLikes = {}
    if (userId && postIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("community_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds)

      if (!likesError && likesData) {
        userLikes = likesData.reduce((acc, like) => {
          acc[like.post_id] = true
          return acc
        }, {})
      }
    }

    // Format the response
    const formattedPosts = posts.map((post) => {
      const profile = profiles[post.user_id] || {}
      const postReplies = replies[post.id] || []

      // Format replies
      const formattedReplies = postReplies.map((reply) => {
        const replyProfile = profiles[reply.user_id] || {}

        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.created_at,
          likes: reply.likes_count || 0,
          isLiked: false, // We're not tracking likes for replies in this implementation
          author: {
            id: reply.user_id,
            name: replyProfile.full_name || "Unknown",
            avatar:
              replyProfile.avatar_url ||
              `/placeholder.svg?height=40&width=40&query=${replyProfile.full_name?.substring(0, 2) || "UK"}`,
          },
        }
      })

      return {
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        isLiked: !!userLikes[post.id],
        replies: formattedReplies,
        author: {
          id: post.user_id,
          name: profile.full_name || "Unknown",
          avatar:
            profile.avatar_url ||
            `/placeholder.svg?height=40&width=40&query=${profile.full_name?.substring(0, 2) || "UK"}`,
        },
      }
    })

    // Increment the view count for the topic
    if (topicId) {
      await supabase.rpc("increment_topic_view_count", { topic_id: topicId })
    }

    return NextResponse.json({
      posts: formattedPosts,
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts", details: error.message }, { status: 500 })
  }
}

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

    const { topicId, content, parentId } = await request.json()

    // Validation
    if (!topicId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert the post
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        topic_id: topicId,
        user_id: session.user.id,
        content,
        parent_id: parentId || null,
        likes_count: 0,
      })
      .select()

    if (error) {
      console.error("Error creating post:", error)
      throw error
    }

    // If this is a top-level post (not a reply), increment the topic's reply count
    if (!parentId && post && post[0]) {
      await supabase.rpc("increment_topic_replies_count", { topic_id: topicId })
    }

    // Get the user profile information for the response
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
    }

    // Format the response
    const formattedPost =
      post && post[0]
        ? {
            id: post[0].id,
            content: post[0].content,
            createdAt: post[0].created_at,
            likes: 0,
            isLiked: false,
            replies: [],
            author: {
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split("@")[0] || "Unknown",
              avatar:
                profile?.avatar_url ||
                `/placeholder.svg?height=40&width=40&query=${profile?.full_name?.substring(0, 2) || session.user.email?.substring(0, 2) || "UK"}`,
            },
          }
        : null

    return NextResponse.json({
      success: true,
      post: formattedPost,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post", details: error.message }, { status: 500 })
  }
}
