"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemptationInterceptor } from "@/components/temptation-interceptor"
import { DailyVerse } from "@/components/daily-verse"
import { ChurchFinder } from "@/components/church-finder"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { GoogleMapsProvider } from "@/components/google-maps-provider"
import { useSearchParams } from "next/navigation"

export default function Home() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("temptation")
  const [churchTabVisited, setChurchTabVisited] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [placeId, setPlaceId] = useState<string | null>(null)

  // Only mount components after initial render to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)

    // Check for tab parameter in URL
    const tabParam = searchParams.get("tab")
    if (tabParam && ["temptation", "verse", "churches"].includes(tabParam)) {
      setActiveTab(tabParam)
      if (tabParam === "churches") {
        setChurchTabVisited(true)
      }
    }

    // Check for placeId parameter
    const placeIdParam = searchParams.get("placeId")
    if (placeIdParam) {
      setPlaceId(placeIdParam)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "churches") {
      setChurchTabVisited(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Strengthen Your Faith Journey
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Faith+ helps you build positive habits, overcome temptations, and grow in your spiritual walk
            </p>
          </div>

          {isMounted && (
            <GoogleMapsProvider>
              <Card className="overflow-hidden">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="temptation" className="text-xs sm:text-sm py-1.5 sm:py-2">
                      Temptation Interceptor
                    </TabsTrigger>
                    <TabsTrigger value="verse" className="text-xs sm:text-sm py-1.5 sm:py-2">
                      Daily Verse
                    </TabsTrigger>
                    <TabsTrigger value="churches" className="text-xs sm:text-sm py-1.5 sm:py-2">
                      Find Churches
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="temptation" className="p-3 sm:p-4 md:p-6">
                    <TemptationInterceptor />
                  </TabsContent>
                  <TabsContent value="verse" className="p-3 sm:p-4 md:p-6">
                    <DailyVerse />
                  </TabsContent>
                  <TabsContent value="churches" className="p-3 sm:p-4 md:p-6">
                    {(activeTab === "churches" || churchTabVisited) && <ChurchFinder initialPlaceId={placeId} />}
                  </TabsContent>
                </Tabs>
              </Card>
            </GoogleMapsProvider>
          )}
        </div>
      </main>

      <footer className="py-4 sm:py-6 border-t bg-white dark:bg-gray-900">
        <div className="container mx-auto px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Faith+ | Strengthening your spiritual journey</p>
        </div>
      </footer>
    </div>
  )
}
