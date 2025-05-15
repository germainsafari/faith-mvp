"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"

// Bible books for reference
const bibleBooks = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
]

interface Verse {
  book_name: string
  chapter: number
  verse: number
  text: string
  reference?: string
}

interface Chapter {
  book_name: string
  chapter: number
  verses: Verse[]
}

// Cache for Bible content
const bibleCache: Record<string, Chapter> = {}

export default function BibleSearchPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Verse[]>([])
  const [selectedBook, setSelectedBook] = useState("John")
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [chapterContent, setChapterContent] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("read")
  const [savedVerses, setSavedVerses] = useState<Record<string, boolean>>({})
  const [savingVerse, setSavingVerse] = useState<string | null>(null)
  const [availableChapters, setAvailableChapters] = useState<number[]>([])
  const [retryCount, setRetryCount] = useState(0)

  // Fetch saved verses when component mounts
  useEffect(() => {
    if (user) {
      fetchSavedVerses()
    }
  }, [user])

  // Update available chapters when book changes
  useEffect(() => {
    const chaptersCount = getChapterCount(selectedBook)
    setAvailableChapters(Array.from({ length: chaptersCount }, (_, i) => i + 1))
    setSelectedChapter(1) // Reset to chapter 1 when book changes
  }, [selectedBook])

  // Fetch chapter content when book or chapter changes
  useEffect(() => {
    if (activeTab === "read") {
      fetchChapter(selectedBook, selectedChapter)
    }
  }, [selectedBook, selectedChapter, activeTab, retryCount])

  const fetchSavedVerses = async () => {
    try {
      const { data, error } = await supabase.from("saved_verses").select("reference").eq("user_id", user!.id)

      if (error) throw error

      const savedMap: Record<string, boolean> = {}
      if (data) {
        data.forEach((item) => {
          savedMap[item.reference] = true
        })
      }

      setSavedVerses(savedMap)
    } catch (error) {
      console.error("Error fetching saved verses:", error)
    }
  }

  const getChapterCount = (book: string) => {
    // This is a simplified approach - in a real app, you'd get this from an API
    const chapterCounts: Record<string, number> = {
      Genesis: 50,
      Exodus: 40,
      Leviticus: 27,
      Numbers: 36,
      Deuteronomy: 34,
      Joshua: 24,
      Judges: 21,
      Ruth: 4,
      "1 Samuel": 31,
      "2 Samuel": 24,
      "1 Kings": 22,
      "2 Kings": 25,
      "1 Chronicles": 29,
      "2 Chronicles": 36,
      Ezra: 10,
      Nehemiah: 13,
      Esther: 10,
      Job: 42,
      Psalms: 150,
      Proverbs: 31,
      Ecclesiastes: 12,
      "Song of Solomon": 8,
      Isaiah: 66,
      Jeremiah: 52,
      Lamentations: 5,
      Ezekiel: 48,
      Daniel: 12,
      Hosea: 14,
      Joel: 3,
      Amos: 9,
      Obadiah: 1,
      Jonah: 4,
      Micah: 7,
      Nahum: 3,
      Habakkuk: 3,
      Zephaniah: 3,
      Haggai: 2,
      Zechariah: 14,
      Malachi: 4,
      Matthew: 28,
      Mark: 16,
      Luke: 24,
      John: 21,
      Acts: 28,
      Romans: 16,
      "1 Corinthians": 16,
      "2 Corinthians": 13,
      Galatians: 6,
      Ephesians: 6,
      Philippians: 4,
      Colossians: 4,
      "1 Thessalonians": 5,
      "2 Thessalonians": 3,
      "1 Timothy": 6,
      "2 Timothy": 4,
      Titus: 3,
      Philemon: 1,
      Hebrews: 13,
      James: 5,
      "1 Peter": 5,
      "2 Peter": 3,
      "1 John": 5,
      "2 John": 1,
      "3 John": 1,
      Jude: 1,
      Revelation: 22,
    }

    return chapterCounts[book] || 5
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults([])

    try {
      const response = await fetch(`/api/bible/search?q=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.verses && data.verses.length > 0) {
        setSearchResults(data.verses)
        setActiveTab("search")
      } else {
        setError("No results found. Please try a different search term.")
      }
    } catch (error) {
      console.error("Search error:", error)
      setError(error instanceof Error ? error.message : "Failed to search the Bible. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchChapter = async (book: string, chapter: number) => {
    setLoading(true)
    setError(null)

    // Check cache first
    const cacheKey = `${book}-${chapter}`
    if (bibleCache[cacheKey]) {
      setChapterContent(bibleCache[cacheKey])
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/bible/chapter?book=${encodeURIComponent(book)}&chapter=${chapter}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.verses && data.verses.length > 0) {
        const chapterData = {
          book_name: book,
          chapter: chapter,
          verses: data.verses,
        }

        // Cache the result
        bibleCache[cacheKey] = chapterData
        setChapterContent(chapterData)
      } else {
        throw new Error("No verses found")
      }
    } catch (error) {
      console.error("Chapter fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to load chapter. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVerse = async (verse: Verse) => {
    if (!user) return

    const reference = verse.reference || `${verse.book_name} ${verse.chapter}:${verse.verse}`

    try {
      setSavingVerse(reference)

      if (savedVerses[reference]) {
        // Verse is already saved, delete it
        const { error } = await supabase.from("saved_verses").delete().eq("user_id", user.id).eq("reference", reference)

        if (error) throw error

        setSavedVerses((prev) => {
          const updated = { ...prev }
          delete updated[reference]
          return updated
        })

        toast({
          title: "Verse removed",
          description: "The verse has been removed from your saved items.",
        })
      } else {
        // Save new verse
        const { error } = await supabase.from("saved_verses").insert([
          {
            user_id: user.id,
            verse: verse.text,
            reference: reference,
          },
        ])

        if (error) throw error

        setSavedVerses((prev) => ({
          ...prev,
          [reference]: true,
        }))

        toast({
          title: "Verse saved",
          description: "The verse has been added to your saved items.",
        })
      }
    } catch (error: any) {
      console.error("Error saving verse:", error)
      toast({
        title: "Error",
        description: "Failed to save verse. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingVerse(null)
    }
  }

  const navigateChapter = (direction: "prev" | "next") => {
    if (direction === "prev" && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1)
    } else if (direction === "next" && selectedChapter < availableChapters.length) {
      setSelectedChapter(selectedChapter + 1)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bible Search</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Search the Bible or read by chapter to find inspiration and guidance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="read" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Read by Chapter</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="read">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {bibleBooks.map((book) => (
                      <SelectItem key={book} value={book}>
                        {book}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select
                  value={selectedChapter.toString()}
                  onValueChange={(value) => setSelectedChapter(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableChapters.map((chapter) => (
                      <SelectItem key={chapter} value={chapter.toString()}>
                        Chapter {chapter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => navigateChapter("prev")}
                disabled={selectedChapter <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <span className="font-medium">
                {selectedBook} {selectedChapter}
              </span>

              <Button
                variant="outline"
                onClick={() => navigateChapter("next")}
                disabled={selectedChapter >= availableChapters.length || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-center text-red-500 mb-4">{error}</p>
                  <Button onClick={handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : chapterContent ? (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {chapterContent.book_name} {chapterContent.chapter}
                  </h2>
                  <div className="space-y-4">
                    {chapterContent.verses.map((verse) => {
                      const reference = `${verse.book_name} ${verse.chapter}:${verse.verse}`
                      return (
                        <div key={verse.verse} className="flex group">
                          <div className="mr-2 text-sm font-medium text-gray-500 w-7 flex-shrink-0 pt-0.5">
                            {verse.verse}
                          </div>
                          <div className="flex-grow">
                            <p className="text-gray-800 dark:text-gray-200">{verse.text}</p>
                          </div>
                          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleSaveVerse(verse)}
                              disabled={savingVerse === reference}
                            >
                              {savingVerse === reference ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : savedVerses[reference] ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <BookmarkPlus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Enter search term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Search
              </Button>
            </form>

            {error && (
              <Card className="border-red-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="text-red-500">{error}</p>
                </CardContent>
              </Card>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium">Search Results</h2>
                {searchResults.map((verse, index) => {
                  const reference = verse.reference || `${verse.book_name} ${verse.chapter}:${verse.verse}`
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-1">{reference}</h3>
                            <p className="text-gray-800 dark:text-gray-200">{verse.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-8 w-8 flex-shrink-0"
                            onClick={() => handleSaveVerse(verse)}
                            disabled={savingVerse === reference}
                          >
                            {savingVerse === reference ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : savedVerses[reference] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <BookmarkPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
