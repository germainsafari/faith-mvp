"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Send, BookOpen, ThumbsUp, ThumbsDown, Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Response {
  verse: string
  reference: string
  reflection: string
  application: string
  prayer: string
}

const COMMON_TEMPTATIONS = [
  "Anger",
  "Anxiety",
  "Procrastination",
  "Lust",
  "Pride",
  "Envy",
  "Gossip",
  "Laziness",
  "Addiction",
  "Doubt",
]

export function TemptationInterceptor() {
  const [temptation, setTemptation] = useState("")
  const [response, setResponse] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)
  const [reflection, setReflection] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("verse")
  const responseRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!temptation.trim()) {
      setError("Please enter a temptation or struggle")
      return
    }

    setLoading(true)
    setError("")
    setFeedback(null)
    setReflection("")

    try {
      const res = await fetch("/api/intercept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ temptation }),
      })

      if (!res.ok) {
        throw new Error("Failed to get response")
      }

      const data = await res.json()
      setResponse(data)
      setActiveTab("verse")
    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type)
  }

  const copyToClipboard = () => {
    if (!response) return

    const textToCopy = `
Scripture: ${response.verse} - ${response.reference}

Reflection: ${response.reflection}

Application: ${response.application}

Prayer: ${response.prayer}
    `.trim()

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [response])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Temptation Interceptor</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
          Enter a temptation or struggle you're facing, and receive Scripture-based encouragement to help you overcome
          it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-2">
              {COMMON_TEMPTATIONS.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors text-xs sm:text-sm py-0.5 px-1.5 sm:py-1 sm:px-2"
                  onClick={() => setTemptation(item)}
                >
                  {item}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., anger, anxiety, procrastination"
                value={temptation}
                onChange={(e) => setTemptation(e.target.value)}
                disabled={loading}
                className="flex-grow text-sm sm:text-base"
              />
              <Button type="submit" disabled={loading} className="text-xs sm:text-sm px-2 sm:px-3">
                {loading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="ml-1 sm:ml-2 hidden sm:inline">
                  {loading ? "Getting encouragement..." : "Get Encouragement"}
                </span>
              </Button>
            </div>
            {error && <p className="text-xs sm:text-sm text-red-500">{error}</p>}
          </div>
        </form>
      </div>

      <AnimatePresence>
        {response && (
          <motion.div
            ref={responseRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 sm:space-y-4"
          >
            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="verse" className="text-xs sm:text-sm py-1 sm:py-2">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Scripture</span>
                    </TabsTrigger>
                    <TabsTrigger value="reflection" className="text-xs sm:text-sm py-1 sm:py-2">
                      <span className="hidden xs:inline">Reflection</span>
                      <span className="xs:hidden">Refl.</span>
                    </TabsTrigger>
                    <TabsTrigger value="application" className="text-xs sm:text-sm py-1 sm:py-2">
                      <span className="hidden xs:inline">Application</span>
                      <span className="xs:hidden">Apply</span>
                    </TabsTrigger>
                    <TabsTrigger value="prayer" className="text-xs sm:text-sm py-1 sm:py-2">
                      <span className="hidden xs:inline">Prayer</span>
                      <span className="xs:hidden">Pray</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="verse" className="p-3 sm:p-4 md:p-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 sm:p-4 rounded-md">
                      <p className="italic text-base sm:text-lg mb-2">{response.verse}</p>
                      <p className="text-right font-semibold text-blue-700 dark:text-blue-300">
                        — {response.reference}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="reflection" className="p-3 sm:p-4 md:p-6">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{response.reflection}</p>
                  </TabsContent>

                  <TabsContent value="application" className="p-3 sm:p-4 md:p-6">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{response.application}</p>
                  </TabsContent>

                  <TabsContent value="prayer" className="p-3 sm:p-4 md:p-6">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 italic">{response.prayer}</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback("positive")}
                    className={`text-xs sm:text-sm ${feedback === "positive" ? "bg-green-100 dark:bg-green-900/30" : ""}`}
                  >
                    <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Helpful
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback("negative")}
                    className={`text-xs sm:text-sm ${feedback === "negative" ? "bg-red-100 dark:bg-red-900/30" : ""}`}
                  >
                    <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Not Helpful
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-xs sm:text-sm">
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
              </div>

              {feedback && (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium">
                    {feedback === "positive"
                      ? "We're glad this was helpful! Would you like to share how this encouraged you?"
                      : "We're sorry this wasn't helpful. Could you share why?"}
                  </p>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={3}
                    className="text-sm sm:text-base"
                  />
                  <Button size="sm" variant="outline" disabled={!reflection.trim()} className="text-xs sm:text-sm">
                    Submit Feedback
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
