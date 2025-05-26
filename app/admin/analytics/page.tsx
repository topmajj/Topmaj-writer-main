"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Define color palette
const COLORS = ["#4EEBC0", "#0088FE", "#FFBB28", "#FF8042", "#A569BD", "#3498DB", "#2ECC71", "#E74C3C"]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("yearly")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for analytics data
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [contentCreationData, setContentCreationData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [contentDistributionData, setContentDistributionData] = useState<any[]>([])
  const [comparativeData, setComparativeData] = useState<any[]>([])

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)

        if (!response.ok) {
          throw new Error(`Error fetching analytics data: ${response.statusText}`)
        }

        const data = await response.json()

        // Update state with fetched data
        setUserGrowthData(data.userGrowth || [])
        setContentCreationData(data.contentCreation || [])
        setRevenueData(data.revenue || [])
        setContentDistributionData(data.contentDistribution || [])
        setComparativeData(data.comparativeData || [])
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError("Failed to load analytics data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [timeRange])

  // Format currency for revenue
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Detailed insights into your application's performance</p>
        </div>
        <Tabs defaultValue="yearly" className="w-[400px]" onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading user data...</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Users",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4EEBC0" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#4EEBC0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4EEBC0"
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        name="Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Content Creation</CardTitle>
            <CardDescription>Content items created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading content data...</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Content",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contentCreationData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#4EEBC0" radius={[4, 4, 0, 0]} name="Content Items" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Revenue generated over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading revenue data...</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    value: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background p-2 border rounded shadow">
                                <p className="font-medium">{payload[0].payload.name}</p>
                                <p className="text-[var(--color-value)]">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#4EEBC0" strokeWidth={2} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>Distribution of content by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading content distribution data...</p>
                </div>
              ) : contentDistributionData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No content data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {contentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} items`, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparative Analysis</CardTitle>
            <CardDescription>Users vs. Content vs. Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading comparative data...</p>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    users: {
                      label: "Users",
                      color: "hsl(var(--chart-1))",
                    },
                    content: {
                      label: "Content",
                      color: "hsl(var(--chart-2))",
                    },
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparativeData}>
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="users"
                        stroke="#4EEBC0"
                        strokeWidth={2}
                        name="Users"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="content"
                        stroke="#0088FE"
                        strokeWidth={2}
                        name="Content"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FFBB28"
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
