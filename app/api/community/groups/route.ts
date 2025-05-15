import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    const supabase = createServerSupabaseClient()

    // Get the current user's ID if they're logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // First, get all groups
    let query = supabase
      .from("community_groups")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    // Apply category filter if provided
    if (category && category !== "All Categories") {
      query = query.eq("category", category)
    }

    const { data: groups, error: groupsError, count } = await query

    if (groupsError) {
      console.error("Error fetching groups:", groupsError)
      throw groupsError
    }

    // Get the creator profiles
    const creatorIds = groups.map((group) => group.created_by).filter(Boolean)

    let profiles = {}
    if (creatorIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", creatorIds)

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

    // Get member counts for each group
    const groupIds = groups.map((group) => group.id)
    const memberCounts = {}

    if (groupIds.length > 0) {
      // Instead of using .group(), we'll count members for each group individually
      for (const groupId of groupIds) {
        const { data: countData, error: countError } = await supabase
          .from("community_group_members")
          .select("*", { count: "exact" })
          .eq("group_id", groupId)

        if (!countError) {
          memberCounts[groupId] = countData?.length || 0
        }
      }
    }

    // Get the groups the user is a member of
    let userMemberships = {}
    if (userId && groupIds.length > 0) {
      const { data: membershipsData, error: membershipsError } = await supabase
        .from("community_group_members")
        .select("group_id")
        .eq("user_id", userId)
        .in("group_id", groupIds)

      if (!membershipsError && membershipsData) {
        userMemberships = membershipsData.reduce((acc, membership) => {
          acc[membership.group_id] = true
          return acc
        }, {})
      }
    }

    // Format the response
    const formattedGroups = groups.map((group) => {
      const profile = profiles[group.created_by] || {}

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        schedule: group.schedule,
        createdAt: group.created_at,
        membersCount: memberCounts[group.id] || 0,
        isJoined: !!userMemberships[group.id],
        creator: {
          id: group.created_by,
          name: profile.full_name || "Unknown",
          avatar:
            profile.avatar_url ||
            `/placeholder.svg?height=40&width=40&query=${profile.full_name?.substring(0, 2) || "UK"}`,
        },
      }
    })

    return NextResponse.json({
      groups: formattedGroups,
      totalCount: count || 0,
    })
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "Failed to fetch groups", details: error.message }, { status: 500 })
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

    const { name, description, category, schedule, meetingTime, location } = await request.json()

    // Validation
    if (!name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use schedule if provided, otherwise use meetingTime
    const finalSchedule = schedule || meetingTime || null

    // Insert the group
    const { data: group, error } = await supabase
      .from("community_groups")
      .insert({
        name,
        description,
        category,
        schedule: finalSchedule,
        created_by: session.user.id,
        is_active: true,
      })
      .select()

    if (error) {
      console.error("Error creating group:", error)
      throw error
    }

    // Add the creator as a member with admin role
    if (group && group[0]) {
      const { error: memberError } = await supabase.from("community_group_members").insert({
        group_id: group[0].id,
        user_id: session.user.id,
        role: "admin",
      })

      if (memberError) {
        console.error("Error adding creator as member:", memberError)
      }
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
    const formattedGroup =
      group && group[0]
        ? {
            id: group[0].id,
            name: group[0].name,
            description: group[0].description,
            category: group[0].category,
            schedule: group[0].schedule,
            createdAt: group[0].created_at,
            membersCount: 1, // Creator is the first member
            isJoined: true,
            creator: {
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
      group: formattedGroup,
    })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "Failed to create group", details: error.message }, { status: 500 })
  }
}
