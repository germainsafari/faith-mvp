"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, BookOpen, MessageSquare, Users, Calendar } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/features/bible",
      label: "Bible",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      href: "/features/scripture-qa",
      label: "Q&A",
      icon: <MessageSquare className="h-5 w-5" />,
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
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
      <nav className="flex justify-around items-center h-16 max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn("flex items-center justify-center", isActive && "relative")}>
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
