"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthButton } from "@/components/auth/auth-button"
import { Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

// Navigation items for the sidebar
const navItems = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/features",
    label: "Features",
  },
  {
    href: "/features/bible",
    label: "Bible",
  },
  {
    href: "/features/scripture-qa",
    label: "Scripture Q&A",
  },
  {
    href: "/features/memory-game",
    label: "Memory Game",
  },
  {
    href: "/features/community",
    label: "Community",
  },
  {
    href: "/features/events",
    label: "Events",
  },
  {
    href: "/features/worship-music",
    label: "Worship Music",
  },
  {
    href: "/saved",
    label: "Saved Items",
  },
  {
    href: "/profile",
    label: "Profile",
  },
]

export function Header() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

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

  // Use effect to ensure only one header exists
  useEffect(() => {
    // Find all headers in the document
    const headers = document.querySelectorAll("header")

    // If there's more than one header and our ref is set
    if (headers.length > 1 && headerRef.current) {
      // Keep only the current header
      headers.forEach((header) => {
        if (header !== headerRef.current) {
          header.remove()
        }
      })
    }
  }, [])

  return (
    <header ref={headerRef} className="border-b bg-background sticky top-0 z-40 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "px-2 py-1 rounded-md text-lg",
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="font-bold text-xl flex items-center">
            <span className="text-blue-600 dark:text-blue-400">Faith+</span>
          </Link>

          {/* Page title - shows current section */}
          <div className="text-lg font-medium ml-2 hidden sm:block">{getPageTitle()}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>

      {searchOpen && (
        <div className="container py-2 pb-3 border-t border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search Faith+..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              aria-label="Search Faith+"
            />
          </div>
        </div>
      )}
    </header>
  )
}
