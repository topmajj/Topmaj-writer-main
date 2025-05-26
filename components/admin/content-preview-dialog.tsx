"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ContentItem {
  id: string
  title: string
  content: string
  word_count: number
  created_at: string
  user_id: string
  template_id: string | null
  form_data: any
}

interface ContentPreviewDialogProps {
  content: ContentItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContentPreviewDialog({ content, open, onOpenChange }: ContentPreviewDialogProps) {
  if (!content) return null

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Format JSON
  const formatJSON = (json: any) => {
    if (!json) return "No data"
    if (typeof json === "string") {
      try {
        return JSON.stringify(JSON.parse(json), null, 2)
      } catch (e) {
        return json
      }
    }
    return JSON.stringify(json, null, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>
            Created on {formatDate(content.created_at)} • {content.word_count} words
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="md:col-span-2">
            <div className="text-sm font-medium mb-2">Content</div>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="whitespace-pre-wrap">{content.content}</div>
            </ScrollArea>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Metadata</div>
            <div className="space-y-2">
              <div className="text-xs">
                <span className="font-medium">ID:</span> {content.id}
              </div>
              <div className="text-xs">
                <span className="font-medium">User ID:</span> {content.user_id}
              </div>
              <div className="text-xs">
                <span className="font-medium">Template ID:</span> {content.template_id || "None"}
              </div>
              <div className="text-xs">
                <span className="font-medium">Created:</span> {formatDate(content.created_at)}
              </div>
              <div className="text-xs">
                <span className="font-medium">Word Count:</span> {content.word_count}
              </div>
            </div>

            <div className="text-sm font-medium mt-4 mb-2">Form Data</div>
            <ScrollArea className="h-[120px] rounded-md border p-2">
              <pre className="text-xs">{formatJSON(content.form_data)}</pre>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
