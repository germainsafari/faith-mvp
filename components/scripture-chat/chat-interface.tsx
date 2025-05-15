"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Share2,
  History,
  HelpCircle,
  RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/providers/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import {
  FacebookShareButton,
  TwitterShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  EmailIcon,
} from "react-share"

interface ChatMessage {
  id: string
  question: string
  answer: string
  verses: {
    reference: string
    text: string
  }[]
  timestamp: string
  feedback?: {
    rating: "helpful" | "somewhat_helpful" | "not_helpful"
    comment?: string
  }
}

interface RelatedQuestion {
  id: string
  text: string
}

const SAMPLE_QUESTIONS = [
  "How can I overcome anxiety as a Christian?",
  "What does the Bible say about forgiveness?",
  "How should I pray effectively?",
  "What does it mean to be born again?",
  "How can I share my faith with others?",
]

const MAX_QUESTION_LENGTH = 500

export function ScriptureChatInterface() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [question, setQuestion] = useState("")
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat")
  const [relatedQuestions, setRelatedQuestions] = useState<RelatedQuestion[]>([])
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [showFeedbackComment, setShowFeedbackComment] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [historySearchQuery, setHistorySearchQuery] = useState("")
  const [filteredHistory, setFilteredHistory] = useState<ChatMessage[]>([])

  // Update filtered history when the search query or history changes
  useEffect(() => {
    if (historySearchQuery.trim()) {
      setFilteredHistory(
        history.filter(
          (msg) =>
            msg.question.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            msg.answer.toLowerCase().includes(historySearchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredHistory(history)
    }
  }, [historySearchQuery, history])

  // Fetch question history when component mounts or user changes
  useEffect(() => {
    if (user && isOpen) {
      fetchQuestionHistory()
    }
  }, [user, isOpen])

  // Scroll to bottom when new message is received
  useEffect(() => {
    if (messagesEndRef.current && currentMessage) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentMessage])

  const fetchQuestionHistory = async () => {
    if (!user) return

    try {
      setLoadingHistory(true)

      const { data, error } = await supabase
        .from("scripture_qa_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to match our ChatMessage interface
      const formattedHistory: ChatMessage[] = data.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        verses: item.verses,
        timestamp: new Date(item.created_at).toLocaleString(),
        feedback: undefined, // We'll fetch feedback separately if needed
      }))

      setHistory(formattedHistory)
    } catch (err) {
      console.error("Error fetching question history:", err)
      toast({
        title: "Error",
        description: "Failed to load your question history",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setError("Please enter a question")
      return
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the Scripture Q&A feature",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")
    setCurrentMessage(null)
    setRelatedQuestions([])

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

      // Create a new message
      const newMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        question,
        answer: data.answer,
        verses: data.verses,
        timestamp: new Date().toLocaleString(),
      }

      setCurrentMessage(newMessage)

      // Add to history (optimistic update)
      setHistory((prev) => [newMessage, ...prev])

      // Generate related questions
      generateRelatedQuestions(question, data.answer)

      // Clear the input
      setQuestion("")
    } catch (err) {
      console.error("Error getting response:", err)
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateRelatedQuestions = async (question: string, answer: string) => {
    try {
      const res = await fetch("/api/related-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate related questions")
      }

      const data = await res.json()
      setRelatedQuestions(data.questions)
    } catch (err) {
      console.error("Error generating related questions:", err)
      // Don't show an error to the user, just silently fail
      setRelatedQuestions([])
    }
  }

  const handleFeedback = async (messageId: string, rating: "helpful" | "somewhat_helpful" | "not_helpful") => {
    if (!user) return

    try {
      // Submit feedback to the database
      const { error } = await supabase.from("scripture_qa_feedback").insert([
        {
          history_id: messageId,
          user_id: user.id,
          rating,
          comment: feedbackComment,
        },
      ])

      if (error) throw error

      // Update the current message with feedback
      if (currentMessage && currentMessage.id === messageId) {
        setCurrentMessage({
          ...currentMessage,
          feedback: {
            rating,
            comment: feedbackComment,
          },
        })
      }

      // Update the message in history
      setHistory((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: { rating, comment: feedbackComment } } : msg)),
      )

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      })

      // Reset feedback comment
      setFeedbackComment("")
      setShowFeedbackComment(false)
    } catch (err) {
      console.error("Error submitting feedback:", err)
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (message: ChatMessage) => {
    const textToCopy = `
Question: ${message.question}

Answer: ${message.answer}

Scripture References:
${message.verses.map((verse) => `${verse.reference} - ${verse.text}`).join("\n")}
    `.trim()

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copied to clipboard",
      description: "The answer has been copied to your clipboard",
    })
  }

  const loadHistoryItem = (message: ChatMessage) => {
    setCurrentMessage(message)
    setActiveTab("chat")
  }

  const deleteHistoryItem = async (historyId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("scripture_qa_history").delete().eq("id", historyId).eq("user_id", user.id)

      if (error) throw error

      // Update the history state
      setHistory((prev) => prev.filter((item) => item.id !== historyId))

      toast({
        title: "Item removed",
        description: "Question removed from history",
      })
    } catch (err) {
      console.error("Error deleting history item:", err)
      toast({
        title: "Error",
        description: "Failed to delete history item",
        variant: "destructive",
      })
    }
  }

  const clearHistory = async () => {
    if (!user || !window.confirm("Are you sure you want to clear all history?")) return

    try {
      setLoadingHistory(true)

      const { error } = await supabase.from("scripture_qa_history").delete().eq("user_id", user.id)

      if (error) throw error

      // Clear the history state
      setHistory([])

      toast({
        title: "History cleared",
        description: "All question history has been removed",
      })
    } catch (err) {
      console.error("Error clearing history:", err)
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {user && (
        <div className="fixed bottom-4 right-4 z-50">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  height: isMinimized ? "auto" : "500px",
                  width: isMinimized ? "auto" : "350px",
                }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.2 }}
                className="mb-2"
              >
                <Card className="shadow-lg border-blue-200 overflow-hidden">
                  <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-blue-50 dark:bg-blue-900/30">
                    <div className="flex items-center">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <h3 className="font-medium text-sm">Scripture Assistant</h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimize}>
                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleChat}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {!isMinimized && (
                    <>
                      <Tabs
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as "chat" | "history")}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="chat" className="text-xs">
                            Chat
                          </TabsTrigger>
                          <TabsTrigger value="history" className="text-xs">
                            History
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="chat" className="m-0">
                          <CardContent className="p-3 h-[350px] overflow-y-auto" ref={chatContainerRef}>
                            {!currentMessage && !loading && (
                              <div className="flex flex-col items-center justify-center h-full text-center">
                                <HelpCircle className="h-12 w-12 text-blue-200 dark:text-blue-800 mb-2" />
                                <h3 className="font-medium text-sm mb-1">Ask a Question</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                  Get scripture-based answers to your faith questions
                                </p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {SAMPLE_QUESTIONS.map((q, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="cursor-pointer text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                      onClick={() => setQuestion(q)}
                                    >
                                      {q.length > 20 ? q.substring(0, 20) + "..." : q}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {loading && (
                              <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Finding scripture-based answers...
                                </p>
                              </div>
                            )}

                            {currentMessage && (
                              <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                  <p className="text-sm font-medium mb-1">Your Question:</p>
                                  <p className="text-sm">{currentMessage.question}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium mb-1">Answer:</p>
                                  <p className="text-sm mb-3">{currentMessage.answer}</p>

                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                                    Scripture References:
                                  </p>
                                  <div className="space-y-2">
                                    {currentMessage.verses.map((verse, index) => (
                                      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                        <p className="text-xs italic mb-1">{verse.text}</p>
                                        <p className="text-xs text-right font-medium text-blue-600 dark:text-blue-400">
                                          — {verse.reference}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  {relatedQuestions.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-xs font-medium mb-1">Related Questions:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {relatedQuestions.map((q, i) => (
                                          <Badge
                                            key={i}
                                            variant="outline"
                                            className="cursor-pointer text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                            onClick={() => setQuestion(q.text)}
                                          >
                                            {q.text.length > 25 ? q.text.substring(0, 25) + "..." : q.text}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex space-x-1">
                                      {!currentMessage.feedback ? (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                              handleFeedback(currentMessage.id, "helpful")
                                            }}
                                          >
                                            <ThumbsUp className="h-3 w-3 mr-1" />
                                            Helpful
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                              setShowFeedbackComment(true)
                                              handleFeedback(currentMessage.id, "somewhat_helpful")
                                            }}
                                          >
                                            So-so
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => {
                                              setShowFeedbackComment(true)
                                              handleFeedback(currentMessage.id, "not_helpful")
                                            }}
                                          >
                                            <ThumbsDown className="h-3 w-3 mr-1" />
                                            Not helpful
                                          </Button>
                                        </>
                                      ) : (
                                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                          <Check className="h-3 w-3 mr-1" />
                                          Feedback submitted
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex space-x-1">
                                      <Popover open={showShareOptions} onOpenChange={setShowShareOptions}>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <Share2 className="h-3 w-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2" align="end">
                                          <div className="flex space-x-2">
                                            <FacebookShareButton
                                              url={window.location.href}
                                              quote={`Q: ${currentMessage.question}\nA: ${currentMessage.answer.substring(0, 100)}...`}
                                            >
                                              <FacebookIcon size={24} round />
                                            </FacebookShareButton>
                                            <TwitterShareButton
                                              url={window.location.href}
                                              title={`Q: ${currentMessage.question}\nA: ${currentMessage.answer.substring(0, 80)}...`}
                                            >
                                              <TwitterIcon size={24} round />
                                            </TwitterShareButton>
                                            <EmailShareButton
                                              url={window.location.href}
                                              subject="Scripture Q&A from Faith+"
                                              body={`Question: ${currentMessage.question}\n\nAnswer: ${currentMessage.answer}\n\nScripture References:\n${currentMessage.verses.map((v) => `${v.reference} - ${v.text}`).join("\n")}`}
                                            >
                                              <EmailIcon size={24} round />
                                            </EmailShareButton>
                                          </div>
                                        </PopoverContent>
                                      </Popover>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(currentMessage)}
                                      >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>

                                  {showFeedbackComment && (
                                    <div className="mt-2">
                                      <Textarea
                                        placeholder="Tell us more about your feedback (optional)"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        className="text-xs min-h-[60px]"
                                      />
                                      <div className="flex justify-end mt-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => {
                                            // Update the feedback with the comment
                                            if (currentMessage.feedback) {
                                              handleFeedback(currentMessage.id, currentMessage.feedback.rating)
                                            }
                                          }}
                                        >
                                          Submit Comment
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div ref={messagesEndRef} />
                              </div>
                            )}
                          </CardContent>
                        </TabsContent>

                        <TabsContent value="history" className="m-0">
                          <CardContent className="p-3 h-[350px] overflow-y-auto">
                            {loadingHistory ? (
                              <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-medium">Recent Questions</h3>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={fetchQuestionHistory}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Refresh
                                    </Button>
                                    {history.length > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={clearHistory}
                                      >
                                        Clear All
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {history.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center h-full text-center">
                                    <History className="h-12 w-12 text-blue-200 dark:text-blue-800 mb-2" />
                                    <h3 className="font-medium text-sm mb-1">No Questions Yet</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Your question history will appear here
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-3">
                                      <Input
                                        placeholder="Search history..."
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                        className="text-xs h-8"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      {filteredHistory.map((message) => (
                                        <div
                                          key={message.id}
                                          className="p-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 relative group"
                                          onClick={() => loadHistoryItem(message)}
                                        >
                                          <p className="text-sm font-medium line-clamp-1">{message.question}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                            {message.answer}
                                          </p>
                                          <div className="flex justify-between items-center mt-1">
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                              {message.timestamp}
                                            </p>
                                            {message.feedback && (
                                              <Badge variant="outline" className="text-xs">
                                                {message.feedback.rating === "helpful" && "Helpful"}
                                                {message.feedback.rating === "somewhat_helpful" && "Somewhat helpful"}
                                                {message.feedback.rating === "not_helpful" && "Not helpful"}
                                              </Badge>
                                            )}
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              deleteHistoryItem(message.id)
                                            }}
                                          >
                                            <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </TabsContent>
                      </Tabs>

                      <CardFooter className="p-3 border-t bg-gray-50 dark:bg-gray-800/50">
                        <form onSubmit={handleSubmit} className="w-full">
                          <div className="flex space-x-2">
                            <div className="relative flex-grow">
                              <Textarea
                                placeholder="Ask a question about faith or the Bible..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="min-h-[40px] max-h-[100px] pr-12 text-sm resize-none"
                                disabled={loading}
                                maxLength={MAX_QUESTION_LENGTH}
                              />
                              <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                                {question.length}/{MAX_QUESTION_LENGTH}
                              </div>
                            </div>
                            <Button
                              type="submit"
                              size="icon"
                              disabled={loading || !question.trim()}
                              className="h-10 w-10 flex-shrink-0"
                            >
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                        </form>
                      </CardFooter>
                    </>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={toggleChat} className="rounded-full h-12 w-12 shadow-lg" size="icon">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      )}
    </>
  )
}
