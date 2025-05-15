import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config"

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export async function POST(req: Request) {
  try {
    const { temptation } = await req.json()

    if (!temptation) {
      return NextResponse.json({ error: "Temptation is required" }, { status: 400 })
    }

    try {
      // Get the model - using the updated model name from config
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

      const prompt = `
        As a Christian spiritual guide, provide a biblical response to someone struggling with "${temptation}".
        
        Your response should include:
        1. A relevant Bible verse that addresses this struggle (with reference)
        2. A brief reflection (2-3 sentences) on how this verse can help overcome this temptation
        3. A practical application step (1-2 sentences)
        4. A short prayer (2-3 sentences)
        
        Format your response as JSON with the following structure:
        {
          "verse": "The full Bible verse text",
          "reference": "Book Chapter:Verse",
          "reflection": "Your reflection on how this verse helps",
          "application": "A practical step to apply this verse",
          "prayer": "A short prayer related to this struggle"
        }
      `

      // Generate content
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      // Parse the response as JSON
      let parsedResponse
      try {
        // Find JSON in the response (in case the model adds extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[0] : text
        parsedResponse = JSON.parse(jsonString)
      } catch (e) {
        console.error("Error parsing JSON response:", e)
        // If parsing fails, create a structured response manually
        parsedResponse = {
          verse: "Trust in the LORD with all your heart and lean not on your own understanding.",
          reference: "Proverbs 3:5",
          reflection:
            "This verse reminds us to rely on God's wisdom rather than our own limited perspective. When facing temptation, remember that God's way leads to true fulfillment.",
          application: "When tempted, pause and pray for God's guidance before acting.",
          prayer:
            "Heavenly Father, give me strength to resist this temptation. Help me to trust in Your wisdom and follow Your path. Amen.",
        }
      }

      return NextResponse.json(parsedResponse)
    } catch (apiError) {
      console.error("Gemini API error:", apiError)

      // Fallback response if the API call fails
      const fallbackResponse = {
        verse: "Trust in the LORD with all your heart and lean not on your own understanding.",
        reference: "Proverbs 3:5",
        reflection:
          "This verse reminds us to rely on God's wisdom rather than our own limited perspective. When facing temptation, remember that God's way leads to true fulfillment.",
        application: "When tempted, pause and pray for God's guidance before acting.",
        prayer:
          "Heavenly Father, give me strength to resist this temptation. Help me to trust in Your wisdom and follow Your path. Amen.",
      }

      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error("Error in intercept route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
