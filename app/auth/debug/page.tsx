import { Header } from "@/components/header"
import { AuthDebug } from "@/components/auth/auth-debug"

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
          <AuthDebug />
        </div>
      </main>
    </div>
  )
}
