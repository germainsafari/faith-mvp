// Validate Google Maps API key format (basic validation)
export function isValidApiKeyFormat(key: string): boolean {
  // Google Maps API keys are typically 39 characters
  // and contain alphanumeric characters plus -
  return /^[A-Za-z0-9_-]{20,}$/.test(key)
}
