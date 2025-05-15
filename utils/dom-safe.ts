/**
 * Safely checks if an element exists in the DOM
 */
export function elementExists(id: string): boolean {
  return !!document.getElementById(id)
}

/**
 * Safely removes an element from the DOM if it exists
 */
export function safeRemoveElement(id: string): void {
  try {
    const element = document.getElementById(id)
    if (element) {
      element.remove()
    }
  } catch (error) {
    console.error(`Error safely removing element ${id}:`, error)
  }
}

/**
 * Safely adds a script to the DOM with error handling
 */
export function safeAddScript(src: string, id: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    try {
      // Check if script already exists
      if (elementExists(id)) {
        const existingScript = document.getElementById(id) as HTMLScriptElement
        resolve(existingScript)
        return
      }

      // Create new script
      const script = document.createElement("script")
      script.id = id
      script.src = src
      script.async = true
      script.defer = true

      // Set up event handlers
      script.onload = () => resolve(script)
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))

      // Add to document
      document.head.appendChild(script)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Safely adds a stylesheet to the DOM with error handling
 */
export function safeAddStylesheet(href: string, id: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    try {
      // Check if stylesheet already exists
      if (elementExists(id)) {
        const existingLink = document.getElementById(id) as HTMLLinkElement
        resolve(existingLink)
        return
      }

      // Create new link
      const link = document.createElement("link")
      link.id = id
      link.href = href
      link.rel = "stylesheet"

      // Set up event handlers
      link.onload = () => resolve(link)
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`))

      // Add to document
      document.head.appendChild(link)
    } catch (error) {
      reject(error)
    }
  })
}

// Global registry to track Google Maps initialization
let googleMapsInitialized = false
let googleMapsInitializing = false
let googleMapsCallbacks: Array<() => void> = []

/**
 * Safely initializes Google Maps with a shared callback
 */
export function safeInitGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already initialized, resolve immediately
    if (googleMapsInitialized && window.google && window.google.maps) {
      resolve()
      return
    }

    // If initialization is in progress, add to callbacks
    if (googleMapsInitializing) {
      googleMapsCallbacks.push(() => resolve())
      return
    }

    // Start initialization
    googleMapsInitializing = true

    // Create a unique callback name
    const callbackName = `initGoogleMaps${Date.now()}`

    // Add callback to window
    window[callbackName] = () => {
      // Mark as initialized
      googleMapsInitialized = true
      googleMapsInitializing = false

      // Clean up callback
      try {
        delete window[callbackName]
      } catch (e) {
        window[callbackName] = undefined
      }

      // Execute all callbacks
      googleMapsCallbacks.forEach((callback) => callback())
      googleMapsCallbacks = []

      resolve()
    }

    // Load the script
    const scriptId = `google-maps-script-${Date.now()}`
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`

    safeAddScript(scriptSrc, scriptId).catch((error) => {
      // Reset state on error
      googleMapsInitializing = false

      // Clean up callback
      try {
        delete window[callbackName]
      } catch (e) {
        window[callbackName] = undefined
      }

      reject(error)
    })
  })
}
