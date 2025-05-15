"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, MessageSquare, Plus, ThumbsUp, CalendarDays, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Topic {
  id: string
  title: string
  description: string
  author: {
    id: string
    name: string
    avatar: string
  }
  category: string
  tags: string[]
  createdAt: string
  replies: number
  views: number
  lastReply?: {
    author: {
      id: string
      name: string
      avatar: string
    }
    createdAt: string
  }
}

interface Post {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  createdAt: string
  likes: number
  isLiked: boolean
  replies: ForumReply[]
}

interface ForumReply {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  createdAt: string
  likes: number
  isLiked: boolean
}

interface Group {
  id: string
  name: string
  description: string
  meetingTime?: string
  location?: string
  memberCount: number
  owner: {
    id: string
    name: string
    avatar: string
  }
  isJoined?: boolean
  tags?: string[]
  createdAt: string
  category?: string
  schedule?: string
}

// Categories for filtering
const CATEGORIES = [
  "All Categories",
  "Bible Study",
  "Prayer Requests",
  "Resources",
  "Testimonies",
  "Theology",
  "Discipleship",
  "Evangelism",
  "Worship",
  "Family",
]

export default function CommunityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("forums")
  const [topics, setTopics] = useState<Topic[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    category: "Bible Study",
    tags: "",
  })
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    meetingTime: "",
    location: "",
    category: "Bible Study",
    tags: "",
  })
  const [newReply, setNewReply] = useState("")
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false)
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [submittingTopic, setSubmittingTopic] = useState(false)
  const [submittingGroup, setSubmittingGroup] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const discussionEndRef = useRef<HTMLDivElement>(null)

  // Fetch topics from API
  const fetchTopics = useCallback(async (category?: string, search?: string) => {
    setLoadingTopics(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category && category !== "All Categories") {
        params.append("category", category)
      }
      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`/api/community/topics?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`)
      }

      const data = await response.json()
      setTopics(data.topics || [])
    } catch (err) {
      console.error("Error fetching topics:", err)
      setError("Failed to load topics. Please try again later.")
      setTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }, [])

  // Fetch groups from API
  const fetchGroups = useCallback(async (category?: string) => {
    setLoadingGroups(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category && category !== "All Categories") {
        params.append("category", category)
      }

      const response = await fetch(`/api/community/groups?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`)
      }

      const data = await response.json()
      setGroups(data.groups || [])
    } catch (err) {
      console.error("Error fetching groups:", err)
      setError("Failed to load groups. Please try again later.")
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  // Fetch posts for a topic
  const fetchPosts = useCallback(
    async (topicId: string) => {
      setLoadingPosts(true)
      try {
        const response = await fetch(`/api/community/posts?topicId=${topicId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`)
        }

        const data = await response.json()
        setPosts(data.posts || [])
      } catch (err) {
        console.error("Error fetching posts:", err)
        toast({
          title: "Error",
          description: "Failed to load discussion posts. Please try again.",
          variant: "destructive",
        })
        setPosts([])
      } finally {
        setLoadingPosts(false)
      }
    },
    [toast],
  )

  // Load initial data
  useEffect(() => {
    fetchTopics(selectedCategory)
    fetchGroups()
  }, [fetchTopics, fetchGroups, selectedCategory])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTopics(selectedCategory, searchQuery)
  }

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    fetchTopics(category, searchQuery)
  }

  // Select a topic to view
  const selectTopic = (topic: Topic) => {
    setSelectedTopic(topic)
    fetchPosts(topic.id)

    // Update view count (optimistic update)
    setTopics(topics.map((t) => (t.id === topic.id ? { ...t, views: t.views + 1 } : t)))

    // In a real app, we would also update the view count in the database
    fetch(`/api/community/topics/${topic.id}/view`, {
      method: "POST",
    }).catch((err) => {
      console.error("Error updating view count:", err)
    })
  }

  const backToTopics = () => {
    setSelectedTopic(null)
  }

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like posts",
        variant: "destructive",
      })
      return
    }

    // Optimistic update
    const currentPost = posts.find((p) => p.id === postId)
    if (!currentPost) return

    const isCurrentlyLiked = currentPost.isLiked

    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
          : post,
      ),
    )

    // Update in database
    try {
      const response = await fetch("/api/community/likes", {
        method: isCurrentlyLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      })

      if (!response.ok) {
        throw new Error("Failed to update like")
      }
    } catch (err) {
      console.error("Error updating like:", err)

      // Revert optimistic update on error
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? { ...post, likes: isCurrentlyLiked ? post.likes + 1 : post.likes - 1, isLiked: isCurrentlyLiked }
            : post,
        ),
      )

      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLikeReply = (postId: string, replyId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like replies",
        variant: "destructive",
      })
      return
    }

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const updatedReplies = post.replies.map((reply) =>
            reply.id === replyId
              ? {
                  ...reply,
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  isLiked: !reply.isLiked,
                }
              : reply,
          )
          return { ...post, replies: updatedReplies }
        }
        return post
      }),
    )

    // In a real app, we would also update the like in the database
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join groups",
        variant: "destructive",
      })
      return
    }

    // Find the group
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    const isCurrentlyJoined = group.isJoined

    // Optimistic update
    setGroups(
      groups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            isJoined: !group.isJoined,
            memberCount: group.isJoined ? group.memberCount - 1 : group.memberCount + 1,
          }
        }
        return group
      }),
    )

    try {
      // Update in database
      const response = await fetch(`/api/community/groups/${groupId}/members`, {
        method: isCurrentlyJoined ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to update group membership")
      }

      toast({
        title: isCurrentlyJoined ? "Left group" : "Joined group",
        description: isCurrentlyJoined ? `You have left "${group.name}"` : `You have joined "${group.name}"`,
      })
    } catch (err) {
      console.error("Error updating group membership:", err)

      // Revert optimistic update on error
      setGroups(
        groups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              isJoined: isCurrentlyJoined,
              memberCount: isCurrentlyJoined ? group.memberCount + 1 : group.memberCount - 1,
            }
          }
          return group
        }),
      )

      toast({
        title: "Error",
        description: "Failed to update group membership. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateTopic = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a topic",
        variant: "destructive",
      })
      return
    }

    if (!newTopic.title.trim() || !newTopic.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmittingTopic(true)

    try {
      const response = await fetch("/api/community/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTopic),
      })

      if (!response.ok) {
        throw new Error("Failed to create topic")
      }

      const data = await response.json()

      if (data.success && data.topic) {
        // Add the new topic to the list
        setTopics([data.topic, ...topics])

        // Reset form and close dialog
        setShowNewTopicDialog(false)
        setNewTopic({
          title: "",
          description: "",
          category: "Bible Study",
          tags: "",
        })

        toast({
          title: "Topic created",
          description: "Your topic has been created successfully",
        })
      } else {
        throw new Error(data.error || "Failed to create topic")
      }
    } catch (err) {
      console.error("Error creating topic:", err)
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingTopic(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a group",
        variant: "destructive",
      })
      return
    }

    if (!newGroup.name.trim() || !newGroup.description.trim() || !newGroup.category.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmittingGroup(true)

    try {
      const response = await fetch("/api/community/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          category: newGroup.category,
          meetingTime: newGroup.meetingTime,
          location: newGroup.location,
          tags: newGroup.tags,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create group")
      }

      const data = await response.json()

      if (data.success && data.group) {
        // Add the new group to the list
        setGroups([data.group, ...groups])

        // Reset form and close dialog
        setShowNewGroupDialog(false)
        setNewGroup({
          name: "",
          description: "",
          meetingTime: "",
          location: "",
          category: "Bible Study",
          tags: "",
        })

        toast({
          title: "Group created",
          description: "Your group has been created successfully",
        })
      } else {
        throw new Error(data.error || "Failed to create group")
      }
    } catch (err) {
      console.error("Error creating group:", err)
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingGroup(false)
    }
  }

  const handleCreateReply = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply",
        variant: "destructive",
      })
      return
    }

    if (!newReply.trim() || !selectedTopic) {
      toast({
        title: "Empty reply",
        description: "Please enter a reply",
        variant: "destructive",
      })
      return
    }

    setSubmittingReply(true)

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          content: newReply,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create reply")
      }

      const data = await response.json()

      if (data.success && data.post) {
        // Add the new post to the list
        setPosts([...posts, data.post])

        // Clear the input
        setNewReply("")

        // Update topic reply count (optimistic update)
        setTopics(topics.map((t) => (t.id === selectedTopic.id ? { ...t, replies: t.replies + 1 } : t)))

        toast({
          title: "Reply posted",
          description: "Your reply has been posted successfully",
        })

        // Scroll to the bottom to see the new reply
        setTimeout(() => {
          discussionEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      } else {
        throw new Error(data.error || "Failed to create reply")
      }
    } catch (err) {
      console.error("Error creating reply:", err)
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingReply(false)
    }
  }

  // Function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">Community & Fellowship</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Connect with other believers, share your thoughts, and grow together in faith
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="forums" className="flex-1">
            Discussion Forums
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">
            Small Groups
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1">
            Local Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forums" className="space-y-4 mt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!selectedTopic ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full sm:w-auto">
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                <Button variant="default" onClick={() => setShowNewTopicDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Topic
                </Button>
              </div>

              <div className="space-y-4">
                {loadingTopics ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading topics...</span>
                  </div>
                ) : topics.length > 0 ? (
                  topics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => selectTopic(topic)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="hidden sm:flex h-10 w-10">
                            <AvatarImage src={topic.author.avatar || "/placeholder.svg"} alt={topic.author.name} />
                            <AvatarFallback>{topic.author.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-normal">
                                {topic.category}
                              </Badge>
                              <span className="text-sm text-gray-500">{formatDate(topic.createdAt)}</span>
                            </div>

                            <h3 className="text-lg font-semibold mt-1">{topic.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {topic.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {topic.tags &&
                                topic.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          <div className="hidden md:flex flex-col items-center justify-center text-center min-w-[80px]">
                            <div className="text-xl font-semibold">{topic.replies}</div>
                            <div className="text-xs text-gray-500">Replies</div>
                          </div>
                          <div className="hidden md:flex flex-col items-center justify-center text-center min-w-[80px]">
                            <div className="text-xl font-semibold">{topic.views}</div>
                            <div className="text-xs text-gray-500">Views</div>
                          </div>
                        </div>

                        {topic.lastReply && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={topic.lastReply.author.avatar || "/placeholder.svg"}
                                alt={topic.lastReply.author.name}
                              />
                              <AvatarFallback>{topic.lastReply.author.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              Last reply by <span className="font-medium">{topic.lastReply.author.name}</span> on{" "}
                              {formatDate(topic.lastReply.createdAt)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No topics found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchQuery
                          ? "No topics match your search. Try different keywords."
                          : "No topics in this category yet. Be the first to start a conversation!"}
                      </p>
                      <Button variant="outline" onClick={() => setShowNewTopicDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Topic
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <Button variant="ghost" onClick={backToTopics} className="mr-2">
                  &larr; Back
                </Button>
                <h2 className="text-xl font-semibold">{selectedTopic.title}</h2>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedTopic.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedTopic.category}</Badge>
                        <span className="text-sm text-gray-500">Posted on {formatDate(selectedTopic.createdAt)}</span>
                      </div>
                    </div>
                    <Avatar>
                      <AvatarImage
                        src={selectedTopic.author.avatar || "/placeholder.svg"}
                        alt={selectedTopic.author.name}
                      />
                      <AvatarFallback>{selectedTopic.author.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardDescription className="mt-4">{selectedTopic.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTopic.tags &&
                      selectedTopic.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                {loadingPosts ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading discussion...</span>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <Card key={post.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                            <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{post.author.name}</span>
                              <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                            </div>
                            <div className="mt-2 text-gray-800 dark:text-gray-200">{post.content}</div>
                            <div className="flex items-center gap-4 mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLikePost(post.id)
                                }}
                                className={`flex items-center gap-1 text-sm ${
                                  post.isLiked ? "text-blue-500" : "text-gray-500"
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{post.likes}</span>
                              </button>
                            </div>

                            {post.replies && post.replies.length > 0 && (
                              <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-4">
                                {post.replies.map((reply) => (
                                  <div key={reply.id} className="pt-2">
                                    <div className="flex gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={reply.author.avatar || "/placeholder.svg"}
                                          alt={reply.author.name}
                                        />
                                        <AvatarFallback>{reply.author.name.substring(0, 2)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{reply.author.name}</span>
                                          <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                        </div>
                                        <div className="mt-1 text-sm">{reply.content}</div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleLikeReply(post.id, reply.id)
                                          }}
                                          className={`flex items-center gap-1 text-xs mt-2 ${
                                            reply.isLiked ? "text-blue-500" : "text-gray-500"
                                          }`}
                                        >
                                          <ThumbsUp className="h-3 w-3" />
                                          <span>{reply.likes}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No replies yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to reply to this topic!</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Add Your Reply</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows={4}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost" onClick={backToTopics}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReply} disabled={submittingReply || !user}>
                    {submittingReply ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                </CardFooter>
              </Card>
              <div ref={discussionEndRef} />
            </div>
          )}

          <Dialog open={showNewTopicDialog} onOpenChange={setShowNewTopicDialog}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Share your questions, thoughts, or prayer requests with the community.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="topic-title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="topic-title"
                    placeholder="Enter a descriptive title"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="topic-description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="topic-description"
                    placeholder="Share more details about your topic"
                    value={newTopic.description}
                    onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="topic-category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={newTopic.category}
                    onValueChange={(value) => setNewTopic({ ...newTopic, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.slice(1).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="topic-tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <Input
                    id="topic-tags"
                    placeholder="Enter tags separated by commas"
                    value={newTopic.tags}
                    onChange={(e) => setNewTopic({ ...newTopic, tags: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Add relevant tags to help others find your topic (e.g., prayer, question, advice)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewTopicDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTopic} disabled={submittingTopic || !user}>
                  {submittingTopic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Topic"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Small Groups</h2>
            <Button onClick={() => setShowNewGroupDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </div>

          {loadingGroups ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading groups...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <Badge variant="outline">{group.memberCount} members</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="space-y-2 text-sm">
                        {group.schedule && (
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{group.schedule}</span>
                          </div>
                        )}
                        {group.location && (
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 text-gray-500 mr-2" />
                            <span>{group.location}</span>
                          </div>
                        )}
                      </div>
                      {group.tags && group.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {group.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center border-t pt-3">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={group.creator?.avatar || "/placeholder.svg"} alt={group.creator?.name} />
                          <AvatarFallback>{group.creator?.name?.substring(0, 2) || "UK"}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">Created by {group.creator?.name || "Unknown"}</span>
                      </div>
                      <Button
                        variant={group.isJoined ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleJoinGroup(group.id)}
                      >
                        {group.isJoined ? "Leave Group" : "Join Group"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No groups found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Be the first to create a group and invite others to join!
                      </p>
                      <Button variant="outline" onClick={() => setShowNewGroupDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Group
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Start a new small group and invite others to join your fellowship.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="group-name" className="text-sm font-medium">
                    Group Name *
                  </label>
                  <Input
                    id="group-name"
                    placeholder="Enter a name for your group"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-description" className="text-sm font-medium">
                    Description *
                  </label>
                  <Textarea
                    id="group-description"
                    placeholder="Describe the purpose and focus of your group"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-category" className="text-sm font-medium">
                    Category *
                  </label>
                  <Select
                    value={newGroup.category}
                    onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.slice(1).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-meeting-time" className="text-sm font-medium">
                    Meeting Time
                  </label>
                  <Input
                    id="group-meeting-time"
                    placeholder="e.g., Thursdays, 7:00 PM EST"
                    value={newGroup.meetingTime}
                    onChange={(e) => setNewGroup({ ...newGroup, meetingTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input
                    id="group-location"
                    placeholder="e.g., Online - Zoom, or physical address"
                    value={newGroup.location}
                    onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <Input
                    id="group-tags"
                    placeholder="Enter tags separated by commas"
                    value={newGroup.tags}
                    onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Add relevant tags to help others find your group (e.g., bible-study, prayer, youth)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={submittingGroup || !user}>
                  {submittingGroup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Local Events</h2>
            <Button onClick={() => (window.location.href = "/features/events")}>View All Events</Button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Check out these upcoming events from our community. Join us for fellowship, worship, and growth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Virtual Bible Study</CardTitle>
                  <CardDescription>Thursday, May 16, 2025 at 7:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Online - Zoom</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Join us for an in-depth study of Paul's letter to the Romans. All experience levels welcome!
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = "/features/events")}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Young Adults Fellowship</CardTitle>
                  <CardDescription>Saturday, May 18, 2025 at 6:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Community Center, 555 Fellowship Way</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    A casual gathering to discuss faith, life challenges, and build community with other young adults.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = "/features/events")}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="text-center pt-4">
              <Button onClick={() => (window.location.href = "/features/events")}>See All Events</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
