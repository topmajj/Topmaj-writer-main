import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminMetricCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend: "up" | "down" | "neutral"
}

export function AdminMetricCard({ title, value, description, icon: Icon, trend }: AdminMetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-400/10">
            <Icon className="h-6 w-6 text-teal-400" />
          </div>
          <div
            className={cn(
              "flex items-center text-sm font-medium",
              trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500",
            )}
          >
            {description}
            {trend === "up" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
                <path
                  fillRule="evenodd"
                  d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
                  clipRule="evenodd"
                />
              </svg>
            ) : trend === "down" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
                <path
                  fillRule="evenodd"
                  d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.916.384l-4.573-1.435a.75.75 0 01.45-1.43l3.317 1.041a19.422 19.422 0 00-3.058-6.024l-3.428 3.428a.75.75 0 01-1.06 0L1.22 6.282a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
