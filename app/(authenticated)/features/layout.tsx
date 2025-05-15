import type React from "react"
export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Remove any Header component if it exists here */}
      {children}
    </>
  )
}
