"use client"

import { BookText, FileText, ImageIcon, MessageSquare, Sparkles, Wand2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AITools() {
  const tools = [
    {
      title: "Blog Writer",
      description: "Generate SEO-optimized blog posts with AI",
      icon: BookText,
      href: "/dashboard/ai-tools/blog-writer",
      category: "content",
    },
    {
      title: "Social Media",
      description: "Create engaging social media content",
      icon: MessageSquare,
      href: "/dashboard/ai-tools/social-media",
      category: "content",
    },
    {
      title: "Content Improver",
      description: "Enhance your existing content",
      icon: Wand2,
      href: "/dashboard/ai-tools/content-improver",
      category: "editing",
    },
    {
      title: "Email Writer",
      description: "Draft professional emails quickly",
      icon: FileText,
      href: "/dashboard/ai-tools/email-writer",
      category: "content",
    },
    {
      title: "Brainstorming",
      description: "Generate ideas for your content",
      icon: Sparkles,
      href: "/dashboard/ai-tools/brainstorming",
      category: "ideation",
    },
    {
      title: "Grammar Checker",
      description: "Fix grammar and spelling errors",
      icon: Wand2,
      href: "/dashboard/ai-tools/grammar-checker",
      category: "editing",
    },
    {
      title: "Image Generation",
      description: "Generate images from text prompts",
      icon: ImageIcon,
      href: "/dashboard/content/image-generation",
      category: "media",
    },
  ]

  return (
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
              <Link href={tool.href}>Use Tool</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
