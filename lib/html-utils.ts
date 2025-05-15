/**
 * Strips HTML tags from a string and returns clean text
 * @param html HTML string to clean
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return ""

  // Create a temporary DOM element
  if (typeof document !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html")
    return doc.body.textContent || ""
  }

  // Fallback for server-side or when DOMParser is not available
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Safely renders HTML content by creating a DOM element
 * and extracting the text content
 * @param html HTML string to render
 * @returns Safe text content
 */
export function safeHtmlContent(html: string): string {
  return stripHtmlTags(html)
}
