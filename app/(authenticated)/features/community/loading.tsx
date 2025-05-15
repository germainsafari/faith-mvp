import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoadingCommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <Tabs defaultValue="forums" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="forums" className="flex-1">
            Discussion Forums
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">
            Small Groups
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1">
            Local Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forums" className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Skeleton className="h-10 w-40" />
            <div className="flex w-full sm:w-auto gap-2">
              <Skeleton className="h-10 flex-grow w-40 sm:w-60" />
              <Skeleton className="h-10 w-10" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-center min-w-[80px]">
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="hidden md:flex flex-col items-center min-w-[80px]">
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
