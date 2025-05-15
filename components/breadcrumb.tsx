"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()

  if (!pathname || pathname === "/") return null

  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
    }
  })

  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
      <ol className="flex items-center space-x-1">
        <li>
          <Link href="/" className="flex items-center hover:text-gray-900 dark:hover:text-gray-100">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.href}>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1" />
            </li>
            <li>
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">{breadcrumb.label}</span>
              ) : (
                <Link href={breadcrumb.href} className="hover:text-gray-900 dark:hover:text-gray-100">
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
