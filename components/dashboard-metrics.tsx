"use client"

import { useEffect, useState } from "react"
import { BookText, FileText, Sparkles, Wand2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

interface MetricsData {
  wordsGenerated: number
  wordsGeneratedChange: number
  documentsCreated: number
  documentsCreatedChange: number
  promptsUsed: number
  promptsUsedChange: number
  creditsUsed: number
  totalCredits: number
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData>({
    wordsGenerated: 0,
    wordsGeneratedChange: 0,
    documentsCreated: 0,
    documentsCreatedChange: 0,
    promptsUsed: 0,
    promptsUsedChange: 0,
    creditsUsed: 0,
    totalCredits: 10000,
  })
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoading(false)
          return
        }

        const userId = session.user.id
        console.log("Fetching metrics for user:", userId)

        // Fetch words generated from generated_content
        const { data: contentData, error: contentError } = await supabase
          .from("generated_content")
          .select("word_count, created_at")
          .eq("user_id", userId)

        if (contentError) {
          console.error("Error fetching content data:", contentError)
        }
        console.log("Content data:", contentData)

        // Calculate total words generated
        const totalWords = contentData?.reduce((sum, item) => sum + (Number.parseInt(item.word_count) || 0), 0) || 0

        // Calculate words generated this month vs last month
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const currentMonthWords =
          contentData
            ?.filter((item) => new Date(item.created_at) >= firstDayOfMonth)
            .reduce((sum, item) => sum + (Number.parseInt(item.word_count) || 0), 0) || 0

        const prevMonthWords =
          contentData
            ?.filter(
              (item) => new Date(item.created_at) >= firstDayOfPrevMonth && new Date(item.created_at) < firstDayOfMonth,
            )
            .reduce((sum, item) => sum + (Number.parseInt(item.word_count) || 0), 0) || 0

        // Calculate word change percentage
        const wordChangePercentage =
          prevMonthWords > 0 ? ((currentMonthWords - prevMonthWords) / prevMonthWords) * 100 : 0

        // Fetch documents (content items) created
        const documentsCount = contentData?.length || 0

        // Calculate documents created this month vs last month
        const currentMonthDocs = contentData?.filter((item) => new Date(item.created_at) >= firstDayOfMonth).length || 0

        const prevMonthDocs =
          contentData?.filter(
            (item) => new Date(item.created_at) >= firstDayOfPrevMonth && new Date(item.created_at) < firstDayOfMonth,
          ).length || 0

        // Fetch generated images
        const { data: imagesData, error: imagesError } = await supabase
          .from("generated_images")
          .select("id, created_at")
          .eq("user_id", userId)

        if (imagesError) {
          console.error("Error fetching images data:", imagesError)
        }
        console.log("Images data:", imagesData)

        // Calculate total prompts (content + images)
        const promptsCount = (contentData?.length || 0) + (imagesData?.length || 0)

        // Calculate prompts used this month vs last month
        const currentMonthImages =
          imagesData?.filter((item) => new Date(item.created_at) >= firstDayOfMonth).length || 0

        const prevMonthImages =
          imagesData?.filter(
            (item) => new Date(item.created_at) >= firstDayOfPrevMonth && new Date(item.created_at) < firstDayOfMonth,
          ).length || 0

        const currentMonthPrompts = currentMonthDocs + currentMonthImages
        const prevMonthPrompts = prevMonthDocs + prevMonthImages
        const promptsChange = prevMonthPrompts > 0 ? currentMonthPrompts - prevMonthPrompts : currentMonthPrompts

        // Fetch subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_subscription")
          .select("credits_used, total_credits")
          .eq("user_id", userId)

        if (subscriptionError) {
          console.error("Error fetching subscription data:", subscriptionError)
        }
        console.log("Subscription data:", subscriptionData)

        // Get credits data
        const creditsUsed =
          subscriptionData && subscriptionData.length > 0 ? Number.parseInt(subscriptionData[0].credits_used) || 0 : 0

        const totalCredits =
          subscriptionData && subscriptionData.length > 0
            ? Number.parseInt(subscriptionData[0].total_credits) || 10000
            : 10000

        // Set all metrics
        setMetrics({
          wordsGenerated: totalWords,
          wordsGeneratedChange: wordChangePercentage,
          documentsCreated: documentsCount,
          documentsCreatedChange: currentMonthDocs - prevMonthDocs,
          promptsUsed: promptsCount,
          promptsUsedChange: promptsChange,
          creditsUsed: creditsUsed,
          totalCredits: totalCredits,
        })
      } catch (error) {
        console.error("Error fetching metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  // Format percentage with + sign for positive values
  const formatPercentage = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return "0.0%"
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("metrics.wordsGenerated", language)}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.wordsGenerated.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(metrics.wordsGeneratedChange) + " " + t("metrics.fromLastMonth", language)}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("metrics.documentsCreated", language)}</CardTitle>
          <BookText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.documentsCreated}</div>
          <p className="text-xs text-muted-foreground">
            {`${metrics.documentsCreatedChange >= 0 ? "+" : ""}${metrics.documentsCreatedChange} ${t("metrics.fromLastMonth", language)}`}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("metrics.promptsUsed", language)}</CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.promptsUsed}</div>
          <p className="text-xs text-muted-foreground">
            {`${metrics.promptsUsedChange >= 0 ? "+" : ""}${metrics.promptsUsedChange} ${t("metrics.fromLastMonth", language)}`}
          </p>
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("metrics.usage", language)}</CardTitle>
          <Wand2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {`${Math.round((metrics.creditsUsed / Math.max(metrics.totalCredits, 1)) * 100)}%`}
          </div>
          <Progress
            value={(metrics.creditsUsed / Math.max(metrics.totalCredits, 1)) * 100}
            className="mt-2 w-full"
            indicatorColor="#4EEBC0"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {`${metrics.creditsUsed.toLocaleString()} / ${metrics.totalCredits.toLocaleString()} ${t("metrics.creditsUsed", language)}`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
