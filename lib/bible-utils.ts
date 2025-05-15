/**
 * Parses a Bible reference string into its components
 * @param reference Bible reference string (e.g., "John 3:16", "1 Samuel 1:1")
 * @returns Object containing book name, chapter, and verse
 */
export function parseBibleReference(reference: string) {
  try {
    // Default values
    let bookName = "Unknown"
    let chapter = 1
    let verse = 1

    if (!reference) return { bookName, chapter, verse }

    // Split by colon to separate chapter:verse
    const parts = reference.split(":")
    const bookChapter = parts[0].trim()
    const verseStr = parts.length > 1 ? parts[1].trim() : "1"

    // Parse verse number (handle ranges like "1-3" by taking first number)
    verse = Number.parseInt(verseStr.split("-")[0])

    // Handle book names with numbers (e.g., "1 Samuel 1")
    const bookChapterParts = bookChapter.split(" ")

    // Check if the last part is a number (chapter)
    if (bookChapterParts.length > 1 && !isNaN(Number.parseInt(bookChapterParts[bookChapterParts.length - 1]))) {
      chapter = Number.parseInt(bookChapterParts[bookChapterParts.length - 1])
      bookName = bookChapterParts.slice(0, -1).join(" ")
    } else {
      bookName = bookChapter
    }

    return { bookName, chapter, verse }
  } catch (error) {
    console.error("Error parsing Bible reference:", error)
    return { bookName: "Unknown", chapter: 1, verse: 1 }
  }
}

/**
 * Formats book, chapter, and verse into a standard reference string
 * @param bookName Bible book name
 * @param chapter Chapter number
 * @param verse Verse number
 * @returns Formatted reference string (e.g., "John 3:16")
 */
export function formatBibleReference(bookName: string, chapter: number, verse: number) {
  return `${bookName} ${chapter}:${verse}`
}

/**
 * Gets the number of chapters in a Bible book
 * @param book Bible book name
 * @returns Number of chapters
 */
export function getChapterCount(book: string) {
  const chapterCounts: Record<string, number> = {
    Genesis: 50,
    Exodus: 40,
    Leviticus: 27,
    Numbers: 36,
    Deuteronomy: 34,
    Joshua: 24,
    Judges: 21,
    Ruth: 4,
    "1 Samuel": 31,
    "2 Samuel": 24,
    "1 Kings": 22,
    "2 Kings": 25,
    "1 Chronicles": 29,
    "2 Chronicles": 36,
    Ezra: 10,
    Nehemiah: 13,
    Esther: 10,
    Job: 42,
    Psalms: 150,
    Proverbs: 31,
    Ecclesiastes: 12,
    "Song of Solomon": 8,
    Isaiah: 66,
    Jeremiah: 52,
    Lamentations: 5,
    Ezekiel: 48,
    Daniel: 12,
    Hosea: 14,
    Joel: 3,
    Amos: 9,
    Obadiah: 1,
    Jonah: 4,
    Micah: 7,
    Nahum: 3,
    Habakkuk: 3,
    Zephaniah: 3,
    Haggai: 2,
    Zechariah: 14,
    Malachi: 4,
    Matthew: 28,
    Mark: 16,
    Luke: 24,
    John: 21,
    Acts: 28,
    Romans: 16,
    "1 Corinthians": 16,
    "2 Corinthians": 13,
    Galatians: 6,
    Ephesians: 6,
    Philippians: 4,
    Colossians: 4,
    "1 Thessalonians": 5,
    "2 Thessalonians": 3,
    "1 Timothy": 6,
    "2 Timothy": 4,
    Titus: 3,
    Philemon: 1,
    Hebrews: 13,
    James: 5,
    "1 Peter": 5,
    "2 Peter": 3,
    "1 John": 5,
    "2 John": 1,
    "3 John": 1,
    Jude: 1,
    Revelation: 22,
  }

  return chapterCounts[book] || 5
}
