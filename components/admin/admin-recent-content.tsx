"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ContentItem {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  template_id: string | null
  word_count: number
}

export function AdminRecentContent() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentContent() {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/recent-content")

        if (!response.ok) {
          throw new Error(`Error fetching content: ${response.status}`)
        }

        const data = await response.json()
        setContent(data)
      } catch (err) {
        console.error("Error fetching recent content:", err)
        setError("Failed to load recent content")
      } finally {
        setLoading(false)
      }
    }

    fetchRecentContent()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground pb-2 border-b">
          <div className="col-span-6">Content</div>
          <div className="col-span-2">Words</div>
          <div className="col-span-4">Created</div>
        </div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center">
              <div className="col-span-6 flex items-center gap-3">
                <Skeleton className="h-8 w-8" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  const getContentIcon = (content: ContentItem) => {
    if (content.title?.toLowerCase().includes("instagram") || content.title?.toLowerCase().includes("twitter")) {
      return <MessageSquare className="h-4 w-4 text-teal-400" />
    } else if (content.title?.toLowerCase().includes("image")) {
      return <ImageIcon className="h-4 w-4 text-teal-400" />
    } else {
      return <FileText className="h-4 w-4 text-teal-400" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground pb-2 border-b">
        <div className="col-span-6">Content</div>
        <div className="col-span-2">Words</div>
        <div className="col-span-4">Created</div>
      </div>
      <div className="space-y-4">
        {content.length > 0 ? (
          content.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center">
              <div className="col-span-6 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-400/10">
                  {getContentIcon(item)}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title || "Untitled Content"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {item.content?.substring(0, 30)}...
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500 border-blue-500/20"
                >
                  {item.word_count || 0}
                </Badge>
              </div>
              <div className="col-span-4 text-sm text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-12 text-center py-4 text-muted-foreground">No content found</div>
        )}
      </div>
    </div>
  )
}
