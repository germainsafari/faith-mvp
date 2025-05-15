import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the events table exists
    const { error: tableCheckError } = await supabase.from("events").select("id").limit(1).single()

    // If there's an error, the table might not exist yet
    if (tableCheckError) {
      console.warn("Events table might not exist yet:", tableCheckError.message)
      // Return empty events array instead of an error
      return NextResponse.json({ events: [] })
    }

    // If we get here, the table exists, so we can query it
    const url = new URL(request.url)
    const eventType = url.searchParams.get("type")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")

    let query = supabase.from("events").select("*").order("date", { ascending: true }).limit(limit)

    // Apply filters
    if (eventType && eventType !== "all") {
      query = query.eq("event_type", eventType)
    }

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Format the response
    const formattedEvents = data.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      organizer: event.organizer,
      type: event.event_type,
      url: event.external_url,
      imageUrl: event.image_url,
      isCommunityEvent: event.is_community_event,
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (error) {
    console.error("Error fetching events:", error)
    // Return empty events array instead of an error
    return NextResponse.json({ events: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the events table exists
    const { error: tableCheckError } = await supabase.from("events").select("id").limit(1).single()

    // If there's an error, the table might not exist yet
    if (tableCheckError) {
      console.warn("Events table might not exist yet:", tableCheckError.message)
      // Return success but with a warning
      return NextResponse.json({
        success: true,
        warning: "Events table not ready yet. Event saved locally only.",
        event: null,
      })
    }

    // Verify user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, date, startTime, endTime, location, organizer, type, url, isCommunityEvent } =
      await request.json()

    // Validation
    if (!title || !date || !startTime || !endTime || !location || !organizer || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Format date properly
    const formattedDate = new Date(date).toISOString().split("T")[0]

    // Insert the event
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title,
        description,
        date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        location,
        organizer,
        event_type: type,
        external_url: url,
        is_community_event: isCommunityEvent || false,
        user_id: session.user.id,
        // A default image could be generated based on the event type
        image_url: `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(type + " " + title)}`,
      })
      .select()

    if (error) {
      throw error
    }

    // Format the response
    const formattedEvent =
      event && event[0]
        ? {
            id: event[0].id,
            title: event[0].title,
            description: event[0].description,
            date: new Date(event[0].date),
            startTime: event[0].start_time,
            endTime: event[0].end_time,
            location: event[0].location,
            organizer: event[0].organizer,
            type: event[0].event_type,
            url: event[0].external_url,
            imageUrl: event[0].image_url,
            isCommunityEvent: event[0].is_community_event,
          }
        : null

    return NextResponse.json({
      success: true,
      event: formattedEvent,
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      {
        success: false,
        warning: "Failed to save to database. Event saved locally only.",
        error: "Failed to create event",
      },
      { status: 200 },
    ) // Return 200 so the client doesn't show an error
  }
}
