import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { SpotifyProvider } from "@/providers/spotify-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Faith+",
  description: "A platform for spiritual growth and community",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SpotifyProvider>{children}</SpotifyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
