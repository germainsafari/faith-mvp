"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, MessageSquare, GamepadIcon, Users, Calendar, Music, User, Bookmark, Menu } from "lucide-react"

interface SidebarContentProps {
  onItemClick?: () => void
}

export function SidebarContent({ onItemClick }: SidebarContentProps) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/features",
      label: "Features",
      icon: <Menu className="h-5 w-5" />,
    },
    {
      href: "/features/scripture-qa",
      label: "Scripture Q&A",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: "/features/bible",
      label: "Bible Search",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      href: "/features/memory-game",
      label: "Memory Game",
      icon: <GamepadIcon className="h-5 w-5" />,
    },
    {
      href: "/features/community",
      label: "Community",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/features/events",
      label: "Events",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: "/features/worship-music",
      label: "Worship Music",
      icon: <Music className="h-5 w-5" />,
    },
    {
      href: "/saved",
      label: "Saved Items",
      icon: <Bookmark className="h-5 w-5" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto py-2 max-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col space-y-1 px-2">
        {routes.map((route) => {
          const isActive = pathname === route.href || (route.href !== "/" && pathname?.startsWith(route.href))

          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {route.icon}
              {route.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
