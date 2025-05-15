import { NextResponse } from "next/server"

// API.Bible configuration
const API_BIBLE_URL = "https://api.scripture.api.bible/v1"
const API_BIBLE_KEY = "2fddf74fe309988d953502eab8d82c39"
const BIBLE_ID = "de4e12af7f28f599-02" // English Standard Version (ESV)

// Fallback verses for when the API fails
const fallbackVerses = [
  {
    book_name: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
    reference: "John 3:16",
  },
  {
    book_name: "Romans",
    chapter: 8,
    verse: 28,
    text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
    reference: "Romans 8:28",
  },
  {
    book_name: "Philippians",
    chapter: 4,
    verse: 13,
    text: "I can do all things through him who strengthens me.",
    reference: "Philippians 4:13",
  },
  {
    book_name: "Psalm",
    chapter: 23,
    verse: 1,
    text: "The LORD is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
  },
  {
    book_name: "Proverbs",
    chapter: 3,
    verse: 5,
    text: "Trust in the LORD with all your heart, and do not lean on your own understanding.",
    reference: "Proverbs 3:5",
  },
]

// Function to get relevant fallback verses based on search query
function getRelevantFallbackVerses(query: string) {
  const lowerQuery = query.toLowerCase()

  // Check if query contains any keywords we can match
  if (lowerQuery.includes("love") || lowerQuery.includes("god") || lowerQuery.includes("world")) {
    return [fallbackVerses[0]] // John 3:16
  } else if (lowerQuery.includes("good") || lowerQuery.includes("purpose")) {
    return [fallbackVerses[1]] // Romans 8:28
  } else if (lowerQuery.includes("strength") || lowerQuery.includes("can")) {
    return [fallbackVerses[2]] // Philippians 4:13
  } else if (lowerQuery.includes("shepherd") || lowerQuery.includes("lord")) {
    return [fallbackVerses[3]] // Psalm 23:1
  } else if (lowerQuery.includes("trust") || lowerQuery.includes("heart")) {
    return [fallbackVerses[4]] // Proverbs 3:5
  }

  // If no specific match, return all fallback verses
  return fallbackVerses
}

/**
 * Strips HTML tags from a string and returns clean text
 * @param html HTML string to clean
 * @returns Plain text without HTML tags
 */
function stripHtmlTags(html: string): string {
  if (!html) return ""

  // Server-side HTML stripping
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`Searching for: "${query}" using Bible ID: ${BIBLE_ID}`)

    // Make the API request
    const searchResponse = await fetch(
      `${API_BIBLE_URL}/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          "api-key": API_BIBLE_KEY,
        },
        cache: "no-store", // Disable caching to ensure fresh results
      },
    )

    // Log the status code
    console.log(`API response status: ${searchResponse.status}`)

    // If the response is not OK, throw an error
    if (!searchResponse.ok) {
      throw new Error(`API.Bible search error: ${searchResponse.status}`)
    }

    // Parse the response as text first to log it
    const responseText = await searchResponse.text()
    console.log("API response text length:", responseText.length)

    // Try to parse the response as JSON
    let searchData
    try {
      searchData = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse JSON response:", e)
      throw new Error("Invalid JSON response from API")
    }

    // Log the parsed data structure keys
    console.log("Response data keys:", Object.keys(searchData))
    if (searchData.data) {
      console.log("Data object keys:", Object.keys(searchData.data))
    }

    // Check if we have valid search results
    if (!searchData || !searchData.data) {
      console.log("No data property in response")
      return NextResponse.json({
        verses: getRelevantFallbackVerses(query),
        message: "Using sample verses as the API returned an unexpected response format.",
      })
    }

    // Check if the passages property exists (API.Bible might use this instead of verses)
    if (searchData.data.passages && Array.isArray(searchData.data.passages) && searchData.data.passages.length > 0) {
      console.log("Found passages array with length:", searchData.data.passages.length)

      // Transform passages to our verse format
      const verses = searchData.data.passages.map((passage) => {
        try {
          // Extract reference parts
          const reference = passage.reference || ""
          const bookName = reference.split(" ")[0]
          let chapter = 1
          let verse = 1

          // Try to parse chapter and verse from reference
          const match = reference.match(/(\d+):(\d+)/)
          if (match) {
            chapter = Number.parseInt(match[1])
            verse = Number.parseInt(match[2])
          }

          // Clean HTML from content
          const cleanText = stripHtmlTags(passage.content || "No content available")

          return {
            book_name: bookName,
            chapter: chapter,
            verse: verse,
            text: cleanText,
            reference: reference,
          }
        } catch (error) {
          console.error("Error parsing passage:", error)
          return {
            book_name: "Unknown",
            chapter: 1,
            verse: 1,
            text: stripHtmlTags(passage.content || "No content available"),
            reference: passage.reference || "Unknown reference",
          }
        }
      })

      return NextResponse.json({ verses })
    }

    // Check if the verses property exists
    if (searchData.data.verses && Array.isArray(searchData.data.verses) && searchData.data.verses.length > 0) {
      console.log("Found verses array with length:", searchData.data.verses.length)

      // Transform the API.Bible search results to our app's format
      const verses = searchData.data.verses.map((verse) => {
        try {
          // Parse reference to extract book, chapter, and verse
          const reference = verse.reference || ""
          const parts = reference.split(":")
          const bookChapter = parts[0] || ""
          const verseNum = parts[1] || "1"

          let bookName, chapter

          // Handle book names with numbers and spaces (e.g., "1 Samuel 1")
          const bookChapterParts = bookChapter.split(" ")
          const lastPart = bookChapterParts[bookChapterParts.length - 1]

          if (!isNaN(Number.parseInt(lastPart))) {
            chapter = Number.parseInt(lastPart)
            bookName = bookChapterParts.slice(0, -1).join(" ")
          } else {
            bookName = bookChapter
            chapter = 1
          }

          // Clean HTML from text
          const cleanText = stripHtmlTags(verse.text || "No text available")

          return {
            book_name: bookName,
            chapter: chapter,
            verse: Number.parseInt(verseNum) || 1,
            text: cleanText,
            reference: reference,
          }
        } catch (error) {
          console.error("Error parsing verse:", error)
          return {
            book_name: "Unknown",
            chapter: 1,
            verse: 1,
            text: stripHtmlTags(verse.text || "No text available"),
            reference: verse.reference || "Unknown reference",
          }
        }
      })

      return NextResponse.json({ verses })
    }

    // If we reach here, check if there's a "results" property (some APIs use this)
    if (searchData.data.results && Array.isArray(searchData.data.results) && searchData.data.results.length > 0) {
      console.log("Found results array with length:", searchData.data.results.length)

      const verses = searchData.data.results.map((result) => {
        try {
          // Clean HTML from text
          const cleanText = stripHtmlTags(result.text || "No text available")

          return {
            book_name: result.bookname || "Unknown",
            chapter: result.chapter || 1,
            verse: result.verse || 1,
            text: cleanText,
            reference: `${result.bookname} ${result.chapter}:${result.verse}` || "Unknown reference",
          }
        } catch (error) {
          console.error("Error parsing result:", error)
          return {
            book_name: "Unknown",
            chapter: 1,
            verse: 1,
            text: "No text available",
            reference: "Unknown reference",
          }
        }
      })

      return NextResponse.json({ verses })
    }

    // If we reach here, the response format is unexpected
    console.log("Unexpected response format - no verses, passages, or results array found")

    // Return relevant fallback verses based on the search query
    return NextResponse.json({
      verses: getRelevantFallbackVerses(query),
      message: "Using sample verses as the API returned an unexpected response format.",
    })
  } catch (error) {
    console.error("Bible search error:", error)

    // Return relevant fallback verses with a message
    return NextResponse.json({
      verses: getRelevantFallbackVerses(query),
      error: "An error occurred while searching the Bible. Using sample verses instead.",
      errorDetails: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
