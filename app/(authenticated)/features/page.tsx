import Link from "next/link"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, MessageSquare, GamepadIcon, Users, Calendar, Music } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      title: "Scripture Q&A",
      description: "Ask questions about faith, life, and the Bible to receive scripture-grounded answers",
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      href: "/features/scripture-qa",
      available: true,
    },
    {
      title: "Bible Search",
      description: "Search and explore the Bible with an easy-to-use interface",
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
      href: "/features/bible",
      available: true,
    },
    {
      title: "Verse Memory Game",
      description: "Test and improve your knowledge of scripture through interactive games",
      icon: <GamepadIcon className="h-8 w-8 text-blue-500" />,
      href: "/features/memory-game",
      available: true,
    },
    {
      title: "Community & Fellowship",
      description: "Connect with other believers in topic-based discussion groups",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      href: "/features/community",
      available: true,
    },
    {
      title: "Christian Events",
      description: "Discover upcoming conferences, prayer meetings, and church livestreams",
      icon: <Calendar className="h-8 w-8 text-blue-500" />,
      href: "/features/events",
      available: true,
    },
    {
      title: "Worship Music",
      description: "Listen to curated worship playlists directly within the app",
      icon: <Music className="h-8 w-8 text-blue-500" />,
      href: "/features/worship-music",
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Faith+ Features</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Explore these special features designed to help you grow in your faith journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className={feature.available ? "" : "opacity-70"}>
            <CardHeader>
              <div className="mb-2">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              {feature.available ? (
                <Link href={feature.href} className="w-full">
                  <Button className="w-full">Access Feature</Button>
                </Link>
              ) : (
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
