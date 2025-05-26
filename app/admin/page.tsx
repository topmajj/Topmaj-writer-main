"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
  BarChart,
  Bar,
} from "recharts"
import { Users, FileText, CreditCard, Activity } from "lucide-react"
import { AdminMetricCard } from "@/components/admin/admin-metric-card"
import { AdminRecentUsers } from "@/components/admin/admin-recent-users"
import { AdminRecentContent } from "@/components/admin/admin-recent-content"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  // Colors for the pie chart
  const COLORS = ["#4EEBC0", "#0088FE", "#FFBB28"]

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/dashboard-metrics")

        if (!response.ok) {
          throw new Error("Failed to fetch metrics")
        }

        const data = await response.json()
        setMetrics(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching metrics:", err)
        setError(err.message || "An error occurred")
        toast({
          title: "Error",
          description: "Failed to load dashboard metrics",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [toast])

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  // Fallback data for charts if API fails
  const fallbackRevenueData = [
    { name: "Jan", revenue: 0 },
    { name: "Feb", revenue: 0 },
    { name: "Mar", revenue: 0 },
    { name: "Apr", revenue: 0 },
    { name: "May", revenue: 0 },
    { name: "Jun", revenue: 0 },
    { name: "Jul", revenue: 0 },
    { name: "Aug", revenue: 0 },
    { name: "Sep", revenue: 0 },
    { name: "Oct", revenue: 0 },
    { name: "Nov", revenue: 0 },
    { name: "Dec", revenue: 0 },
  ]

  const fallbackPlanData = [
    { name: "Free", value: 1 },
    { name: "Pro", value: 1 },
    { name: "Business", value: 1 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your application's performance and usage.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
        ) : (
          <>
            <AdminMetricCard
              title="Total Users"
              value={metrics?.totalUsers?.toString() || "0"}
              description="Total registered users"
              icon={Users}
              trend="neutral"
            />
            <AdminMetricCard
              title="Content Created"
              value={metrics?.totalContent?.toString() || "0"}
              description="Total content items"
              icon={FileText}
              trend="neutral"
            />
            <AdminMetricCard
              title="Revenue"
              value={formatCurrency(metrics?.totalRevenue || 0)}
              description="Total monthly revenue"
              icon={CreditCard}
              trend="neutral"
            />
            <AdminMetricCard
              title="Active Users"
              value={metrics?.activeUsers?.toString() || "0"}
              description="Users with active subscriptions"
              icon={Activity}
              trend="neutral"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.revenueChartData || fallbackRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4EEBC0" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4EEBC0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4EEBC0"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Creation</CardTitle>
            <CardDescription>Content generated monthly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.contentChartData || []}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip formatter={(value) => [`${value} items`, "Content"]} />
                    <Bar dataKey="value" fill="#4EEBC0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics?.planChartData || fallbackPlanData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(metrics?.planChartData || fallbackPlanData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} users`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminRecentUsers />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
          <CardDescription>Latest content created by users</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRecentContent />
        </CardContent>
      </Card>
    </div>
  )
}
