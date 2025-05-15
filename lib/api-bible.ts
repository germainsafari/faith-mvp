// API.Bible configuration
export const API_BIBLE_URL = "https://api.scripture.api.bible/v1"
export const API_BIBLE_KEY = "2fddf74fe309988d953502eab8d82c39"
export const BIBLE_ID = "de4e12af7f28f599-02" // English Standard Version (ESV)

// List of available Bibles with translations
export const BIBLE_VERSIONS = [
  { id: "de4e12af7f28f599-02", name: "English Standard Version (ESV)" },
  { id: "55212e3cf5d04d49-01", name: "King James Version (KJV)" },
  { id: "01b29f4b342acc35-01", name: "New International Version (NIV)" },
  { id: "06125adad2d5898a-01", name: "New Living Translation (NLT)" },
  { id: "40072c4a5aba4022-01", name: "Amplified Bible (AMP)" },
]

// Fetch available Bibles from the API
export async function fetchAvailableBibles() {
  try {
    const response = await fetch(`${API_BIBLE_URL}/bibles`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`API.Bible error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error fetching Bibles:", error)
    return BIBLE_VERSIONS // Fallback to predefined list
  }
}

// Fetch books for a specific Bible version
export async function fetchBibleBooks(bibleId = BIBLE_ID) {
  try {
    const response = await fetch(`${API_BIBLE_URL}/bibles/${bibleId}/books`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!response.ok) {
      throw new Error(`API.Bible books error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error fetching Bible books:", error)
    return []
  }
}

// Get chapter content
export async function fetchChapter(bibleId, bookId, chapter) {
  try {
    const chapterResponse = await fetch(`${API_BIBLE_URL}/bibles/${bibleId}/chapters/${bookId}.${chapter}`, {
      headers: {
        "api-key": API_BIBLE_KEY,
      },
    })

    if (!chapterResponse.ok) {
      throw new Error(`API.Bible chapter error: ${chapterResponse.status}`)
    }

    return await chapterResponse.json()
  } catch (error) {
    console.error("Error fetching chapter:", error)
    throw error
  }
}

// Search the Bible
export async function searchBible(query, bibleId = BIBLE_ID) {
  try {
    const response = await fetch(
      `${API_BIBLE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          "api-key": API_BIBLE_KEY,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`API.Bible search error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching Bible:", error)
    throw error
  }
}
