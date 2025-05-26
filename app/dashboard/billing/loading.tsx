import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BillingLoading() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-[300px]" />

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>

                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                </div>

                <Skeleton className="h-10 w-full mt-4" />
              </div>

              <div className="flex-1 space-y-4">
                <Skeleton className="h-5 w-[150px]" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <Skeleton className="h-px w-full" />

            <div className="space-y-4">
              <Skeleton className="h-5 w-[120px]" />
              <div className="flex items-center space-x-4 rounded-lg border p-4">
                <Skeleton className="h-6 w-6" />
                <div>
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-4 w-[100px] mt-1" />
                </div>
                <Skeleton className="h-8 w-[80px] ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
