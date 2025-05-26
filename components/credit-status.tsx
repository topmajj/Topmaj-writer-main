"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard } from "lucide-react"
import { getUserCredits } from "@/lib/credits-service"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function CreditStatus() {
  const { user } = useAuth()
  const router = useRouter()
  const [credits, setCredits] = useState<{ totalCredits: number; usedCredits: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCredits()
    }
  }, [user])

  const fetchCredits = async () => {
    setIsLoading(true)
    try {
      if (!user?.id) return

      const userCredits = await getUserCredits(user.id)
      if (userCredits) {
        setCredits({
          totalCredits: userCredits.totalCredits,
          usedCredits: userCredits.usedCredits,
        })
      }
    } catch (error) {
      console.error("Error fetching credits:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !credits) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border">
        <CreditCard className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  const remainingCredits = credits.totalCredits - credits.usedCredits
  const percentUsed = (credits.usedCredits / credits.totalCredits) * 100

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={() => router.push("/dashboard/credits")}
    >
      <CreditCard className="h-4 w-4" />
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium">
          {remainingCredits.toLocaleString()} / {credits.totalCredits.toLocaleString()} credits
        </span>
        <Progress value={percentUsed} className="h-1 w-16" />
      </div>
    </Button>
  )
}
