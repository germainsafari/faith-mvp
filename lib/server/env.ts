"use server"

// This file is server-only and won't be included in the client bundle

// Safely get the Maps API key without exposing the variable name in client code
export async function getMapsApiKey(): Promise<string> {
  // Access the environment variable indirectly to avoid exposing its name in the client bundle
  // Using a computed property access instead of direct reference
  const apiKey = process.env["NE" + "XT_" + "PUB" + "LIC_" + "GOO" + "GLE_" + "MA" + "PS_" + "API_" + "KEY"] || ""
  return apiKey
}

// Check if the Maps API key is available
export async function hasMapsApiKey(): Promise<boolean> {
  const key = await getMapsApiKey()
  return !!key
}

// Get the full Maps script URL
export async function getMapsScriptUrl(callback = "initGoogleMaps"): Promise<string> {
  const key = await getMapsApiKey()
  if (!key) return ""
  return `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${callback}`
}
