"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchAvailableBibles, BIBLE_VERSIONS } from "@/lib/api-bible"

interface BibleTranslationSelectorProps {
  onSelect: (bibleId: string) => void
  defaultBibleId?: string
}

export default function BibleTranslationSelector({
  onSelect,
  defaultBibleId = "de4e12af7f28f599-02", // Default to ESV
}: BibleTranslationSelectorProps) {
  const [bibles, setBibles] = useState<{ id: string; name: string }[]>(BIBLE_VERSIONS)
  const [selectedBible, setSelectedBible] = useState(defaultBibleId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBibles() {
      try {
        const availableBibles = await fetchAvailableBibles()
        if (availableBibles && availableBibles.length > 0) {
          // Map to simpler format
          const formattedBibles = availableBibles.map((bible) => ({
            id: bible.id,
            name: bible.name,
          }))
          setBibles(formattedBibles)
        }
      } catch (error) {
        console.error("Failed to load Bible translations:", error)
        // Keep using the default BIBLE_VERSIONS
      } finally {
        setLoading(false)
      }
    }

    loadBibles()
  }, [])

  const handleSelectBible = (value: string) => {
    setSelectedBible(value)
    onSelect(value)
  }

  return (
    <div className="w-full max-w-xs">
      <Select disabled={loading} value={selectedBible} onValueChange={handleSelectBible}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading translations..." : "Select Bible translation"} />
        </SelectTrigger>
        <SelectContent>
          {bibles.map((bible) => (
            <SelectItem key={bible.id} value={bible.id}>
              {bible.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
