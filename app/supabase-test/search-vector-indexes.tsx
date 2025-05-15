"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"

interface SearchResult {
  id: string
  content: string
  persona_id: string
  created_at: string
  metadata: any
}

export function SearchVectorIndexes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vector-indexes/search?term=${encodeURIComponent(searchTerm)}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Search Vector Indexes</h2>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={loading || !searchTerm.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </form>

      {error && (
        <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {searched && !loading && !error && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Search Results ({results.length})</h3>

          {results.length > 0 ? (
            <div className="grid gap-4">
              {results.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">ID: {item.id}</span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium">Persona ID: {item.persona_id || "N/A"}</p>
                    <p className="mt-1 text-sm">{item.content || "No content"}</p>
                  </div>
                  <div className="mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 dark:text-blue-400">View Metadata</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-auto max-h-40">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <p>No results found for "{searchTerm}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
