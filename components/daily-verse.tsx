"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Copy, Check, Share2, BookmarkPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/providers/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface VerseData {
  verse: string
  reference: string
  reflection: string
  application: string
}

export function DailyVerse() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [verseData, setVerseData] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savingVerse, setSavingVerse] = useState(false)

  const fetchVerse = async () => {
    setLoading(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch("/api/verse")

      if (!res.ok) {
        throw new Error("Failed to fetch verse")
      }

      const data = await res.json()
      setVerseData(data)
    } catch (err) {
      console.error("Error fetching verse:", err)
      setError("Failed to load daily verse. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!verseData) return

    const textToCopy = `"${verseData.verse}" - ${verseData.reference}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveVerse = async () => {
    if (!user || !verseData) return

    try {
      setSavingVerse(true)

      // Check if verse is already saved
      const { data: existingVerses, error: checkError } = await supabase
        .from("saved_verses")
        .select("id")
        .eq("user_id", user.id)
        .eq("reference", verseData.reference)
        .limit(1)

      if (checkError) throw checkError

      if (existingVerses && existingVerses.length > 0) {
        // Verse already saved, delete it
        const { error: deleteError } = await supabase.from("saved_verses").delete().eq("id", existingVerses[0].id)

        if (deleteError) throw deleteError

        setSaved(false)
        toast({
          title: "Verse removed",
          description: "The verse has been removed from your saved items.",
        })
      } else {
        // Save new verse
        const { error: insertError } = await supabase.from("saved_verses").insert([
          {
            user_id: user.id,
            verse: verseData.verse,
            reference: verseData.reference,
          },
        ])

        if (insertError) throw insertError

        setSaved(true)
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
      setSavingVerse(false)
    }
  }

  // Check if verse is saved when user or verse changes
  useEffect(() => {
    const checkIfVerseSaved = async () => {
      if (!user || !verseData) return

      try {
        const { data, error } = await supabase
          .from("saved_verses")
          .select("id")
          .eq("user_id", user.id)
          .eq("reference", verseData.reference)
          .limit(1)

        if (error) throw error

        setSaved(data && data.length > 0)
      } catch (error) {
        console.error("Error checking if verse is saved:", error)
      }
    }

    checkIfVerseSaved()
  }, [user, verseData])

  useEffect(() => {
    fetchVerse()
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Daily Verse</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          Scripture to inspire and guide your day. Reflect on God's Word and apply it to your life.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 sm:py-12">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-8 sm:py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchVerse} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : verseData ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={verseData.reference}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                  <div className="bg-white dark:bg-gray-900 p-4 sm:p-6">
                    <div className="text-center space-y-3 sm:space-y-4">
                      <p className="text-lg sm:text-xl font-serif italic leading-relaxed">"{verseData.verse}"</p>
                      <p className="font-medium text-blue-700 dark:text-blue-300">— {verseData.reference}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1 sm:mb-2">Today's Reflection:</h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{verseData.reflection}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1 sm:mb-2">Application:</h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{verseData.application}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="text-xs sm:text-sm">
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveVerse}
                    disabled={savingVerse || !user}
                    className={`text-xs sm:text-sm ${saved ? "bg-yellow-100 dark:bg-yellow-900/30" : ""}`}
                  >
                    {savingVerse ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                    ) : (
                      <BookmarkPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    )}
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>

                <Button onClick={fetchVerse} variant="outline" size="sm" className="text-xs sm:text-sm mt-2 sm:mt-0">
                  <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  New Verse
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  )
}
