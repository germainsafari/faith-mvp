import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const membershipId = params.id
    const supabase = createServerSupabaseClient()

    // Verify the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the membership record to verify ownership
    const { data: membership, error: fetchError } = await supabase
      .from("community_group_members")
      .select("user_id, role, group_id")
      .eq("id", membershipId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 })
    }

    // Check if this is the user's own membership or if they're the group owner
    const isOwn = membership.user_id === session.user.id

    if (!isOwn) {
      // If not their own, check if they're the group owner
      const { data: groupOwner, error: ownerError } = await supabase
        .from("community_group_members")
        .select("id")
        .match({ group_id: membership.group_id, user_id: session.user.id, role: "owner" })
        .single()

      if (ownerError || !groupOwner) {
        return NextResponse.json({ error: "You don't have permission to remove this member" }, { status: 403 })
      }

      // Don't allow removing another owner
      if (membership.role === "owner") {
        return NextResponse.json({ error: "Cannot remove a group owner" }, { status: 400 })
      }
    }

    // Check that we're not removing the last owner
    if (isOwn && membership.role === "owner") {
      const { count, error: countError } = await supabase
        .from("community_group_members")
        .select("id", { count: "exact" })
        .match({ group_id: membership.group_id, role: "owner" })

      if (countError) throw countError

      if (count === 1) {
        return NextResponse.json(
          {
            error: "Cannot leave group as the last owner. Transfer ownership first or delete the group.",
          },
          { status: 400 },
        )
      }
    }

    // Delete the membership
    const { error: deleteError } = await supabase.from("community_group_members").delete().eq("id", membershipId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing group member:", error)
    return NextResponse.json({ error: "Failed to remove group member" }, { status: 500 })
  }
}
