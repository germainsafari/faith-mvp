import { Suspense } from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { Header } from "@/components/header"
import { Loader2 } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            }
          >
            <SignInForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
