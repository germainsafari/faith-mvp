"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"

export function MainLayout({ children }: { children: React.ReactNode }) {
  // Use state to control rendering to prevent hydration issues
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-16 border-b bg-background"></div>
        <main className="flex-1 pb-20">{children}</main>
        <div className="h-16 fixed bottom-0 left-0 right-0 bg-background border-t"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
