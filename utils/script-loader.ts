// Global registry to track loaded scripts
interface ScriptRegistry {
  [key: string]: {
    status: "loading" | "loaded" | "error"
    promise: Promise<void>
    callbacks: Array<() => void>
  }
}

// Global registry to prevent duplicate loading and track script status
const scriptRegistry: ScriptRegistry = {}

/**
 * Safely loads a script once and returns a promise
 * This approach avoids direct DOM manipulation when possible
 */
export function loadScript(src: string): Promise<void> {
  // Create a unique ID based on the script URL
  const scriptId = `script-${src.replace(/[^\w]/g, "-")}`

  // If script is already in registry, return its promise
  if (scriptRegistry[scriptId]) {
    return scriptRegistry[scriptId].promise
  }

  // Create a new promise for this script
  const scriptPromise = new Promise<void>((resolve, reject) => {
    try {
      // Check if script already exists in DOM
      const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement

      if (existingScript) {
        // If script is already loaded, resolve immediately
        if (existingScript.hasAttribute("data-loaded")) {
          resolve()
          return
        }

        // If script exists but is still loading, add event listeners
        existingScript.addEventListener("load", () => {
          existingScript.setAttribute("data-loaded", "true")
          resolve()
        })

        existingScript.addEventListener("error", (error) => {
          reject(error)
        })

        return
      }

      // Create new script element
      const script = document.createElement("script")
      script.src = src
      script.async = true
      script.defer = true

      // Add event listeners
      script.addEventListener("load", () => {
        script.setAttribute("data-loaded", "true")
        resolve()
      })

      script.addEventListener("error", (error) => {
        reject(error)
      })

      // Add to document
      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  })

  // Register the script
  scriptRegistry[scriptId] = {
    status: "loading",
    promise: scriptPromise
      .then(() => {
        scriptRegistry[scriptId].status = "loaded"
      })
      .catch((error) => {
        scriptRegistry[scriptId].status = "error"
        throw error
      }),
    callbacks: [],
  }

  return scriptRegistry[scriptId].promise
}

// Google Maps specific loader with callback
let googleMapsPromise: Promise<void> | null = null

export function loadGoogleMaps(apiKey: string): Promise<void> {
  // Return existing promise if already loading/loaded
  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    try {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      // Create a unique callback name
      const callbackName = `googleMapsCallback${Date.now()}`

      // Add callback to window
      window[callbackName] = () => {
        // Clean up callback
        try {
          delete window[callbackName]
        } catch (e) {
          window[callbackName] = undefined
        }

        resolve()
      }

      // Load the script
      const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
      loadScript(scriptSrc).catch((error) => {
        // Clean up callback on error
        try {
          delete window[callbackName]
        } catch (e) {
          window[callbackName] = undefined
        }

        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })

  return googleMapsPromise
}

// Reset Google Maps promise when needed (e.g., when changing API key)
export function resetGoogleMapsLoader(): void {
  googleMapsPromise = null
}
