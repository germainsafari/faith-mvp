"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export function AuthDebug() {
  const { user, session, refreshSession } = useAuth()
  const [serverSession, setServerSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchServerSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auth/debug")
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      setServerSession(data)
    } catch (error) {
      console.error("Error fetching server session:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    try {
      setLoading(true)
      await refreshSession()
      await fetchServerSession()
    } catch (error) {
      console.error("Error refreshing session:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerSession()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>View client and server authentication state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Client Auth State</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
            <pre className="text-xs">
              {JSON.stringify(
                {
                  authenticated: !!user,
                  user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        metadata: user.user_metadata,
                      }
                    : null,
                  session: session
                    ? {
                        expires_at: session.expires_at,
                        current_time: Math.floor(Date.now() / 1000),
                        is_expired: session.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : null,
                        time_until_expiry: session.expires_at
                          ? `${Math.floor((session.expires_at - Math.floor(Date.now() / 1000)) / 60)} minutes`
                          : null,
                      }
                    : null,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Server Auth State</h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
              <pre className="text-xs">{JSON.stringify(serverSession, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={fetchServerSession} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button onClick={handleRefreshSession} disabled={loading}>
            Refresh Session
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
