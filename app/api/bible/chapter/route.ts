import { NextResponse } from "next/server"

// API.Bible configuration
const API_BIBLE_URL = "https://api.scripture.api.bible/v1"
const API_BIBLE_KEY = "2fddf74fe309988d953502eab8d82c39"
const BIBLE_ID = "de4e12af7f28f599-02" // English Standard Version (ESV)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const book = searchParams.get("book")
  const chapter = searchParams.get("chapter")

  if (!book || !chapter) {
    return NextResponse.json({ error: "Book and chapter parameters are required" }, { status: 400 })
  }

  try {
    // First, need to get the book ID from the API.Bible
    const booksResponse = await fetch(`${API_BIBLE_URL}/bibles/${BIBLE_ID}/books`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
    })

    if (!booksResponse.ok) {
      throw new Error(`API.Bible books error: ${booksResponse.status}`)
    }

    const booksData = await booksResponse.json()

    // Find the book that matches our request
    const bookData = booksData.data.find(
      (b) =>
        b.name.toLowerCase() === book.toLowerCase() ||
        b.nameLong.toLowerCase() === book.toLowerCase() ||
        b.abbreviation.toLowerCase() === book.toLowerCase(),
    )

    if (!bookData) {
      throw new Error(`Book not found: ${book}`)
    }

    // Now get the chapter
    const chapterResponse = await fetch(`${API_BIBLE_URL}/bibles/${BIBLE_ID}/chapters/${bookData.id}.${chapter}`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
    })

    if (!chapterResponse.ok) {
      throw new Error(`API.Bible chapter error: ${chapterResponse.status}`)
    }

    const chapterData = await chapterResponse.json()

    // Get the verses for this chapter
    const versesResponse = await fetch(`${API_BIBLE_URL}/bibles/${BIBLE_ID}/chapters/${chapterData.data.id}/verses`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
    })

    if (!versesResponse.ok) {
      throw new Error(`API.Bible verses error: ${versesResponse.status}`)
    }

    const versesData = await versesResponse.json()

    // Process verses one by one to get the content
    const verses = await Promise.all(
      versesData.data.map(async (verse) => {
        const verseResponse = await fetch(`${API_BIBLE_URL}/bibles/${BIBLE_ID}/verses/${verse.id}`, {
          headers: {
            "api-key": API_BIBLE_KEY,
          },
        })

        if (!verseResponse.ok) {
          return {
            book_name: book,
            chapter: Number.parseInt(chapter),
            verse: Number.parseInt(verse.id.split(".").pop()),
            text: "Error fetching verse content",
          }
        }

        const verseData = await verseResponse.json()

        return {
          book_name: book,
          chapter: Number.parseInt(chapter),
          verse: Number.parseInt(verse.id.split(".").pop()),
          text: verseData.data.content.replace(/<[^>]*>?/gm, ""), // Remove HTML tags
        }
      }),
    )

    return NextResponse.json({ verses })
  } catch (error) {
    console.error("Bible chapter fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to load chapter",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
        verses: [],
      },
      { status: 500 },
    )
  }
}
