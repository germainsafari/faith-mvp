"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, ExternalLink, MapPin, BookOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface SavedItemsProps {
  userId: string
}

interface SavedVerse {
  id: string
  user_id: string
  verse: string
  reference: string
  created_at: string
}

interface SavedChurch {
  id: string
  user_id: string
  name: string
  vicinity: string
  place_id: string
  created_at: string
}

export function SavedItems({ userId }: SavedItemsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [verses, setVerses] = useState<SavedVerse[]>([])
  const [churches, setChurches] = useState<SavedChurch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("verses")
  const [deletingItem, setDeletingItem] = useState<string | null>(null)

  useEffect(() => {
    fetchSavedItems()
  }, [userId])

  const fetchSavedItems = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch saved verses
      const { data: versesData, error: versesError } = await supabase
        .from("saved_verses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (versesError) throw versesError

      // Fetch saved churches
      const { data: churchesData, error: churchesError } = await supabase
        .from("saved_churches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (churchesError) throw churchesError

      setVerses(versesData || [])
      setChurches(churchesData || [])
    } catch (error: any) {
      console.error("Error fetching saved items:", error)
      setError(error.message || "Failed to load saved items")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVerse = async (id: string) => {
    try {
      setDeletingItem(id)
      const { error: deleteError } = await supabase.from("saved_verses").delete().eq("id", id).eq("user_id", userId)

      if (deleteError) throw deleteError

      // Update local state
      setVerses(verses.filter((verse) => verse.id !== id))

      toast({
        title: "Verse removed",
        description: "The verse has been removed from your saved items.",
      })
    } catch (error: any) {
      console.error("Error deleting verse:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete verse",
        variant: "destructive",
      })
    } finally {
      setDeletingItem(null)
    }
  }

  const handleDeleteChurch = async (id: string) => {
    try {
      setDeletingItem(id)
      const { error: deleteError } = await supabase.from("saved_churches").delete().eq("id", id).eq("user_id", userId)

      if (deleteError) throw deleteError

      // Update local state
      setChurches(churches.filter((church) => church.id !== id))

      toast({
        title: "Church removed",
        description: "The church has been removed from your saved items.",
      })
    } catch (error: any) {
      console.error("Error deleting church:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete church",
        variant: "destructive",
      })
    } finally {
      setDeletingItem(null)
    }
  }

  const viewChurchOnMap = (church: SavedChurch) => {
    router.push(`/?tab=churches&placeId=${church.place_id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Saved Items</h1>
        <p className="text-gray-600 dark:text-gray-300">Access your saved verses and churches</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Saved Verses</span>
            {verses.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {verses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="churches" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Saved Churches</span>
            {churches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {churches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verses" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : verses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">You haven't saved any verses yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/?tab=verse")}>
                  Go to Daily Verse
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {verses.map((verse) => (
                <Card key={verse.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="italic text-lg">"{verse.verse}"</p>
                            <p className="font-medium text-blue-700 dark:text-blue-300">— {verse.reference}</p>
                            <p className="text-xs text-gray-500">
                              Saved on {new Date(verse.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVerse(verse.id)}
                            disabled={deletingItem === verse.id}
                            className="text-red-500 hover:text-red-700"
                          >
                            {deletingItem === verse.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="churches" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : churches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">You haven't saved any churches yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/?tab=churches")}>
                  Find Churches
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {churches.map((church) => (
                <Card key={church.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-medium text-lg">{church.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{church.vicinity}</p>
                        <p className="text-xs text-gray-500">
                          Saved on {new Date(church.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewChurchOnMap(church)}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${church.name}&query_place_id=${church.place_id}`,
                              "_blank",
                            )
                          }
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Maps</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChurch(church.id)}
                          disabled={deletingItem === church.id}
                          className="text-red-500 hover:text-red-700"
                        >
                          {deletingItem === church.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
