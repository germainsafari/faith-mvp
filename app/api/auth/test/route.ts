import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Test the connection by getting the session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // Test database connection by counting vector_indexes
    const { count, error: countError } = await supabase
      .from("vector_indexes")
      .select("*", { count: "exact", head: true })

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({
      status: "success",
      message: "Supabase connection successful",
      sessionExists: !!sessionData.session,
      databaseConnection: {
        success: true,
        vectorIndexesCount: count,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to connect to Supabase",
      },
      { status: 500 },
    )
  }
}
