"use client"
import { ChevronDown, LogOut, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"
// Import the CreditStatus component at the top of the file
import { CreditStatus } from "@/components/credit-status"

export function AppHeader() {
  const { user, signOut } = useAuth()
  const { language, isRTL } = useLanguage()

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U"
    const email = user.email
    const name = email.split("@")[0]

    // Handle special characters and numbers in the username
    const cleanName = name.replace(/[^a-zA-Z]/g, " ").trim()

    if (cleanName.length === 0) {
      // If no letters in the name, use first character of email
      return email[0].toUpperCase()
    }

    const parts = cleanName.split(/\s+/)
    if (parts.length > 1) {
      // Get first letter of first two parts
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    // Get first two letters of name, or just first if name is one letter
    return cleanName.length > 1 ? cleanName.substring(0, 2).toUpperCase() : cleanName[0].toUpperCase()
  }

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 w-full ${isRTL ? "justify-end" : ""}`}
    >
      <SidebarTrigger className={isRTL ? "order-last" : ""} />

      <div className={`${isRTL ? "mr-auto" : "ml-auto"} flex items-center gap-4`}>
        <CreditStatus />
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-3 py-2 rounded-full hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8 border-2 border-primary/10">
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt={user?.email ? `${user.email}'s profile` : "User profile"}
                  onError={(e) => {
                    // Hide the image on error
                    e.currentTarget.style.display = "none"
                  }}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">{user?.email?.split("@")[0] || "User"}</span>
                <span className="text-xs text-muted-foreground leading-none mt-1">
                  {user?.email ? user.email : "user@example.com"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.email?.split("@")[0] || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/account/settings" className="flex w-full">
                  <Settings className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                  <span>{t("common.settings", language)}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
              <span>{t("common.logout", language)}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
