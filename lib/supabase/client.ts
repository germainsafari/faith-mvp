import { createBrowserClient } from "@supabase/ssr"

// Create a single supabase client for the entire client-side application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Create the client with proper cookie handling
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Add a helper function to check if a user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}
