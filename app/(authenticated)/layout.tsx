import type React from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Breadcrumb } from "@/components/breadcrumb"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/features")
  }

  return (
    <div className="container py-6">
      <Breadcrumb />
      {children}
    </div>
  )
}
