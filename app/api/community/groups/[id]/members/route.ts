import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the group exists
    const { data: group, error: groupError } = await supabase
      .from("community_groups")
      .select("id")
      .eq("id", groupId)
      .single()

    if (groupError) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if the user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from("community_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ error: "You are already a member of this group" }, { status: 400 })
    }

    // Add the user as a member
    const { data: membership, error } = await supabase
      .from("community_group_members")
      .insert({
        group_id: groupId,
        user_id: session.user.id,
        role: "member",
      })
      .select()

    if (error) {
      console.error("Error joining group:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      membership: membership && membership[0] ? membership[0] : null,
    })
  } catch (error) {
    console.error("Error joining group:", error)
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user is a member
    const { data: membership, error: membershipError } = await supabase
      .from("community_group_members")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single()

    if (membershipError) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 400 })
    }

    // Check if the user is the owner/admin and is the only admin
    if (membership.role === "admin" || membership.role === "owner") {
      const { count, error: countError } = await supabase
        .from("community_group_members")
        .select("id", { count: "exact" })
        .eq("group_id", groupId)
        .eq("role", "admin")

      if (!countError && count === 1) {
        // Check if there are other members
        const { count: totalMembers, error: totalError } = await supabase
          .from("community_group_members")
          .select("id", { count: "exact" })
          .eq("group_id", groupId)

        if (!totalError && totalMembers > 1) {
          return NextResponse.json(
            { error: "You cannot leave the group as you are the only admin. Promote another member to admin first." },
            { status: 400 },
          )
        }
      }
    }

    // Remove the membership
    const { error } = await supabase
      .from("community_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Error leaving group:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error leaving group:", error)
    return NextResponse.json({ error: "Failed to leave group" }, { status: 500 })
  }
}
