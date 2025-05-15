import { NextResponse } from "next/server"
import { getMapsScriptUrl, hasMapsApiKey } from "@/lib/server/env"

export async function GET() {
  const available = await hasMapsApiKey()
  const scriptUrl = available ? await getMapsScriptUrl() : ""

  // Return configuration without exposing the actual API key or variable name
  return NextResponse.json({
    available,
    scriptUrl,
  })
}
