import { NextResponse } from "next/server"
import { hasMapsApiKey } from "@/lib/server/env"

export async function GET() {
  // Check if the API key is available without referencing the variable name
  const available = await hasMapsApiKey()

  return NextResponse.json({
    available,
    source: "env",
  })
}
