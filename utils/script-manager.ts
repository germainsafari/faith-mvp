// Global registry to track loaded scripts
interface ScriptRegistry {
  [key: string]: {
    loaded: boolean
    callbacks: Array<() => void>
    scriptElement?: HTMLScriptElement
  }
}

// Global registry to prevent duplicate loading and track script status
const scriptRegistry: ScriptRegistry = {}

/**
 * Safely loads a script once and manages callbacks
 */
export function loadScriptOnce(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If script is already in registry
    if (scriptRegistry[id]) {
      // If already loaded, resolve immediately
      if (scriptRegistry[id].loaded) {
        resolve()
        return
      }

      // If loading in progress, add to callbacks
      scriptRegistry[id].callbacks.push(() => resolve())
      return
    }

    // Initialize in registry
    scriptRegistry[id] = {
      loaded: false,
      callbacks: [() => resolve()],
    }

    // Check if script already exists in DOM
    const existingScript = document.getElementById(id) as HTMLScriptElement
    if (existingScript) {
      // Script exists but may not be loaded yet
      if (existingScript.getAttribute("data-loaded") === "true") {
        scriptRegistry[id].loaded = true
        executeCallbacks(id)
        resolve()
      } else {
        // Wait for existing script to load
        existingScript.addEventListener("load", () => {
          scriptRegistry[id].loaded = true
          existingScript.setAttribute("data-loaded", "true")
          executeCallbacks(id)
          resolve()
        })

        existingScript.addEventListener("error", (error) => {
          reject(error)
        })
      }
      return
    }

    // Create new script
    try {
      const script = document.createElement("script")
      script.id = id
      script.src = src
      script.async = true
      script.defer = true
      script.setAttribute("data-loaded", "false")

      script.addEventListener("load", () => {
        scriptRegistry[id].loaded = true
        script.setAttribute("data-loaded", "true")
        executeCallbacks(id)
        resolve()
      })

      script.addEventListener("error", (error) => {
        // Clean up on error
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
        delete scriptRegistry[id]
        reject(error)
      })

      // Store reference to script element
      scriptRegistry[id].scriptElement = script

      // Add to document
      document.head.appendChild(script)
    } catch (error) {
      delete scriptRegistry[id]
      reject(error)
    }
  })
}

/**
 * Execute all callbacks for a script
 */
function executeCallbacks(id: string): void {
  if (scriptRegistry[id] && scriptRegistry[id].callbacks.length > 0) {
    // Execute all callbacks
    scriptRegistry[id].callbacks.forEach((callback) => {
      try {
        callback()
      } catch (e) {
        console.error(`Error executing callback for script ${id}:`, e)
      }
    })

    // Clear callbacks
    scriptRegistry[id].callbacks = []
  }
}

/**
 * Safely load a stylesheet once
 */
export function loadStylesheetOnce(href: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if stylesheet already exists
    const existingLink = document.getElementById(id) as HTMLLinkElement
    if (existingLink) {
      resolve()
      return
    }

    // Create new link element
    try {
      const link = document.createElement("link")
      link.href = href
      link.id = id
      link.rel = "stylesheet"

      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`))

      // Add link to document
      document.head.appendChild(link)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Initialize Google Maps with a callback
 */
export function initializeGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve()
      return
    }

    // Create a unique callback name
    const callbackName = `initGoogleMaps${Date.now()}`

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
    loadScriptOnce(scriptSrc, "google-maps-script").catch((error) => {
      // Clean up callback on error
      try {
        delete window[callbackName]
      } catch (e) {
        window[callbackName] = undefined
      }

      reject(error)
    })
  })
}
