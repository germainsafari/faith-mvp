import { createServerSupabaseClient } from "./server"

export async function fetchVectorIndexes(limit = 10) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("vector_indexes").select("*").limit(limit)

    if (error) {
      console.error("Error fetching vector indexes:", error)
      throw error
    }

    return { data }
  } catch (error) {
    console.error("Exception fetching vector indexes:", error)
    throw error
  }
}

export async function fetchVectorIndexById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("vector_indexes").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching vector index with ID ${id}:`, error)
      throw error
    }

    return { data }
  } catch (error) {
    console.error(`Exception fetching vector index with ID ${id}:`, error)
    throw error
  }
}

export async function searchVectorIndexesByContent(searchTerm: string, limit = 10) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("vector_indexes")
      .select("*")
      .ilike("content", `%${searchTerm}%`)
      .limit(limit)

    if (error) {
      console.error(`Error searching vector indexes for "${searchTerm}":`, error)
      throw error
    }

    return { data }
  } catch (error) {
    console.error(`Exception searching vector indexes for "${searchTerm}":`, error)
    throw error
  }
}
