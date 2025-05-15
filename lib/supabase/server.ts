import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { CookieOptions } from "@supabase/ssr"

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // This might fail in middleware or other contexts
          console.error(`Error setting cookie ${name}:`, error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // This might fail in middleware or other contexts
          console.error(`Error removing cookie ${name}:`, error)
        }
      },
    },
  })
}

// Helper function to check if a user is authenticated on the server
export async function isAuthenticatedOnServer() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getSession()
  return !!data.session
}
