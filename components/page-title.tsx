"use client"

import { usePathname } from "next/navigation"

export function PageTitle() {
  const pathname = usePathname()

  // Function to get the current page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Home"
    if (pathname === "/features") return "Features"
    if (pathname === "/features/bible") return "Bible"
    if (pathname === "/features/scripture-qa") return "Scripture Q&A"
    if (pathname === "/features/memory-game") return "Memory Game"
    if (pathname === "/features/community") return "Community"
    if (pathname === "/features/events") return "Events"
    if (pathname === "/features/worship-music") return "Worship Music"
    if (pathname === "/saved") return "Saved Items"
    if (pathname === "/profile") return "Profile"

    // Extract the last part of the path for other pages
    const parts = pathname?.split("/") || []
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : "Home"
    }
    return "Home"
  }

  return <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
}
