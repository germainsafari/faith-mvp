import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Return session info (sanitized for security)
    return NextResponse.json({
      authenticated: !!session,
      user: session
        ? {
            id: session.user.id,
            email: session.user.email,
            lastSignInAt: session.user.last_sign_in_at,
            createdAt: session.user.created_at,
            userMetadata: session.user.user_metadata,
          }
        : null,
      sessionExpiry: session ? new Date(session.expires_at! * 1000).toISOString() : null,
      currentTime: new Date().toISOString(),
      cookies: {
        present: true, // We don't expose actual cookie values for security
      },
    })
  } catch (error) {
    console.error("Error in auth debug endpoint:", error)
    return NextResponse.json({ error: "Failed to get authentication debug info" }, { status: 500 })
  }
}
