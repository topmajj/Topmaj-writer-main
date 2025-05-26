"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CreditCard,
  DollarSign,
  Users,
  Search,
  RefreshCcw,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function AdminBillingPage() {
  // State for billing data
  const [subscriptions, setSubscriptions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState({
    plans: [],
    providers: [],
    statuses: [],
    credits: { sum: { total_credits: 0, used_credits: 0 } },
  })

  // State for filters and pagination
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [plan, setPlan] = useState("all")
  const [status, setStatus] = useState("all")
  const [provider, setProvider] = useState("all")
  const [sortBy, setSortBy] = useState("updated_at")
  const [sortOrder, setSortOrder] = useState("desc")

  // Fetch billing data
  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      })

      if (search) queryParams.set("search", search)
      if (plan !== "all") queryParams.set("plan", plan)
      if (status !== "all") queryParams.set("status", status)
      if (provider !== "all") queryParams.set("provider", provider)

      const response = await fetch(`/api/admin/billing?${queryParams.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setSubscriptions(data.subscriptions)
        setTotalCount(data.totalCount)
        setSummary(data.summary)
      } else {
        console.error("Error fetching billing data:", data.error)
        toast({
          title: "Error",
          description: `Failed to fetch billing data: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching billing data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch billing data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchBillingData()
  }

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" /> Inactive
          </Badge>
        )
      case "trialing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="w-3 h-3 mr-1" /> Trial
          </Badge>
        )
      case "past_due":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Past Due
          </Badge>
        )
      case "canceled":
        return (
          <Badge variant="outline">
            <XCircle className="w-3 h-3 mr-1" /> Canceled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit)

  // Effect to fetch data on mount and when filters change
  useEffect(() => {
    fetchBillingData()
  }, [page, limit, plan, status, provider, sortBy, sortOrder])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <Button onClick={fetchBillingData} variant="outline" className="w-full md:w-auto">
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {summary.plans?.map((p) => `${p.count} ${p.plan}`).join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.statuses?.find((s) => s.status === "active")?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                ((summary.statuses?.find((s) => s.status === "active")?.count || 0) / (totalCount || 1)) * 100,
              )}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.credits?.sum?.total_credits?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary.credits?.sum?.used_credits?.toLocaleString() || 0} credits used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Usage</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((summary.credits?.sum?.used_credits || 0) / (summary.credits?.sum?.total_credits || 1)) * 100,
              )}
              %
            </div>
            <Progress
              value={Math.round(
                ((summary.credits?.sum?.used_credits || 0) / (summary.credits?.sum?.total_credits || 1)) * 100,
              )}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search subscription data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search user ID or customer ID..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="space-y-2">
              <Select
                value={plan}
                onValueChange={(value) => {
                  setPlan(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select
                value={provider}
                onValueChange={(value) => {
                  setProvider(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paddle">Paddle</SelectItem>
                  <SelectItem value="fatora">Fatora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Data</CardTitle>
          <CardDescription>
            Showing {subscriptions.length} of {totalCount} subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("user_id")}>
                      User ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => handleSort("plan")}>
                      Plan
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent"
                      onClick={() => handleSort("payment_provider")}
                    >
                      Provider
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 hover:bg-transparent"
                      onClick={() => handleSort("current_period_end")}
                    >
                      Renewal Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading subscription data...
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[120px]" title={subscription.user_id}>
                            {subscription.user_id}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(subscription.user_id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subscription.plan === "Free"
                              ? "outline"
                              : subscription.plan === "Pro"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {subscription.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        {subscription.payment_provider ? (
                          <Badge variant="outline" className="capitalize">
                            {subscription.payment_provider}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[120px]" title={getCustomerId(subscription)}>
                            {getCustomerId(subscription) || "N/A"}
                          </span>
                          {getCustomerId(subscription) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(getCustomerId(subscription))}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(subscription.current_period_end)}</TableCell>
                      <TableCell>
                        {subscription.credits && subscription.credits.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <div className="text-sm">
                              {subscription.credits[0].used_credits} / {subscription.credits[0].total_credits}
                            </div>
                            <Progress
                              value={Math.round(
                                (subscription.credits[0].used_credits / subscription.credits[0].total_credits) * 100,
                              )}
                              className="h-2"
                            />
                          </div>
                        ) : (
                          "No credits"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink onClick={() => setPage(pageNum)} isActive={pageNum === page}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get the appropriate customer ID based on payment provider
function getCustomerId(subscription) {
  if (subscription.payment_provider === "stripe") {
    return subscription.stripe_customer_id
  } else if (subscription.payment_provider === "paddle") {
    return subscription.paddle_customer_id
  } else if (subscription.payment_provider === "fatora") {
    return subscription.fatora_order_id
  }
  return null
}
