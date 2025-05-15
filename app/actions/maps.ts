"use server"

import { getMapsScriptUrl } from "@/lib/server/env"

// Make sure this is declared as async
export async function getGoogleMapsScriptUrl() {
  const url = getMapsScriptUrl()

  if (!url) {
    return { url: "", error: "API key not found" }
  }

  return {
    url,
    error: null,
  }
}
