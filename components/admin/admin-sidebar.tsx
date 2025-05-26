"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileText, Settings, PenTool, X, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdminSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function AdminSidebar({ open, setOpen }: AdminSidebarProps) {
  const pathname = usePathname()

  const routes = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Content",
      href: "/admin/content",
      icon: FileText,
    },
    {
      title: "Billing",
      href: "/admin/billing",
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <PenTool className="h-6 w-6 text-teal-400" />
            <span className="text-xl font-bold">Admin Panel</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="py-4 px-2">
            <nav className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md group relative",
                    pathname === route.href
                      ? "bg-teal-400/10 text-teal-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <route.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{route.title}</span>
                  {route.badge && (
                    <span className="ml-auto bg-teal-400 text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                      {route.badge}
                    </span>
                  )}
                  {pathname === route.href && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-400 rounded-l-md" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
