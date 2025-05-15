"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Define the context type
type GoogleMapsContextType = {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  apiKeyAvailable: boolean
}

// Create the context with default values
const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isLoading: false,
  error: null,
  apiKeyAvailable: false,
})

// Export the hook to use this context
export const useGoogleMaps = () => useContext(GoogleMapsContext)

// Define the provider props
interface GoogleMapsProviderProps {
  children: ReactNode
}

// Define global types
declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

// Create the provider component
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== "undefined" && window.google?.maps) {
      setIsLoaded(true)
      return
    }

    async function loadGoogleMaps() {
      try {
        setIsLoading(true)

        // Fetch configuration from the server
        const response = await fetch("/api/maps/config")
        const data = await response.json()

        if (!data.available || !data.scriptUrl) {
          setError("Google Maps API key is not available")
          setApiKeyAvailable(false)
          setIsLoading(false)
          return
        }

        setApiKeyAvailable(true)

        // Define the callback function
        window.initGoogleMaps = () => {
          setIsLoaded(true)
          setIsLoading(false)
        }

        // Create and append the script
        const script = document.createElement("script")
        script.src = data.scriptUrl
        script.async = true
        script.defer = true

        script.onerror = () => {
          setError("Failed to load Google Maps")
          setIsLoading(false)
        }

        document.head.appendChild(script)
      } catch (err) {
        setError("An error occurred while loading Google Maps")
        setIsLoading(false)
        console.error("Google Maps loading error:", err)
      }
    }

    loadGoogleMaps()

    // Cleanup function
    return () => {
      if (window.initGoogleMaps) {
        window.initGoogleMaps = () => {}
      }
    }
  }, [])

  return (
    <GoogleMapsContext.Provider
      value={{
        isLoaded,
        isLoading,
        error,
        apiKeyAvailable,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  )
}
