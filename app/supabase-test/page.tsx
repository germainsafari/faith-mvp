import { Header } from "@/components/header"
import { VectorIndexes } from "./vector-indexes"
import { SearchVectorIndexes } from "./search-vector-indexes"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SupabaseTestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Supabase Integration Test</h1>
            <p className="text-gray-600 dark:text-gray-300">
              This page demonstrates the integration between Next.js and Supabase, showing data from your database.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database Connection Test</CardTitle>
              <CardDescription>
                Testing connection to the Supabase database and retrieving data from the vector_indexes table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="browse">
                <TabsList className="mb-4">
                  <TabsTrigger value="browse">Browse Data</TabsTrigger>
                  <TabsTrigger value="search">Search Data</TabsTrigger>
                  <TabsTrigger value="connection">Connection Info</TabsTrigger>
                </TabsList>

                <TabsContent value="browse">
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    }
                  >
                    <VectorIndexes />
                  </Suspense>
                </TabsContent>

                <TabsContent value="search">
                  <SearchVectorIndexes />
                </TabsContent>

                <TabsContent value="connection">
                  <ConnectionInfo />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function ConnectionInfo() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Connection Information</h2>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <h3 className="font-medium text-green-700 dark:text-green-400">Environment Variables</h3>
          <p className="mt-1 text-sm">The following environment variables are used for the Supabase connection:</p>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Database Schema</h3>
          <p className="mt-1 text-sm">This test page is interacting with the following tables:</p>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>
              <strong>vector_indexes</strong> - Stores vector embeddings and related data
            </li>
            <li>
              <strong>profiles</strong> - Stores user profile information
            </li>
            <li>
              <strong>saved_verses</strong> - Stores Bible verses saved by users
            </li>
            <li>
              <strong>saved_churches</strong> - Stores churches saved by users
            </li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <h3 className="font-medium text-blue-700 dark:text-blue-400">Testing the Connection</h3>
          <p className="mt-1 text-sm">You can test the API connection directly by visiting:</p>
          <code className="mt-2 block p-2 bg-gray-100 dark:bg-gray-900 rounded text-sm">/api/auth/test</code>
          <p className="mt-2 text-sm">This endpoint will return information about the Supabase connection status.</p>
        </div>
      </div>
    </div>
  )
}
