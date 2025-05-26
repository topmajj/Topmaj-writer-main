"use client"

import { ArrowUpRight, BookText, FileText, MessageSquare, Sparkles, Wand2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AIToolsPage() {
  const { language } = useLanguage()

  const tools = [
    {
      title: t("aiTools.tools.blogWriter.title", language),
      description: t("aiTools.tools.blogWriter.description", language),
      icon: BookText,
      href: "/dashboard/ai-tools/blog-writer",
      category: "content",
    },
    {
      title: t("aiTools.tools.socialMedia.title", language),
      description: t("aiTools.tools.socialMedia.description", language),
      icon: MessageSquare,
      href: "/dashboard/ai-tools/social-media",
      category: "content",
    },
    {
      title: t("aiTools.tools.contentImprover.title", language),
      description: t("aiTools.tools.contentImprover.description", language),
      icon: Wand2,
      href: "/dashboard/ai-tools/content-improver",
      category: "editing",
    },
    {
      title: t("aiTools.tools.emailWriter.title", language),
      description: t("aiTools.tools.emailWriter.description", language),
      icon: FileText,
      href: "/dashboard/ai-tools/email-writer",
      category: "content",
    },
    {
      title: t("aiTools.tools.brainstorming.title", language),
      description: t("aiTools.tools.brainstorming.description", language),
      icon: Sparkles,
      href: "/dashboard/ai-tools/brainstorming",
      category: "ideation",
    },
    {
      title: t("aiTools.tools.grammarChecker.title", language),
      description: t("aiTools.tools.grammarChecker.description", language),
      icon: Wand2,
      href: "/dashboard/ai-tools/grammar-checker",
      category: "editing",
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("aiTools.title", language)}</h1>
        <p className="text-muted-foreground">{t("aiTools.subtitle", language)}</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            {t("aiTools.categories.allTools", language)}
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1">
            {t("aiTools.categories.contentCreation", language)}
          </TabsTrigger>
          <TabsTrigger value="editing" className="flex-1">
            {t("aiTools.categories.editing", language)}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1">
            {t("aiTools.categories.media", language)}
          </TabsTrigger>
          <TabsTrigger value="ideation" className="flex-1">
            {t("aiTools.categories.ideation", language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card key={tool.title} className="flex flex-col w-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between">
                    <Link href={tool.href}>
                      {t("common.useTool", language)}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {["content", "editing", "media", "ideation"].map((category) => (
          <TabsContent key={category} value={category} className="w-full mt-4">
            <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools
                .filter((tool) => tool.category === category)
                .map((tool) => (
                  <Card key={tool.title} className="flex flex-col w-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-2">
                          {tool.icon && <tool.icon className="h-5 w-5 text-primary" />}
                        </div>
                        <CardTitle>{tool.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardDescription>{tool.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="ghost" className="w-full justify-between">
                        <Link href={tool.href}>
                          {t("common.useTool", language)}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
