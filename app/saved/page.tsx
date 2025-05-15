import { Header } from "@/components/header"
import { SavedItems } from "@/components/saved-items"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function SavedItemsPage() {
  const supabase = createServerSupabaseClient()

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to login
  if (!session) {
    console.log("No session found in saved items page, redirecting to login")
    redirect("/auth/sign-in?redirect=/saved")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            }
          >
            <SavedItems userId={session.user.id} />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
