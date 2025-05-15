"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface Response {
  answer: string
  verses: {
    reference: string
    text: string
  }[]
}

const SAMPLE_QUESTIONS = [
  "How can I overcome anxiety as a Christian?",
  "What does the Bible say about forgiveness?",
  "How should I pray effectively?",
  "What does it mean to be born again?",
  "How can I share my faith with others?",
  "What does the Bible teach about marriage?",
]

export default function ScriptureQAPage() {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<Response | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setError("Please enter a question")
      return
    }

    setLoading(true)
    setError("")
    setResponse(null)
    setFeedback(null)

    try {
      const res = await fetch("/api/scripture-qa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        throw new Error("Failed to get response")
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      console.error("Error getting response:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!response) return

    const textToCopy = `
Question: ${question}

Answer: ${response.answer}

Scripture References:
${response.verses.map((verse) => `${verse.reference} - ${verse.text}`).join("\n")}
    `.trim()

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type)
    // In a real app, you would send this feedback to your backend
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Scripture Q&A</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ask questions about faith, life, and the Bible to receive scripture-grounded answers
        </p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap mb-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>

            <Textarea
              placeholder="Ask a question about faith, the Bible, or Christian living..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px]"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Answer...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Ask Question
              </>
            )}
          </Button>
        </form>

        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Answer</h2>
                  <p className="mb-6 text-gray-800 dark:text-gray-200">{response.answer}</p>

                  <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Scripture References:</h3>
                  <div className="space-y-4">
                    {response.verses.map((verse, index) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
                        <p className="italic mb-1">{verse.text}</p>
                        <p className="text-right font-semibold text-blue-700 dark:text-blue-300">— {verse.reference}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback("positive")}
                    className={feedback === "positive" ? "bg-green-100 dark:bg-green-900/30" : ""}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Helpful
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeedback("negative")}
                    className={feedback === "negative" ? "bg-red-100 dark:bg-red-900/30" : ""}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Not Helpful
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {feedback && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm font-medium mb-2">
                    {feedback === "positive"
                      ? "Thank you for your feedback! We're glad this was helpful."
                      : "Thank you for your feedback. We'll work to improve our answers."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
