"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

interface ContentByDay {
  date: string
  count: number
}

interface ContentByType {
  type: string
  count: number
}

interface WordsByDay {
  date: string
  words: number
}

export function DashboardStats() {
  const [contentByDay, setContentByDay] = useState<ContentByDay[]>([])
  const [contentByType, setContentByType] = useState<ContentByType[]>([])
  const [wordsByDay, setWordsByDay] = useState<WordsByDay[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  // Define the teal color to match the app's main color
  const tealColor = "#4EEBC0"
  const tealColorLight = "rgba(78, 235, 192, 0.2)"

  useEffect(() => {
    async function fetchAnalytics() {
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
        console.log("Fetching analytics for user:", userId)

        // Fetch all content data
        const { data: contentData, error: contentError } = await supabase
          .from("generated_content")
          .select("title, content, word_count, created_at, template_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (contentError) {
          console.error("Error fetching content data:", contentError)
        }
        console.log("Content data count:", contentData?.length)

        // Process content by day
        const contentByDayMap = new Map<string, number>()
        const wordsByDayMap = new Map<string, number>()
        const contentByTypeMap = new Map<string, number>()

        // Get last 30 days
        const today = new Date()
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(today)
          date.setDate(today.getDate() - i)
          return date.toISOString().split("T")[0]
        }).reverse()

        // Initialize maps with zeros for all days
        last30Days.forEach((day) => {
          contentByDayMap.set(day, 0)
          wordsByDayMap.set(day, 0)
        })

        // Process content data
        contentData?.forEach((item) => {
          // Format for content by day
          const day = new Date(item.created_at).toISOString().split("T")[0]
          contentByDayMap.set(day, (contentByDayMap.get(day) || 0) + 1)

          // Format for words by day
          wordsByDayMap.set(day, (wordsByDayMap.get(day) || 0) + (Number.parseInt(item.word_count) || 0))

          // Format for content by type
          let contentType = "Other"

          // Determine content type from title or template_id
          if (item.title) {
            const titleLower = item.title.toLowerCase()
            if (titleLower.includes("blog") || titleLower.includes("post")) {
              contentType = "Blog Posts"
            } else if (titleLower.includes("twitter") || titleLower.includes("thread")) {
              contentType = "Twitter Threads"
            } else if (titleLower.includes("instagram")) {
              contentType = "Instagram"
            } else if (titleLower.includes("linkedin")) {
              contentType = "LinkedIn"
            } else if (titleLower.includes("email") || titleLower.includes("newsletter")) {
              contentType = "Emails"
            }
          }

          contentByTypeMap.set(contentType, (contentByTypeMap.get(contentType) || 0) + 1)
        })

        // Convert maps to arrays for charts
        const contentByDayArray = last30Days.map((day) => ({
          date: day,
          count: contentByDayMap.get(day) || 0,
        }))

        const wordsByDayArray = last30Days.map((day) => ({
          date: day,
          words: wordsByDayMap.get(day) || 0,
        }))

        const contentByTypeArray = Array.from(contentByTypeMap.entries()).map(([type, count]) => ({
          type,
          count,
        }))

        // Sort content by type by count descending
        contentByTypeArray.sort((a, b) => b.count - a.count)

        // Update state
        setContentByDay(contentByDayArray)
        setWordsByDay(wordsByDayArray)
        setContentByType(contentByTypeArray)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>{t("analytics.title", language)}</CardTitle>
        <CardDescription>{t("analytics.description", language)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="words">{t("analytics.wordsGenerated", language)}</TabsTrigger>
            <TabsTrigger value="documents">{t("analytics.documents", language)}</TabsTrigger>
            <TabsTrigger value="content">{t("analytics.contentTypes", language)}</TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="mt-4">
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t("analytics.loadingWordCount", language)}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={wordsByDay}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toLocaleString()} ${t("analytics.words", language)}`,
                        t("analytics.wordsGenerated", language),
                      ]}
                      labelFormatter={(label) => `${t("analytics.date", language)}: ${formatDate(label)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="words"
                      stroke={tealColor}
                      strokeWidth={2}
                      dot={{ r: 4, fill: tealColor }}
                      activeDot={{ r: 6 }}
                      name={t("analytics.wordsGenerated", language)}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t("analytics.loadingAnalytics", language)}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={contentByDay}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tealColor} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={tealColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} ${t("analytics.items", language)}`,
                        t("analytics.contentCreated", language),
                      ]}
                      labelFormatter={(label) => `${t("analytics.date", language)}: ${formatDate(label)}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={tealColor}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name={t("analytics.contentCreated", language)}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t("analytics.loadingContentType", language)}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={contentByType}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis dataKey="type" type="category" tickLine={false} axisLine={false} width={100} />
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} ${t("analytics.items", language)}`,
                        t("analytics.count", language),
                      ]}
                    />
                    <Bar dataKey="count" fill={tealColor} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
