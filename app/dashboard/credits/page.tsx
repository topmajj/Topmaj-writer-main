"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, RefreshCw, Clock, ArrowUpRight, Info } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { getCreditUsageHistory, getUserCredits, type CreditLogEntry, CreditActionType } from "@/lib/credits-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function CreditsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState<{ totalCredits: number; usedCredits: number } | null>(null)
  const [usageHistory, setUsageHistory] = useState<CreditLogEntry[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (user) {
      fetchCreditsData()
    }
  }, [user, refreshTrigger])

  const fetchCreditsData = async () => {
    setIsLoading(true)
    try {
      if (!user?.id) return

      // Fetch user credits
      const userCredits = await getUserCredits(user.id)
      if (userCredits) {
        setCredits({
          totalCredits: userCredits.totalCredits,
          usedCredits: userCredits.usedCredits,
        })
      }

      // Fetch credit usage history
      const history = await getCreditUsageHistory(user.id, 100)
      setUsageHistory(history)
    } catch (error) {
      console.error("Error fetching credits data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const getActionTypeLabel = (actionType: string): string => {
    switch (actionType) {
      case CreditActionType.TEXT_GENERATION:
        return "Text Generation"
      case CreditActionType.IMAGE_GENERATION:
        return "Image Generation"
      case CreditActionType.TRANSLATION:
        return "Translation"
      case CreditActionType.GRAMMAR_CHECK:
        return "Grammar Check"
      case CreditActionType.CONTENT_IMPROVEMENT:
        return "Content Improvement"
      case CreditActionType.MANUAL_ADJUSTMENT:
        return "Manual Adjustment"
      case CreditActionType.PLAN_UPGRADE:
        return "Plan Upgrade"
      case CreditActionType.PLAN_RENEWAL:
        return "Plan Renewal"
      default:
        return actionType
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case CreditActionType.TEXT_GENERATION:
        return <CreditCard className="h-4 w-4" />
      case CreditActionType.IMAGE_GENERATION:
        return <CreditCard className="h-4 w-4" />
      case CreditActionType.TRANSLATION:
        return <CreditCard className="h-4 w-4" />
      case CreditActionType.GRAMMAR_CHECK:
        return <CreditCard className="h-4 w-4" />
      case CreditActionType.CONTENT_IMPROVEMENT:
        return <CreditCard className="h-4 w-4" />
      case CreditActionType.MANUAL_ADJUSTMENT:
        return <ArrowUpRight className="h-4 w-4" />
      case CreditActionType.PLAN_UPGRADE:
        return <ArrowUpRight className="h-4 w-4" />
      case CreditActionType.PLAN_RENEWAL:
        return <RefreshCw className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2 w-full">
          <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
          <p className="text-muted-foreground">Loading your credit information...</p>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
            <p className="text-muted-foreground">Manage and track your credit usage</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>Your current credit usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {credits ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Credits Used</span>
                    <span className="font-medium">
                      {credits.usedCredits.toLocaleString()} / {credits.totalCredits.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(credits.usedCredits / credits.totalCredits) * 100} className="h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Credits</p>
                    <p className="text-2xl font-bold">
                      {(credits.totalCredits - credits.usedCredits).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="px-3 py-1">
                    {Math.round((credits.usedCredits / credits.totalCredits) * 100)}% Used
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No credit information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Costs</CardTitle>
            <CardDescription>How credits are used for different actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Text Generation</span>
                </div>
                <Badge>10 credits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Image Generation</span>
                </div>
                <Badge>50 credits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Translation</span>
                </div>
                <Badge>5 credits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Grammar Check</span>
                </div>
                <Badge>3 credits</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Content Improvement</span>
                </div>
                <Badge>15 credits</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Recent credit usage and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {usageHistory.length > 0 ? (
            <div className="space-y-4">
              {usageHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">{getActionIcon(entry.actionType)}</div>
                    <div>
                      <p className="font-medium">{getActionTypeLabel(entry.actionType)}</p>
                      <p className="text-sm text-muted-foreground">{entry.description || "No description"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant={entry.creditsUsed > 0 ? "destructive" : "outline"} className="mb-1">
                      {entry.creditsUsed > 0 ? `-${entry.creditsUsed}` : "+0"} credits
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No usage history</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your credit usage history will appear here once you start using the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
