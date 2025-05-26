"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { hasAuthCookie, setServerSession } from "@/lib/auth-cookies"
import { logger } from "@/lib/logger"
import { useLanguage } from "@/contexts/language-context"
import "../rtl-fixes.css"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading: authLoading, session, user, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { isRTL } = useLanguage()

  useEffect(() => {
    const checkAuth = async () => {
      // If auth context is still loading, wait
      if (authLoading) return

      // If we have a session, we're good to go
      if (session && user) {
        logger.info("Dashboard: User is authenticated:", { email: user.email })

        // Ensure our custom cookie is set
        if (!hasAuthCookie()) {
          logger.warn("Dashboard: Auth cookie not found despite having session, setting it now")
          await setServerSession()
        }

        setIsLoading(false)
        return
      }

      // If auth context has finished loading and we don't have a session
      if (!authLoading && !session) {
        logger.info("Dashboard: No session found, redirecting to login")
        router.push("/auth/signin")
      }
    }

    checkAuth()
  }, [authLoading, session, user, router, refreshSession])

  // Add a periodic session refresh to keep the session alive
  useEffect(() => {
    if (!session) return

    // Refresh the session every 10 minutes
    const intervalId = setInterval(
      async () => {
        logger.info("Dashboard: Refreshing session periodically")
        await refreshSession()
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return () => clearInterval(intervalId)
  }, [session, refreshSession])

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Only render the dashboard if we have a session
  if (!session) return null

  return (
    <SidebarProvider>
      <div className="dashboard-layout flex min-h-screen w-full">
        <div className="dashboard-sidebar">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col w-full">
          <div className="dashboard-header">
            <AppHeader />
          </div>
          <main className="dashboard-content flex-1 p-4 md:p-6 w-full max-w-none">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
