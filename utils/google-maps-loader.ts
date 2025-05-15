let isLoaded = false
let isLoading = false
let callbacks: (() => void)[] = []

export async function loadGoogleMapsScript(): Promise<void> {
  // If already loaded, resolve immediately
  if (isLoaded) {
    return Promise.resolve()
  }

  // If currently loading, return a promise that resolves when loading is complete
  if (isLoading) {
    return new Promise<void>((resolve) => {
      callbacks.push(resolve)
    })
  }

  isLoading = true

  try {
    // Get the script URL from the server
    const response = await fetch("/api/maps/script")
    const data = await response.json()

    if (!data.url) {
      throw new Error("Failed to get Google Maps script URL")
    }

    // Load the script
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = data.url
      script.async = true
      script.defer = true

      script.onload = () => {
        isLoaded = true
        isLoading = false

        // Resolve all pending callbacks
        callbacks.forEach((callback) => callback())
        callbacks = []

        resolve()
      }

      script.onerror = () => {
        isLoading = false
        reject(new Error("Failed to load Google Maps script"))
      }

      document.head.appendChild(script)
    })
  } catch (error) {
    isLoading = false
    throw error
  }
}

export function resetGoogleMapsLoader(): void {
  isLoaded = false
  isLoading = false
  callbacks = []
}
