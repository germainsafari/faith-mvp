import { Header } from "@/components/header"
import { UserProfile } from "@/components/user-profile"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to login
  if (!session) {
    console.log("No session found in profile page, redirecting to login")
    redirect("/auth/sign-in?redirect=/profile")
  }

  try {
    // Fetch user profile data
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      // If profile doesn't exist, create it
      if (error.code === "PGRST116") {
        // Record not found, create a new profile
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([
            {
              id: session.user.id,
              full_name: session.user.user_metadata.full_name || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .single()

        if (insertError) {
          console.error("Error creating profile:", insertError)
        }
      }
    }

    // Fetch profile again if it was just created
    const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        <main className="flex-grow container mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              }
            >
              <UserProfile
                initialProfile={
                  updatedProfile || {
                    id: session.user.id,
                    full_name: session.user.user_metadata.full_name || "",
                    avatar_url: null,
                    preferences: {},
                  }
                }
                userEmail={session.user.email || ""}
              />
            </Suspense>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error in profile page:", error)
    // Return a fallback UI
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Header />
        <main className="flex-grow container mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Profile</h2>
              <p className="mt-2">There was an error loading your profile. Please try again later.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }
}
