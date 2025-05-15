import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const search = url.searchParams.get("search")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    const supabase = createServerSupabaseClient()

    // First, get the topics without trying to join with profiles
    let query = supabase
      .from("community_topics")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    // Apply filters if provided
    if (category && category !== "All Categories") {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: topics, error: topicsError, count } = await query

    if (topicsError) {
      console.error("Error fetching topics:", topicsError)
      throw topicsError
    }

    // Now, let's get the profiles for these topics
    const userIds = topics.map((topic) => topic.user_id).filter(Boolean)

    let profiles = {}
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      } else if (profilesData) {
        // Create a map of user_id to profile
        profiles = profilesData.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    // Get the reply counts for each topic
    const topicIds = topics.map((topic) => topic.id)
    const replyCounts = {}

    if (topicIds.length > 0) {
      // Instead of using group, we'll count posts for each topic individually
      for (const topicId of topicIds) {
        const { data: countData, error: countError } = await supabase
          .from("community_posts")
          .select("id", { count: "exact" })
          .eq("topic_id", topicId)

        if (!countError) {
          replyCounts[topicId] = countData?.length || 0
        }
      }
    }

    // Format the response
    const formattedData = topics.map((topic) => {
      const profile = profiles[topic.user_id] || {}

      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        category: topic.category,
        tags: topic.tags,
        createdAt: topic.created_at,
        replies: replyCounts[topic.id] || topic.replies_count || 0,
        views: topic.views_count || 0,
        author: {
          id: topic.user_id || "",
          name: profile.full_name || "Unknown",
          avatar:
            profile.avatar_url ||
            `/placeholder.svg?height=40&width=40&query=${profile.full_name?.substring(0, 2) || "UK"}`,
        },
      }
    })

    return NextResponse.json({
      topics: formattedData,
      totalCount: count || 0,
    })
  } catch (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json({ error: "Failed to fetch topics", details: error.message }, { status: 500 })
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

    const { title, description, category, tags } = await request.json()

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Format tags
    const tagArray =
      tags && typeof tags === "string"
        ? tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : tags || []

    // Insert the topic
    const { data: topic, error } = await supabase
      .from("community_topics")
      .insert({
        user_id: session.user.id,
        title,
        description,
        category,
        tags: tagArray,
        views_count: 0,
        replies_count: 0,
      })
      .select()

    if (error) {
      console.error("Error creating topic:", error)
      throw error
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

    // Format the response to include author information
    const formattedTopic =
      topic && topic[0]
        ? {
            id: topic[0].id,
            title: topic[0].title,
            description: topic[0].description,
            category: topic[0].category,
            tags: topic[0].tags,
            createdAt: topic[0].created_at,
            replies: 0,
            views: 0,
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
      topic: formattedTopic,
    })
  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json({ error: "Failed to create topic", details: error.message }, { status: 500 })
  }
}
