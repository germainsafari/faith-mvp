import { fetchVectorIndexes } from "@/lib/supabase/data-operations"

export async function VectorIndexes() {
  try {
    const { data } = await fetchVectorIndexes()

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Vector Indexes</h2>
        {data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">ID: {item.id}</span>
                  <span className="text-sm text-gray-500">
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Persona ID: {item.persona_id || "N/A"}</p>
                  <p className="mt-1 text-sm line-clamp-2">{item.content || "No content"}</p>
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
            <p>No vector indexes found in the database.</p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Vector Indexes</h2>
        <p className="mt-2">There was an error fetching data from the vector_indexes table.</p>
        <p className="mt-1 text-sm text-red-500">{error instanceof Error ? error.message : "Unknown error occurred"}</p>
      </div>
    )
  }
}
