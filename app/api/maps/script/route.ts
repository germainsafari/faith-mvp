import { NextResponse } from "next/server"
import { getMapsScriptUrl, hasMapsApiKey } from "@/lib/server/env"

export async function GET() {
  const available = await hasMapsApiKey()

  if (!available) {
    return NextResponse.json({ error: "API key not available" }, { status: 400 })
  }

  const url = await getMapsScriptUrl()

  return NextResponse.json({ url })
}
