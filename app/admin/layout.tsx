"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Check if we're on the login page
  const isLoginPage = pathname === "/admin/login"

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // If we're on the login page, render only the children without the admin layout
  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>
  }

  // Otherwise, render the full admin layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
