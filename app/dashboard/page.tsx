"use client"

import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentDocuments } from "@/components/recent-documents"
import { AITools } from "@/components/ai-tools"
import { DashboardMetrics } from "@/components/dashboard-metrics"

export default function DashboardPage() {
  // Add the useLanguage hook to get the current language
  const { language } = useLanguage()

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title", language)}</h1>
        <p className="text-muted-foreground">{t("dashboard.welcome", language)}</p>
      </div>

      <DashboardStats />

      <Tabs defaultValue="recent" className="space-y-4 w-full">
        <TabsList className="w-full">
          <TabsTrigger value="recent" className="flex-1">
            {t("dashboard.recentDocuments", language)}
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex-1">
            {t("dashboard.aiTools", language)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4 w-full">
          <RecentDocuments />
        </TabsContent>
        <TabsContent value="ai-tools" className="space-y-4 w-full">
          <AITools />
        </TabsContent>
      </Tabs>

      <DashboardMetrics />
    </div>
  )
}
