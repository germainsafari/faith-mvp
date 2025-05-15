import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export async function POST(request: Request) {
  // Check authentication
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { question } = await request.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Use Gemini to generate a scripture-based answer
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const prompt = `
      As a knowledgeable Christian scholar, please answer the following question with biblical wisdom:
      
      "${question}"
      
      Provide a thoughtful, scripture-grounded response that includes:
      1. A clear, concise answer (3-5 sentences)
      2. At least 3 relevant Bible verses with their full text and references
      
      Format your response as JSON with the following structure:
      {
        "answer": "Your thoughtful answer here",
        "verses": [
          {
            "reference": "Book Chapter:Verse",
            "text": "The full text of the verse"
          }
        ]
      }
    `

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the response as JSON
    try {
      // Find JSON in the response (in case the model adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : text
      const parsedResponse = JSON.parse(jsonString)

      // Store the question and answer in the database
      const { data: historyData, error: historyError } = await supabase
        .from("scripture_qa_history")
        .insert([
          {
            user_id: session.user.id,
            question: question,
            answer: parsedResponse.answer,
            verses: parsedResponse.verses,
          },
        ])
        .select()

      if (historyError) {
        console.error("Error storing question history:", historyError)
      }

      // Add the history ID to the response if available
      if (historyData && historyData.length > 0) {
        parsedResponse.id = historyData[0].id
      }

      return NextResponse.json(parsedResponse)
    } catch (e) {
      console.error("Error parsing JSON response:", e)

      // Fallback response if parsing fails
      const fallbackResponse = {
        answer:
          "I apologize, but I'm having trouble generating a proper response. Please try rephrasing your question.",
        verses: [
          {
            reference: "Proverbs 3:5-6",
            text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
          },
        ],
      }

      // Try to store the fallback response
      try {
        const { data: historyData } = await supabase
          .from("scripture_qa_history")
          .insert([
            {
              user_id: session.user.id,
              question: question,
              answer: fallbackResponse.answer,
              verses: fallbackResponse.verses,
            },
          ])
          .select()

        if (historyData && historyData.length > 0) {
          fallbackResponse.id = historyData[0].id
        }
      } catch (dbError) {
        console.error("Error storing fallback response:", dbError)
      }

      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error("Error in scripture-qa route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
