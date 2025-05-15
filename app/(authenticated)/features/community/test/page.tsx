"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"

interface TestResult {
  name: string
  status: "success" | "error" | "pending"
  message?: string
  data?: any
}

export default function CommunityTestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("topics")
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [createdTopicId, setCreatedTopicId] = useState<string | null>(null)
  const [createdPostId, setCreatedPostId] = useState<string | null>(null)
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)

  // Form states
  const [topicTitle, setTopicTitle] = useState("Test Topic")
  const [topicDescription, setTopicDescription] = useState("This is a test topic created for testing purposes.")
  const [topicCategory, setTopicCategory] = useState("Bible Study")
  const [topicTags, setTopicTags] = useState("test, automation")

  const [postContent, setPostContent] = useState("This is a test reply to the topic.")

  const [groupName, setGroupName] = useState("Test Group")
  const [groupDescription, setGroupDescription] = useState("This is a test group created for testing purposes.")
  const [groupCategory, setGroupCategory] = useState("Bible Study")
  const [groupSchedule, setGroupSchedule] = useState("Mondays at 7:00 PM")

  useEffect(() => {
    // Clear results when changing tabs
    setResults([])
  }, [activeTab])

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result])
  }

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults((prev) => {
      const newResults = [...prev]
      newResults[index] = { ...newResults[index], ...updates }
      return newResults
    })
  }

  const clearResults = () => {
    setResults([])
    setCreatedTopicId(null)
    setCreatedPostId(null)
    setCreatedGroupId(null)
  }

  const runTopicsTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to run tests.",
        variant: "destructive",
      })
      return
    }

    setIsRunningTests(true)
    clearResults()

    try {
      // Test 1: Create a topic
      addResult({
        name: "Create Topic",
        status: "pending",
        message: "Creating a new topic...",
      })

      const createTopicResponse = await fetch("/api/community/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: topicTitle,
          description: topicDescription,
          category: topicCategory,
          tags: topicTags,
        }),
      })

      const createTopicData = await createTopicResponse.json()

      if (!createTopicResponse.ok) {
        updateResult(0, {
          status: "error",
          message: `Failed to create topic: ${createTopicData.error || createTopicResponse.statusText}`,
        })
        throw new Error("Topic creation failed")
      }

      const topicId = createTopicData.topic?.id
      setCreatedTopicId(topicId)

      updateResult(0, {
        status: "success",
        message: `Topic created successfully with ID: ${topicId}`,
        data: createTopicData.topic,
      })

      // Test 2: Fetch the created topic
      addResult({
        name: "Fetch Topics",
        status: "pending",
        message: "Fetching topics to verify creation...",
      })

      const fetchTopicsResponse = await fetch("/api/community/topics")
      const fetchTopicsData = await fetchTopicsResponse.json()

      if (!fetchTopicsResponse.ok) {
        updateResult(1, {
          status: "error",
          message: `Failed to fetch topics: ${fetchTopicsData.error || fetchTopicsResponse.statusText}`,
        })
        throw new Error("Topic fetching failed")
      }

      const foundTopic = fetchTopicsData.topics.find((t: any) => t.id === topicId)

      if (!foundTopic) {
        updateResult(1, {
          status: "error",
          message: "Created topic not found in the fetched topics",
        })
        throw new Error("Topic not found")
      }

      updateResult(1, {
        status: "success",
        message: "Topic successfully fetched and verified",
        data: foundTopic,
      })

      // Test 3: Create a post (reply) to the topic
      addResult({
        name: "Create Post",
        status: "pending",
        message: "Creating a new post...",
      })

      const createPostResponse = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          content: postContent,
        }),
      })

      const createPostData = await createPostResponse.json()

      if (!createPostResponse.ok) {
        updateResult(2, {
          status: "error",
          message: `Failed to create post: ${createPostData.error || createPostResponse.statusText}`,
        })
        throw new Error("Post creation failed")
      }

      const postId = createPostData.post?.id
      setCreatedPostId(postId)

      updateResult(2, {
        status: "success",
        message: `Post created successfully with ID: ${postId}`,
        data: createPostData.post,
      })

      // Test 4: Fetch posts for the topic
      addResult({
        name: "Fetch Posts",
        status: "pending",
        message: "Fetching posts to verify creation...",
      })

      const fetchPostsResponse = await fetch(`/api/community/posts?topicId=${topicId}`)
      const fetchPostsData = await fetchPostsResponse.json()

      if (!fetchPostsResponse.ok) {
        updateResult(3, {
          status: "error",
          message: `Failed to fetch posts: ${fetchPostsData.error || fetchPostsResponse.statusText}`,
        })
        throw new Error("Post fetching failed")
      }

      const foundPost = fetchPostsData.posts.find((p: any) => p.id === postId)

      if (!foundPost) {
        updateResult(3, {
          status: "error",
          message: "Created post not found in the fetched posts",
        })
        throw new Error("Post not found")
      }

      updateResult(3, {
        status: "success",
        message: "Post successfully fetched and verified",
        data: foundPost,
      })

      // Test 5: Like the post
      addResult({
        name: "Like Post",
        status: "pending",
        message: "Liking the post...",
      })

      const likePostResponse = await fetch("/api/community/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
        }),
      })

      const likePostData = await likePostResponse.json()

      if (!likePostResponse.ok) {
        updateResult(4, {
          status: "error",
          message: `Failed to like post: ${likePostData.error || likePostResponse.statusText}`,
        })
        throw new Error("Post liking failed")
      }

      updateResult(4, {
        status: "success",
        message: "Post liked successfully",
        data: likePostData,
      })

      // Test 6: Verify like count
      addResult({
        name: "Verify Like Count",
        status: "pending",
        message: "Verifying like count...",
      })

      const verifyLikeResponse = await fetch(`/api/community/posts?topicId=${topicId}`)
      const verifyLikeData = await verifyLikeResponse.json()

      if (!verifyLikeResponse.ok) {
        updateResult(5, {
          status: "error",
          message: `Failed to verify like count: ${verifyLikeData.error || verifyLikeResponse.statusText}`,
        })
        throw new Error("Like verification failed")
      }

      const likedPost = verifyLikeData.posts.find((p: any) => p.id === postId)

      if (!likedPost) {
        updateResult(5, {
          status: "error",
          message: "Post not found when verifying like count",
        })
        throw new Error("Post not found")
      }

      if (likedPost.likes !== 1 || !likedPost.isLiked) {
        updateResult(5, {
          status: "error",
          message: `Like count verification failed. Expected likes: 1, got: ${likedPost.likes}. Expected isLiked: true, got: ${likedPost.isLiked}`,
        })
        throw new Error("Like count verification failed")
      }

      updateResult(5, {
        status: "success",
        message: "Like count verified successfully",
        data: likedPost,
      })

      // Test 7: Unlike the post
      addResult({
        name: "Unlike Post",
        status: "pending",
        message: "Unliking the post...",
      })

      const unlikePostResponse = await fetch(`/api/community/likes?postId=${postId}`, {
        method: "DELETE",
      })

      const unlikePostData = await unlikePostResponse.json()

      if (!unlikePostResponse.ok) {
        updateResult(6, {
          status: "error",
          message: `Failed to unlike post: ${unlikePostData.error || unlikePostResponse.statusText}`,
        })
        throw new Error("Post unliking failed")
      }

      updateResult(6, {
        status: "success",
        message: "Post unliked successfully",
        data: unlikePostData,
      })

      // Test 8: Verify unlike
      addResult({
        name: "Verify Unlike",
        status: "pending",
        message: "Verifying unlike...",
      })

      const verifyUnlikeResponse = await fetch(`/api/community/posts?topicId=${topicId}`)
      const verifyUnlikeData = await verifyUnlikeResponse.json()

      if (!verifyUnlikeResponse.ok) {
        updateResult(7, {
          status: "error",
          message: `Failed to verify unlike: ${verifyUnlikeData.error || verifyUnlikeResponse.statusText}`,
        })
        throw new Error("Unlike verification failed")
      }

      const unlikedPost = verifyUnlikeData.posts.find((p: any) => p.id === postId)

      if (!unlikedPost) {
        updateResult(7, {
          status: "error",
          message: "Post not found when verifying unlike",
        })
        throw new Error("Post not found")
      }

      if (unlikedPost.likes !== 0 || unlikedPost.isLiked) {
        updateResult(7, {
          status: "error",
          message: `Unlike verification failed. Expected likes: 0, got: ${unlikedPost.likes}. Expected isLiked: false, got: ${unlikedPost.isLiked}`,
        })
        throw new Error("Unlike verification failed")
      }

      updateResult(7, {
        status: "success",
        message: "Unlike verified successfully",
        data: unlikedPost,
      })

      // All tests passed
      toast({
        title: "Tests Completed",
        description: "All topic and post tests passed successfully!",
      })
    } catch (error) {
      console.error("Test error:", error)
      toast({
        title: "Test Failed",
        description: error.message || "An error occurred during testing",
        variant: "destructive",
      })
    } finally {
      setIsRunningTests(false)
    }
  }

  const runGroupsTests = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to run tests.",
        variant: "destructive",
      })
      return
    }

    setIsRunningTests(true)
    clearResults()

    try {
      // Test 1: Create a group
      addResult({
        name: "Create Group",
        status: "pending",
        message: "Creating a new group...",
      })

      const createGroupResponse = await fetch("/api/community/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          category: groupCategory,
          schedule: groupSchedule,
        }),
      })

      const createGroupData = await createGroupResponse.json()

      if (!createGroupResponse.ok) {
        updateResult(0, {
          status: "error",
          message: `Failed to create group: ${createGroupData.error || createGroupResponse.statusText}`,
        })
        throw new Error("Group creation failed")
      }

      const groupId = createGroupData.group?.id
      setCreatedGroupId(groupId)

      updateResult(0, {
        status: "success",
        message: `Group created successfully with ID: ${groupId}`,
        data: createGroupData.group,
      })

      // Test 2: Fetch the created group
      addResult({
        name: "Fetch Groups",
        status: "pending",
        message: "Fetching groups to verify creation...",
      })

      const fetchGroupsResponse = await fetch("/api/community/groups")
      const fetchGroupsData = await fetchGroupsResponse.json()

      if (!fetchGroupsResponse.ok) {
        updateResult(1, {
          status: "error",
          message: `Failed to fetch groups: ${fetchGroupsData.error || fetchGroupsResponse.statusText}`,
        })
        throw new Error("Group fetching failed")
      }

      const foundGroup = fetchGroupsData.groups.find((g: any) => g.id === groupId)

      if (!foundGroup) {
        updateResult(1, {
          status: "error",
          message: "Created group not found in the fetched groups",
        })
        throw new Error("Group not found")
      }

      updateResult(1, {
        status: "success",
        message: "Group successfully fetched and verified",
        data: foundGroup,
      })

      // Test 3: Leave the group (creator is automatically a member)
      addResult({
        name: "Leave Group",
        status: "pending",
        message: "Leaving the group...",
      })

      const leaveGroupResponse = await fetch(`/api/community/groups/${groupId}/members`, {
        method: "DELETE",
      })

      const leaveGroupData = await leaveGroupResponse.json()

      if (!leaveGroupResponse.ok) {
        updateResult(2, {
          status: "error",
          message: `Failed to leave group: ${leaveGroupData.error || leaveGroupResponse.statusText}`,
        })
        throw new Error("Group leaving failed")
      }

      updateResult(2, {
        status: "success",
        message: "Left group successfully",
        data: leaveGroupData,
      })

      // Test 4: Verify group membership
      addResult({
        name: "Verify Group Membership",
        status: "pending",
        message: "Verifying group membership...",
      })

      const verifyMembershipResponse = await fetch("/api/community/groups")
      const verifyMembershipData = await verifyMembershipResponse.json()

      if (!verifyMembershipResponse.ok) {
        updateResult(3, {
          status: "error",
          message: `Failed to verify membership: ${verifyMembershipData.error || verifyMembershipResponse.statusText}`,
        })
        throw new Error("Membership verification failed")
      }

      const updatedGroup = verifyMembershipData.groups.find((g: any) => g.id === groupId)

      if (!updatedGroup) {
        updateResult(3, {
          status: "error",
          message: "Group not found when verifying membership",
        })
        throw new Error("Group not found")
      }

      if (updatedGroup.isJoined) {
        updateResult(3, {
          status: "error",
          message: `Membership verification failed. Expected isJoined: false, got: ${updatedGroup.isJoined}`,
        })
        throw new Error("Membership verification failed")
      }

      updateResult(3, {
        status: "success",
        message: "Group membership verified successfully",
        data: updatedGroup,
      })

      // Test 5: Join the group
      addResult({
        name: "Join Group",
        status: "pending",
        message: "Joining the group...",
      })

      const joinGroupResponse = await fetch(`/api/community/groups/${groupId}/members`, {
        method: "POST",
      })

      const joinGroupData = await joinGroupResponse.json()

      if (!joinGroupResponse.ok) {
        updateResult(4, {
          status: "error",
          message: `Failed to join group: ${joinGroupData.error || joinGroupResponse.statusText}`,
        })
        throw new Error("Group joining failed")
      }

      updateResult(4, {
        status: "success",
        message: "Joined group successfully",
        data: joinGroupData,
      })

      // Test 6: Verify group membership after joining
      addResult({
        name: "Verify Group Membership After Joining",
        status: "pending",
        message: "Verifying group membership after joining...",
      })

      const verifyJoinResponse = await fetch("/api/community/groups")
      const verifyJoinData = await verifyJoinResponse.json()

      if (!verifyJoinResponse.ok) {
        updateResult(5, {
          status: "error",
          message: `Failed to verify join: ${verifyJoinData.error || verifyJoinResponse.statusText}`,
        })
        throw new Error("Join verification failed")
      }

      const joinedGroup = verifyJoinData.groups.find((g: any) => g.id === groupId)

      if (!joinedGroup) {
        updateResult(5, {
          status: "error",
          message: "Group not found when verifying join",
        })
        throw new Error("Group not found")
      }

      if (!joinedGroup.isJoined) {
        updateResult(5, {
          status: "error",
          message: `Join verification failed. Expected isJoined: true, got: ${joinedGroup.isJoined}`,
        })
        throw new Error("Join verification failed")
      }

      updateResult(5, {
        status: "success",
        message: "Group join verified successfully",
        data: joinedGroup,
      })

      // All tests passed
      toast({
        title: "Tests Completed",
        description: "All group tests passed successfully!",
      })
    } catch (error) {
      console.error("Test error:", error)
      toast({
        title: "Test Failed",
        description: error.message || "An error occurred during testing",
        variant: "destructive",
      })
    } finally {
      setIsRunningTests(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Community Features Test</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the community features to ensure data is being properly persisted.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="topics" className="flex-1">
            Topics & Posts Tests
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">
            Groups Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Configure the test parameters for topics and posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="topic-title" className="text-sm font-medium">
                  Topic Title
                </label>
                <Input
                  id="topic-title"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  disabled={isRunningTests}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="topic-description" className="text-sm font-medium">
                  Topic Description
                </label>
                <Textarea
                  id="topic-description"
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  disabled={isRunningTests}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="topic-category" className="text-sm font-medium">
                    Topic Category
                  </label>
                  <Select value={topicCategory} onValueChange={setTopicCategory} disabled={isRunningTests}>
                    <SelectTrigger id="topic-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bible Study">Bible Study</SelectItem>
                      <SelectItem value="Prayer Requests">Prayer Requests</SelectItem>
                      <SelectItem value="Resources">Resources</SelectItem>
                      <SelectItem value="Testimonies">Testimonies</SelectItem>
                      <SelectItem value="Theology">Theology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="topic-tags" className="text-sm font-medium">
                    Topic Tags (comma separated)
                  </label>
                  <Input
                    id="topic-tags"
                    value={topicTags}
                    onChange={(e) => setTopicTags(e.target.value)}
                    disabled={isRunningTests}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="post-content" className="text-sm font-medium">
                  Post Content
                </label>
                <Textarea
                  id="post-content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  disabled={isRunningTests}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runTopicsTests} disabled={isRunningTests}>
                {isRunningTests ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Topics & Posts Tests"
                )}
              </Button>
            </CardFooter>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Results of the topics and posts tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />}
                          {result.status === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                          {result.status === "pending" && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                          <h3 className="font-medium">{result.name}</h3>
                        </div>
                        <Badge
                          variant={
                            result.status === "success"
                              ? "success"
                              : result.status === "error"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {result.status === "success" ? "Success" : result.status === "error" ? "Error" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{result.message}</p>
                      {result.data && (
                        <div className="mt-2">
                          <Separator className="my-2" />
                          <details>
                            <summary className="cursor-pointer text-sm font-medium">View Data</summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={clearResults} disabled={isRunningTests}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>Configure the test parameters for groups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="group-name" className="text-sm font-medium">
                  Group Name
                </label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={isRunningTests}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="group-description" className="text-sm font-medium">
                  Group Description
                </label>
                <Textarea
                  id="group-description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  disabled={isRunningTests}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="group-category" className="text-sm font-medium">
                    Group Category
                  </label>
                  <Select value={groupCategory} onValueChange={setGroupCategory} disabled={isRunningTests}>
                    <SelectTrigger id="group-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bible Study">Bible Study</SelectItem>
                      <SelectItem value="Prayer Requests">Prayer Requests</SelectItem>
                      <SelectItem value="Resources">Resources</SelectItem>
                      <SelectItem value="Testimonies">Testimonies</SelectItem>
                      <SelectItem value="Theology">Theology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="group-schedule" className="text-sm font-medium">
                    Group Schedule
                  </label>
                  <Input
                    id="group-schedule"
                    value={groupSchedule}
                    onChange={(e) => setGroupSchedule(e.target.value)}
                    disabled={isRunningTests}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runGroupsTests} disabled={isRunningTests}>
                {isRunningTests ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Groups Tests"
                )}
              </Button>
            </CardFooter>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Results of the groups tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />}
                          {result.status === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                          {result.status === "pending" && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                          <h3 className="font-medium">{result.name}</h3>
                        </div>
                        <Badge
                          variant={
                            result.status === "success"
                              ? "success"
                              : result.status === "error"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {result.status === "success" ? "Success" : result.status === "error" ? "Error" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{result.message}</p>
                      {result.data && (
                        <div className="mt-2">
                          <Separator className="my-2" />
                          <details>
                            <summary className="cursor-pointer text-sm font-medium">View Data</summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={clearResults} disabled={isRunningTests}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
