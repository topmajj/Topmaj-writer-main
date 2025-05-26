"use client"
import {
  FileText,
  ImageIcon,
  Languages,
  LayoutDashboard,
  Settings,
  Star,
  LayoutTemplateIcon as Template,
  Wand2,
  DollarSign,
  PenTool,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export function AppSidebar() {
  const pathname = usePathname()
  const { language, isRTL } = useLanguage()

  const mainNavItems = [
    {
      title: t("navigation.dashboard", language),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("navigation.documents", language),
      href: "/dashboard/documents",
      icon: FileText,
    },
    {
      title: t("navigation.templates", language),
      href: "/dashboard/templates",
      icon: Template,
    },
    {
      title: t("navigation.aiTools", language),
      href: "/dashboard/ai-tools",
      icon: Wand2,
    },
  ]

  const contentNavItems = [
    {
      title: t("navigation.translation", language),
      href: "/dashboard/content/translation",
      icon: Languages,
    },
    {
      title: t("navigation.imageGeneration", language),
      href: "/dashboard/content/image-generation",
      icon: ImageIcon,
    },
  ]

  const accountNavItems = [
    {
      title: t("navigation.billing", language),
      href: "/dashboard/billing",
      icon: DollarSign,
    },
    {
      title: t("navigation.settings", language),
      href: "/dashboard/account/settings",
      icon: Settings,
    },
  ]

  // Add RTL-specific styles for the sidebar
  const sidebarClassName = isRTL ? "rtl-sidebar" : ""

  return (
    <Sidebar className={sidebarClassName} side={isRTL ? "right" : "left"}>
      <SidebarHeader className="flex flex-col gap-2 px-3 py-4">
        <div className="flex items-center gap-2 px-2">
          <PenTool className="h-6 w-6 text-teal-400" />
          <span className="text-xl font-bold">TopMaj Writer</span>
        </div>
        <Button asChild variant="default" className="w-full justify-start gap-2">
          <Link href="/dashboard/documents/new">
            <FileText className="h-4 w-4" />
            {t("common.newDocument", language)}
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.main", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.content", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.account", language)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <ModeToggle />
          <Button variant="outline" size="icon">
            <Star className="h-4 w-4" />
            <span className="sr-only">{t("common.favorites", language)}</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
