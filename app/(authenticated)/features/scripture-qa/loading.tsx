import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap mb-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-32" />
              ))}
            </div>

            <Skeleton className="h-[120px] w-full" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
