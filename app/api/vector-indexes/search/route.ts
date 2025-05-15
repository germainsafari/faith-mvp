import { type NextRequest, NextResponse } from "next/server"
import { searchVectorIndexesByContent } from "@/lib/supabase/data-operations"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const term = searchParams.get("term")

    if (!term) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    const { data } = await searchVectorIndexesByContent(term)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
