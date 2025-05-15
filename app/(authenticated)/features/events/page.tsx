"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarIcon, MapPin, Clock, Users, ExternalLink, Plus, Filter, Share } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/providers/auth-provider"

interface Event {
  id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  organizer: string
  type: "conference" | "worship" | "prayer" | "outreach" | "study" | "other" | "community"
  url?: string
  imageUrl?: string
  isCommunityEvent?: boolean
}

// Sample events for demo - these will be shown until the API loads
const SAMPLE_EVENTS: Event[] = [
  {
    id: "event-1",
    title: "Community Prayer Breakfast",
    description: "Join us for a morning of prayer and fellowship with believers from around the city.",
    date: new Date(2025, 4, 15), // May 15, 2025
    startTime: "07:30",
    endTime: "09:00",
    location: "Grace Community Church, 123 Main St",
    organizer: "City Prayer Network",
    type: "prayer",
    imageUrl: "/prayer-breakfast.png",
  },
  {
    id: "event-2",
    title: "Bible Study Conference",
    description:
      "A three-day conference focused on deepening your understanding of Scripture through workshops and keynote speakers.",
    date: new Date(2025, 4, 20), // May 20, 2025
    startTime: "09:00",
    endTime: "17:00",
    location: "Faith Convention Center, 456 Church Ave",
    organizer: "International Bible Society",
    type: "conference",
    url: "https://example.com/bible-conference",
    imageUrl: "/placeholder.svg?key=kr8lk",
  },
]

export default function EventsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>(SAMPLE_EVENTS)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(SAMPLE_EVENTS)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingEvents, setFetchingEvents] = useState(true)
  const [activeTab, setActiveTab] = useState("calendar")
  const [showAddEventDialog, setShowAddEventDialog] = useState(false)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    description: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    organizer: "",
    type: "other",
  })

  // Fetch events from the API
  useEffect(() => {
    async function fetchEvents() {
      setFetchingEvents(true)
      try {
        const response = await fetch(`/api/events`)

        if (!response.ok) {
          // If the API returns an error, we'll just use the sample events
          console.warn("Events API returned an error, using sample events instead")
          return
        }

        const data = await response.json()

        if (data.events && data.events.length > 0) {
          // Convert date strings to Date objects
          const formattedEvents = data.events.map((event: any) => ({
            ...event,
            date: new Date(event.date),
          }))
          setEvents(formattedEvents)
          // Don't filter based on selected date yet, as the user might not have selected one
          setFilteredEvents(formattedEvents)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
        // We'll just use the sample events if there's an error
        toast({
          title: "Using sample events",
          description: "We're showing sample events while we set up the database.",
          variant: "default",
        })
      } finally {
        setFetchingEvents(false)
      }
    }

    fetchEvents()
  }, [toast])

  // Filter events when date or filter changes
  useEffect(() => {
    if (selectedDate) {
      let filtered = events.filter((event) => {
        const eventDate = new Date(event.date)
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        )
      })

      if (eventTypeFilter !== "all") {
        filtered = filtered.filter((event) => event.type === eventTypeFilter)
      }

      setFilteredEvents(filtered)
    } else {
      let filtered = [...events]

      if (eventTypeFilter !== "all") {
        filtered = filtered.filter((event) => event.type === eventTypeFilter)
      }

      setFilteredEvents(filtered)
    }
  }, [selectedDate, events, eventTypeFilter])

  // Get dates with events for the calendar
  const getDatesWithEvents = () => {
    return events.map((event) => new Date(event.date))
  }

  const handleAddEvent = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add events",
        variant: "destructive",
      })
      return
    }

    if (!newEvent.title || !newEvent.date || !newEvent.location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // For now, we'll just add the event locally since the API might not be ready
      const createdEvent: Event = {
        id: `event-${Date.now()}`,
        ...newEvent,
        imageUrl: `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(newEvent.type + " " + newEvent.title)}`,
      }

      setEvents((prev) => [...prev, createdEvent])
      setShowAddEventDialog(false)
      setNewEvent({
        title: "",
        description: "",
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        location: "",
        organizer: "",
        type: "other",
      })

      toast({
        title: "Event created",
        description: "Your event has been added to the calendar",
      })

      // Select the date of the new event
      setSelectedDate(new Date(createdEvent.date))
      setActiveTab("calendar")

      // Try to save to the API if it's available
      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEvent),
        })

        if (!response.ok) {
          console.warn("Failed to save event to database, but it's available locally")
        }
      } catch (apiError) {
        console.warn("API not available, event saved locally only")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Failed to create event",
        description: "There was an error creating your event. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      conference: "Conference",
      worship: "Worship",
      prayer: "Prayer",
      outreach: "Outreach",
      study: "Bible Study",
      community: "Community",
      other: "Other",
    }
    return types[type] || "Event"
  }

  const getEventTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      conference: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
      worship: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
      prayer: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      outreach: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
      study: "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100",
      community: "bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
    }
    return colors[type] || colors.other
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">Christian Events</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover upcoming conferences, prayer meetings, and church gatherings in your area
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="calendar" className="flex-1">
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1">
            List View
          </TabsTrigger>
          <TabsTrigger value="nearby" className="flex-1">
            Nearby Events
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-6 mb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="conference">Conferences</SelectItem>
                <SelectItem value="worship">Worship</SelectItem>
                <SelectItem value="prayer">Prayer</SelectItem>
                <SelectItem value="outreach">Outreach</SelectItem>
                <SelectItem value="study">Bible Study</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setShowAddEventDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <TabsContent value="calendar" className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit sticky top-20">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  highlightedDays={getDatesWithEvents()}
                />
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">
                {selectedDate ? `Events for ${formatDate(selectedDate)}` : "All Events"}
              </h2>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 pb-4">
                {fetchingEvents ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Loading events...</span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No events found</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {selectedDate
                          ? "There are no events scheduled for this date."
                          : "No events match your current filter."}
                      </p>
                      <Button variant="outline" onClick={() => setShowAddEventDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Event
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {event.imageUrl && (
                          <div className="md:w-1/3 h-48 md:h-auto">
                            <img
                              src={event.imageUrl || "/placeholder.svg"}
                              alt={event.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className={`flex-1 ${event.imageUrl ? "md:w-2/3" : "w-full"}`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <div>
                                <CardTitle>{event.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  <span className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    {formatDate(new Date(event.date))}
                                  </span>
                                </CardDescription>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {event.isCommunityEvent && (
                                  <Badge variant="outline" className="border-teal-500">
                                    From Community
                                  </Badge>
                                )}
                                <Badge className={getEventTypeBadgeColor(event.type)}>
                                  {getEventTypeLabel(event.type)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{event.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span>
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span className="line-clamp-1">{event.organizer}</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                                View Details
                              </Button>
                              {event.url && (
                                <Button size="sm" asChild>
                                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Website
                                  </a>
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </CardFooter>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-2">
          <div className="space-y-4 pb-6">
            {fetchingEvents ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No events match your current filter.</p>
                  <Button variant="outline" onClick={() => setShowAddEventDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Group events by month */}
                {Array.from(
                  new Set(
                    filteredEvents.map((event) =>
                      new Date(event.date).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                    ),
                  ),
                ).map((monthYear) => (
                  <div key={monthYear} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{monthYear}</h3>
                    <div className="space-y-3">
                      {filteredEvents
                        .filter(
                          (event) =>
                            new Date(event.date).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            }) === monthYear,
                        )
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((event) => (
                          <Card key={event.id} className="overflow-hidden">
                            <div className="flex items-center p-4">
                              <div className="flex-shrink-0 mr-4 text-center">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2 w-16">
                                  <div className="text-sm font-medium">
                                    {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                                  </div>
                                  <div className="text-2xl font-bold">{new Date(event.date).getDate()}</div>
                                </div>
                              </div>
                              <div className="flex-grow">
                                <h4 className="font-semibold">{event.title}</h4>
                                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-2">
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>
                                      {event.startTime} - {event.endTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-1">
                                <Badge className={getEventTypeBadgeColor(event.type)}>
                                  {getEventTypeLabel(event.type)}
                                </Badge>
                                {event.isCommunityEvent && (
                                  <Badge variant="outline" className="border-teal-500 text-xs">
                                    Community
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nearby" className="mt-2">
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nearby Events Coming Soon</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                We're working on bringing you events based on your location. Stay tuned for updates!
              </p>
              <Button variant="outline">Notify Me When Available</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 mt-1">
                {selectedEvent.isCommunityEvent && (
                  <Badge variant="outline" className="border-teal-500">
                    From Community
                  </Badge>
                )}
                <Badge className={getEventTypeBadgeColor(selectedEvent.type)}>
                  {getEventTypeLabel(selectedEvent.type)}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl || "/placeholder.svg"}
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              <p className="text-gray-700 dark:text-gray-300">{selectedEvent.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatDate(new Date(selectedEvent.date))}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedEvent.organizer}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">Add to Calendar</Button>
                {selectedEvent.url && (
                  <Button asChild>
                    <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Share an upcoming event with the community. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="event-title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="event-title"
                placeholder="Enter event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="event-description"
                placeholder="Provide details about the event"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <div className="border rounded-md p-2">
                  <Calendar
                    mode="single"
                    selected={newEvent.date}
                    onSelect={(date) => date && setNewEvent({ ...newEvent, date })}
                    className="w-full"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="event-start-time" className="text-sm font-medium">
                    Start Time *
                  </label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="event-end-time" className="text-sm font-medium">
                    End Time *
                  </label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="event-type" className="text-sm font-medium">
                    Event Type *
                  </label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="worship">Worship</SelectItem>
                      <SelectItem value="prayer">Prayer</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                      <SelectItem value="study">Bible Study</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="event-location" className="text-sm font-medium">
                Location *
              </label>
              <Input
                id="event-location"
                placeholder="Enter event location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-organizer" className="text-sm font-medium">
                Organizer *
              </label>
              <Input
                id="event-organizer"
                placeholder="Enter organizer name"
                value={newEvent.organizer}
                onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-url" className="text-sm font-medium">
                Website URL
              </label>
              <Input
                id="event-url"
                placeholder="https://example.com/event"
                value={newEvent.url || ""}
                onChange={(e) => setNewEvent({ ...newEvent, url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
