interface Spotify {
  Player: any
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: Spotify | undefined
  }
}

let spotifyScriptLoaded = false
let spotifySDKCallback: ((sdk: typeof Spotify) => void) | null = null

// This function loads the Spotify Web Playback SDK
export function loadSpotifyWebPlaybackSDK(callback: (sdk: typeof Spotify) => void): void {
  if (typeof window === "undefined") return

  // If the SDK is already loaded, call the callback immediately
  if (window.Spotify) {
    callback(window.Spotify)
    return
  }

  // Store the callback for when the script loads
  spotifySDKCallback = callback

  // If we're already loading the script, don't load it again
  if (spotifyScriptLoaded) return

  spotifyScriptLoaded = true

  // Create script element
  const script = document.createElement("script")
  script.src = "https://sdk.scdn.co/spotify-player.js"
  script.async = true

  // When the script loads, the SDK will call window.onSpotifyWebPlaybackSDKReady
  window.onSpotifyWebPlaybackSDKReady = () => {
    if (spotifySDKCallback && window.Spotify) {
      spotifySDKCallback(window.Spotify)
    }
  }

  document.body.appendChild(script)
}

// This function creates a Spotify Web Playback SDK player
export function createSpotifyPlayer(accessToken: string, name = "Faith+ Web Player"): Promise<Spotify.Player> {
  return new Promise((resolve, reject) => {
    loadSpotifyWebPlaybackSDK((Spotify) => {
      const player = new Spotify.Player({
        name,
        getOAuthToken: (cb) => {
          cb(accessToken)
        },
        volume: 0.5,
      })

      // Error handling
      player.addListener("initialization_error", ({ message }) => {
        console.error("Failed to initialize Spotify player:", message)
        reject(new Error(message))
      })

      player.addListener("authentication_error", ({ message }) => {
        console.error("Failed to authenticate with Spotify:", message)
        reject(new Error(message))
      })

      player.addListener("account_error", ({ message }) => {
        console.error("Spotify account error:", message)
        reject(new Error(message))
      })

      player.addListener("playback_error", ({ message }) => {
        console.error("Spotify playback error:", message)
      })

      // Connect to the player
      player
        .connect()
        .then((success) => {
          if (success) {
            resolve(player)
          } else {
            reject(new Error("Failed to connect to Spotify"))
          }
        })
        .catch(reject)
    })
  })
}
