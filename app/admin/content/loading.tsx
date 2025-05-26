import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContentLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl">
              <Skeleton className="h-8 w-[250px]" />
            </CardTitle>
            <Skeleton className="h-4 w-[300px] mt-2" />
          </div>
          <Skeleton className="h-10 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="h-[500px] w-full flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
