// Utility to safely load external scripts
export function loadScript(src: string, id: string, callback?: () => void): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.getElementById(id) as HTMLScriptElement
    if (existingScript) {
      // If script already exists, resolve with it
      if (callback) callback()
      resolve(existingScript)
      return
    }

    // Create new script element
    const script = document.createElement("script")
    script.src = src
    script.id = id
    script.async = true
    script.defer = true

    // Set up event handlers
    script.onload = () => {
      if (callback) callback()
      resolve(script)
    }
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`))
    }

    // Add script to document
    document.head.appendChild(script)
  })
}

// Utility to safely load external stylesheets
export function loadStylesheet(href: string, id: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    // Check if stylesheet already exists
    const existingLink = document.getElementById(id) as HTMLLinkElement
    if (existingLink) {
      // If stylesheet already exists, resolve with it
      resolve(existingLink)
      return
    }

    // Create new link element
    const link = document.createElement("link")
    link.href = href
    link.id = id
    link.rel = "stylesheet"

    // Set up event handlers
    link.onload = () => {
      resolve(link)
    }
    link.onerror = () => {
      reject(new Error(`Failed to load stylesheet: ${href}`))
    }

    // Add link to document
    document.head.appendChild(link)
  })
}

// Safe removal of scripts and stylesheets
export function safeRemoveElement(id: string): void {
  try {
    const element = document.getElementById(id)
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
  } catch (error) {
    console.error(`Error removing element ${id}:`, error)
  }
}
