"use client"

import { useEffect, useState } from "react"
import { CalendarDays, MoreHorizontal, Loader2, Copy, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

interface Document {
  id: string
  title: string
  content: string
  word_count: number
  created_at: string
  updated_at: string
  template_id: string | null
  form_data: Record<string, any>
}

export function RecentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const { language } = useLanguage()

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/content/list")

        if (!response.ok) {
          if (response.status === 401) {
            setError(t("documents.authError", language))
            toast.error(t("documents.authError", language))
            return
          }
          throw new Error(t("documents.fetchError", language))
        }

        const data = await response.json()
        setDocuments(data.documents?.slice(0, 4) || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
        setError(t("documents.loadError", language))
        toast.error(t("documents.loadError", language))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [language])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return t("documents.today", language)
    } else if (diffDays === 1) {
      return t("documents.yesterday", language)
    } else if (diffDays < 7) {
      return t("documents.daysAgo", language).replace("{days}", diffDays.toString())
    } else if (diffDays < 30) {
      return t("documents.weeksAgo", language).replace("{weeks}", Math.floor(diffDays / 7).toString())
    } else {
      return date.toLocaleDateString()
    }
  }

  // Get category from form data or default
  const getCategory = (doc: Document) => {
    if (doc.form_data && doc.form_data.category) {
      return doc.form_data.category
    }

    if (doc.form_data && doc.form_data.platform) {
      return doc.form_data.platform
    }

    return t("documents.defaultCategory", language)
  }

  // Get description from content
  const getDescription = (content: string) => {
    return content.substring(0, 100) + (content.length > 100 ? "..." : "")
  }

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc)
    setIsPreviewOpen(true)
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(t("documents.copiedSuccess", language))
    } catch (error) {
      console.error("Failed to copy content:", error)
      toast.error(t("documents.copyError", language))
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm(t("documents.deleteConfirm", language))) {
      return
    }

    try {
      const response = await fetch(`/api/content/delete?id=${docId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(t("documents.deleteError", language))
      }

      toast.success(t("documents.deleteSuccess", language))
      // Remove the document from the state
      setDocuments(documents.filter((doc) => doc.id !== docId))
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error(t("documents.deleteError", language))
    }
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button asChild>
          <Link href="/dashboard/templates">{t("documents.createNew", language)}</Link>
        </Button>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{t("documents.noDocuments", language)}</p>
        <Button asChild>
          <Link href="/dashboard/templates">{t("documents.createFirst", language)}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden w-full">
          <CardHeader className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="line-clamp-1">{doc.title}</CardTitle>
                <CardDescription className="line-clamp-2">{getDescription(doc.content)}</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t("common.menu", language)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handlePreview(doc)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("documents.preview", language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleCopy(doc.content)}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t("documents.copyContent", language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleDelete(doc.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("documents.delete", language)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-1 h-3 w-3" />
              {formatDate(doc.created_at)}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <Badge variant="secondary">{getCategory(doc)}</Badge>
            <div className="text-xs text-muted-foreground">
              {doc.word_count} {t("documents.words", language)}
            </div>
          </CardFooter>
        </Card>
      ))}
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              {t("documents.created", language)} {selectedDocument && formatDate(selectedDocument.created_at)} •{" "}
              {selectedDocument?.word_count} {t("documents.words", language)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-md bg-muted/30">
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              {selectedDocument?.content.split("\n\n").map((paragraph, index) =>
                paragraph.trim() ? (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ) : null,
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              {t("common.close", language)}
            </Button>
            <Button onClick={() => selectedDocument && handleCopy(selectedDocument.content)}>
              <Copy className="mr-2 h-4 w-4" />
              {t("documents.copyContent", language)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
