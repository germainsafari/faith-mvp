"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, Navigation, ExternalLink, AlertTriangle, BookmarkPlus, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useGoogleMaps } from "./google-maps-provider"
import { useAuth } from "@/providers/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// Define types
interface Church {
  id: string
  name: string
  vicinity: string
  rating?: number
  userRatingsTotal?: number
  location: { lat: number; lng: number }
}

interface ChurchFinderProps {
  initialPlaceId?: string | null
}

export function ChurchFinder({ initialPlaceId = null }: ChurchFinderProps) {
  const { isLoaded, isLoading, error: mapsError, apiKeyAvailable } = useGoogleMaps()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [zipCode, setZipCode] = useState("")
  const [error, setError] = useState("")
  const [churches, setChurches] = useState<Church[]>([])
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [savedChurches, setSavedChurches] = useState<Record<string, boolean>>({})
  const [savingChurch, setSavingChurch] = useState<string | null>(null)
  const [initialPlaceIdLoaded, setInitialPlaceIdLoaded] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const mountedRef = useRef(true)
  const mapInitAttempted = useRef(false)

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (
      !isLoaded ||
      !mapRef.current ||
      !window.google ||
      !window.google.maps ||
      !mountedRef.current ||
      mapInitAttempted.current
    )
      return

    try {
      console.log("Initializing map with Google Maps API")
      mapInitAttempted.current = true

      // Default to a central US location
      const defaultLocation = { lat: 39.8283, lng: -98.5795 }

      // Make sure the map container is visible
      if (mapRef.current.offsetParent === null) {
        console.warn("Map container is not visible, delaying map initialization")
        setTimeout(() => {
          mapInitAttempted.current = false // Reset so we can try again
        }, 500)
        return
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 4,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi.business",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "poi",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      infoWindowRef.current = new window.google.maps.InfoWindow()

      // If we have an initialPlaceId, try to load that church
      if (initialPlaceId && !initialPlaceIdLoaded) {
        loadChurchByPlaceId(initialPlaceId)
        return
      }

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!mountedRef.current || !mapInstanceRef.current) return

            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }

            mapInstanceRef.current.setCenter(userLocation)
            mapInstanceRef.current.setZoom(11)
            findNearbyChurches(userLocation)
          },
          () => {
            // Handle geolocation error silently
            console.log("Geolocation permission denied or unavailable")
          },
        )
      }
    } catch (err) {
      console.error("Error initializing map:", err)
      if (mountedRef.current) {
        setError("Failed to initialize map. Please refresh the page.")
      }
    }

    // Cleanup function
    return () => {
      // Clean up markers
      if (markersRef.current) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.setMap) {
            try {
              marker.setMap(null)
            } catch (e) {
              console.error("Error removing marker:", e)
            }
          }
        })
        markersRef.current = []
      }

      // Clean up info window
      if (infoWindowRef.current) {
        try {
          infoWindowRef.current.close()
        } catch (e) {
          console.error("Error closing info window:", e)
        }
      }
    }
  }, [isLoaded, initialPlaceId, initialPlaceIdLoaded])

  // Set mounted ref to false when component unmounts
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Fetch saved churches when user changes
  useEffect(() => {
    if (!user) {
      setSavedChurches({})
      return
    }

    const fetchSavedChurches = async () => {
      try {
        const { data, error } = await supabase.from("saved_churches").select("place_id").eq("user_id", user.id)

        if (error) throw error

        const savedMap: Record<string, boolean> = {}
        if (data) {
          data.forEach((item) => {
            savedMap[item.place_id] = true
          })
        }

        setSavedChurches(savedMap)
      } catch (error) {
        console.error("Error fetching saved churches:", error)
      }
    }

    fetchSavedChurches()
  }, [user])

  // Load a church by its place_id
  const loadChurchByPlaceId = async (placeId: string) => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps || !mountedRef.current) return

    setLoading(true)
    setError("")

    try {
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)

      service.getDetails(
        {
          placeId: placeId,
          fields: ["name", "geometry", "vicinity", "rating", "user_ratings_total"],
        },
        (place, status) => {
          if (!mountedRef.current) return
          setLoading(false)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // Create a church object from the place details
            const church: Church = {
              id: place.place_id!,
              name: place.name!,
              vicinity: place.vicinity || "",
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            }

            // Center the map on the church
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter(church.location)
              mapInstanceRef.current.setZoom(15)
            }

            // Create a marker for the church
            if (mapInstanceRef.current) {
              // Clear existing markers
              markersRef.current.forEach((marker) => marker.setMap(null))
              markersRef.current = []

              const marker = new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: church.location,
                title: church.name,
                animation: window.google.maps.Animation.DROP,
                icon: {
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
              })

              markersRef.current.push(marker)

              // Open info window
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="padding: 8px; max-width: 200px;">
                    <h3 style="font-weight: bold; margin-bottom: 5px;">${church.name}</h3>
                    <p style="margin-bottom: 5px;">${church.vicinity || ""}</p>
                    ${church.rating ? `<p style="margin-bottom: 0;">Rating: ${church.rating} ⭐ (${church.userRatingsTotal || 0})</p>` : ""}
                  </div>
                `)
                infoWindowRef.current.open(mapInstanceRef.current, marker)
              }

              // Set the selected church
              setSelectedChurch(church)

              // Also search for nearby churches
              findNearbyChurches(church.location)
            }

            setInitialPlaceIdLoaded(true)
          } else {
            setError("Could not find the specified church. Please try searching for it.")
          }
        },
      )
    } catch (err) {
      console.error("Error loading church by place ID:", err)
      setError("Failed to load church details. Please try again.")
      setLoading(false)
    }
  }

  const findNearbyChurches = (location: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps || !mountedRef.current) return

    setLoading(true)
    setChurches([])

    // Don't clear selected church if we're loading by place ID
    if (!initialPlaceId || initialPlaceIdLoaded) {
      setSelectedChurch(null)
    }

    // Clear existing markers if we're not loading by place ID
    if (!initialPlaceId || initialPlaceIdLoaded) {
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          try {
            marker.setMap(null)
          } catch (e) {
            console.error("Error removing marker:", e)
          }
        }
      })
      markersRef.current = []
    }

    try {
      const service = new window.google.maps.places.PlacesService(mapInstanceRef.current)

      service.nearbySearch(
        {
          location,
          radius: 5000, // 5km radius
          type: "church",
        },
        (results, status) => {
          if (!mountedRef.current) return

          setLoading(false)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const churchesData: Church[] = results.map((place) => ({
              id: place.place_id!,
              name: place.name!,
              vicinity: place.vicinity || "",
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            }))

            if (mountedRef.current) {
              setChurches(churchesData)
            }

            // If we're loading by place ID and already have a marker, don't add markers for all churches
            if (initialPlaceId && !initialPlaceIdLoaded && selectedChurch) {
              return
            }

            results.forEach((place) => {
              if (!mountedRef.current || !mapInstanceRef.current) return

              if (place.geometry && place.geometry.location) {
                // Skip if this is the initially loaded church
                if (initialPlaceId && place.place_id === initialPlaceId && !initialPlaceIdLoaded) {
                  return
                }

                const marker = new window.google.maps.Marker({
                  map: mapInstanceRef.current,
                  position: place.geometry.location,
                  title: place.name,
                  animation: window.google.maps.Animation.DROP,
                  icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  },
                })

                markersRef.current.push(marker)

                marker.addListener("click", () => {
                  if (!mountedRef.current || !infoWindowRef.current || !mapInstanceRef.current) return

                  infoWindowRef.current.setContent(`
                    <div style="padding: 8px; max-width: 200px;">
                      <h3 style="font-weight: bold; margin-bottom: 5px;">${place.name}</h3>
                      <p style="margin-bottom: 5px;">${place.vicinity || ""}</p>
                      ${place.rating ? `<p style="margin-bottom: 0;">Rating: ${place.rating} ⭐ (${place.user_ratings_total || 0})</p>` : ""}
                    </div>
                  `)
                  infoWindowRef.current.open(mapInstanceRef.current, marker)

                  const church = churchesData.find((c) => c.id === place.place_id)
                  if (church && mountedRef.current) {
                    setSelectedChurch(church)
                  }
                })
              }
            })
          } else {
            if (mountedRef.current) {
              setError("No churches found in this area. Try a different location.")
            }
          }
        },
      )
    } catch (err) {
      console.error("Error finding churches:", err)
      if (mountedRef.current) {
        setError("Failed to search for churches. Please try again.")
        setLoading(false)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!zipCode.trim()) {
      setError("Please enter a ZIP code or city name")
      return
    }

    if (!window.google || !window.google.maps || !mapInstanceRef.current) {
      setError("Map is not fully loaded yet. Please wait a moment and try again.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Convert ZIP code to coordinates using Geocoding API
      const geocoder = new window.google.maps.Geocoder()

      geocoder.geocode({ address: zipCode }, (results, status) => {
        if (!mountedRef.current || !mapInstanceRef.current) return

        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location

          mapInstanceRef.current.setCenter(location)
          mapInstanceRef.current.setZoom(12)
          findNearbyChurches({ lat: location.lat(), lng: location.lng() })
        } else {
          if (mountedRef.current) {
            setError("Could not find location. Please try a different ZIP code or city name.")
            setLoading(false)
          }
        }
      })
    } catch (err) {
      console.error("Error in geocoding:", err)
      if (mountedRef.current) {
        setError("Something went wrong. Please try again.")
        setLoading(false)
      }
    }
  }

  const centerOnChurch = (church: Church) => {
    if (!mapInstanceRef.current || !mountedRef.current) return

    mapInstanceRef.current.setCenter(church.location)
    mapInstanceRef.current.setZoom(15)
    setSelectedChurch(church)

    // Find and open the info window for this church
    const marker = markersRef.current.find((m) => m.getTitle() === church.name)
    if (marker && infoWindowRef.current && mapInstanceRef.current) {
      infoWindowRef.current.setContent(`
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">${church.name}</h3>
          <p style="margin-bottom: 5px;">${church.vicinity || ""}</p>
          ${church.rating ? `<p style="margin-bottom: 0;">Rating: ${church.rating} ⭐ (${church.userRatingsTotal || 0})</p>` : ""}
        </div>
      `)
      infoWindowRef.current.open(mapInstanceRef.current, marker)
    }
  }

  const handleSaveChurch = async (church: Church) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save churches",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingChurch(church.id)

      if (savedChurches[church.id]) {
        // Church is already saved, delete it
        const { error } = await supabase
          .from("saved_churches")
          .delete()
          .eq("user_id", user.id)
          .eq("place_id", church.id)

        if (error) throw error

        setSavedChurches((prev) => {
          const updated = { ...prev }
          delete updated[church.id]
          return updated
        })

        toast({
          title: "Church removed",
          description: "The church has been removed from your saved items.",
        })
      } else {
        // Save new church
        const { error } = await supabase.from("saved_churches").insert([
          {
            user_id: user.id,
            name: church.name,
            vicinity: church.vicinity,
            place_id: church.id,
          },
        ])

        if (error) throw error

        setSavedChurches((prev) => ({
          ...prev,
          [church.id]: true,
        }))

        toast({
          title: "Church saved",
          description: "The church has been added to your saved items.",
        })
      }
    } catch (error: any) {
      console.error("Error saving church:", error)
      toast({
        title: "Error",
        description: "Failed to save church. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingChurch(null)
    }
  }

  if (mapsError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Find Churches Near You</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
            Discover local churches in your area to connect with a community of believers.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertTitle className="text-sm sm:text-base">Google Maps Error</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">{mapsError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!apiKeyAvailable) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Find Churches Near You</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
            Discover local churches in your area to connect with a community of believers.
          </p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertTitle className="text-sm sm:text-base">API Key Required</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            A Google Maps API key is required to use the Church Finder feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Find Churches Near You</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          Discover local churches in your area to connect with a community of believers.
        </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
        <form onSubmit={handleSearch} className="flex space-x-2 flex-grow w-full sm:w-auto">
          <Input
            placeholder="Enter ZIP code or city name"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            disabled={loading || !isLoaded}
            className="flex-grow text-xs sm:text-sm"
          />
          <Button type="submit" disabled={loading || !isLoaded} className="text-xs sm:text-sm px-2 sm:px-3">
            {loading ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="ml-1 sm:ml-2 hidden sm:inline">Search</span>
          </Button>
        </form>
      </div>

      {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="md:col-span-2">
          <div ref={mapRef} className="w-full h-[300px] sm:h-[400px] rounded-md bg-gray-100 dark:bg-gray-800 relative">
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <h3 className="font-medium mb-2 text-sm sm:text-base">Nearby Churches</h3>
              {loading ? (
                <div className="flex justify-center py-6 sm:py-8">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-500" />
                </div>
              ) : churches.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-2">
                  {churches.map((church) => (
                    <div
                      key={church.id}
                      className={`p-1.5 sm:p-2 rounded-md cursor-pointer transition-colors ${
                        selectedChurch?.id === church.id
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => centerOnChurch(church)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm sm:text-base">{church.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{church.vicinity}</p>
                          {church.rating && (
                            <div className="flex items-center mt-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-xs sm:text-sm ml-1">
                                {church.rating} ({church.userRatingsTotal || 0})
                              </span>
                            </div>
                          )}
                        </div>
                        {user && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveChurch(church)
                            }}
                            disabled={savingChurch === church.id}
                          >
                            {savingChurch === church.id ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : savedChurches[church.id] ? (
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            ) : (
                              <BookmarkPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No churches found. Try searching for a location.
                </p>
              )}
            </CardContent>
          </Card>

          {selectedChurch && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">{selectedChurch.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedChurch.vicinity}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedChurch.location.lat},${selectedChurch.location.lng}`,
                        "_blank",
                      )
                    }
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Directions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${selectedChurch.name}&query_place_id=${selectedChurch.id}`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Details
                  </Button>
                  {user && (
                    <Button
                      size="sm"
                      variant={savedChurches[selectedChurch.id] ? "default" : "outline"}
                      className={`text-xs sm:text-sm ${
                        savedChurches[selectedChurch.id] ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                      onClick={() => handleSaveChurch(selectedChurch)}
                      disabled={savingChurch === selectedChurch.id}
                    >
                      {savingChurch === selectedChurch.id ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      ) : savedChurches[selectedChurch.id] ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      ) : (
                        <BookmarkPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      )}
                      {savedChurches[selectedChurch.id] ? "Saved" : "Save"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <p>Note: Please allow location access for better results. You can also search by ZIP code or city name.</p>
      </div>
    </div>
  )
}
