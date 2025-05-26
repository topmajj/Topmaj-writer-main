"use client"

import { useEffect, useState } from "react"
import { FileText, FolderOpen, Plus, Search, SlidersHorizontal, Loader2, Copy, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useLanguage } from "@/contexts/language-context"
import { getTranslation } from "@/lib/translations"

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

export default function DocumentsPage() {
  const { language } = useLanguage()
  const t = (key: string, params?: Record<string, any>) => getTranslation(key, language, params)

  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Sample folders
  const folders = [
    { id: "1", name: "Marketing", count: 12 },
    { id: "2", name: "Blog Posts", count: 8 },
    { id: "3", name: "Social Media", count: 15 },
    { id: "4", name: "Product", count: 6 },
  ]

  // Get recent documents (last 7 days)
  const recentDocuments = documents.filter((doc) => {
    const docDate = new Date(doc.created_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return docDate >= sevenDaysAgo
  })

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/content/list")

        if (!response.ok) {
          if (response.status === 401) {
            setError(t("documents.authError"))
            toast.error(t("documents.authError"))
            return
          }
          throw new Error(t("documents.fetchError"))
        }

        const data = await response.json()
        setDocuments(data.documents || [])
      } catch (error) {
        console.error("Error fetching documents:", error)
        setError(t("documents.loadError"))
        toast.error(t("documents.loadError"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [language])

  // Filter documents based on search term
  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDocuments = filteredDocuments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)

  // Pagination for recent documents
  const indexOfLastRecentItem = currentPage * itemsPerPage
  const indexOfFirstRecentItem = indexOfLastRecentItem - itemsPerPage
  const currentRecentDocuments = recentDocuments.slice(indexOfFirstRecentItem, indexOfLastRecentItem)
  const totalRecentPages = Math.ceil(recentDocuments.length / itemsPerPage)

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return t("documents.today")
    } else if (diffDays === 1) {
      return t("documents.yesterday")
    } else if (diffDays < 7) {
      return t("documents.daysAgo", { days: diffDays })
    } else if (diffDays < 30) {
      return t("documents.weeksAgo", { weeks: Math.floor(diffDays / 7) })
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

    return t("documents.defaultCategory")
  }

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc)
    setIsPreviewOpen(true)
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(t("documents.copiedSuccess"))
    } catch (error) {
      console.error("Failed to copy content:", error)
      toast.error(t("documents.copyError"))
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm(t("documents.deleteConfirm"))) {
      return
    }

    try {
      const response = await fetch(`/api/content/delete?id=${docId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(t("documents.deleteError"))
      }

      toast.success(t("documents.deleteSuccess"))
      // Remove the document from the state
      setDocuments(documents.filter((doc) => doc.id !== docId))
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error(t("documents.deleteError"))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("documents.title")}</h1>
        <p className="text-muted-foreground">{t("documents.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("documents.searchPlaceholder")}
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("documents.filter")}
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/templates">
              <Plus className="mr-2 h-4 w-4" />
              {t("documents.newDocument")}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            {t("documents.allDocuments")}
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1">
            {t("documents.recent")}
          </TabsTrigger>
          <TabsTrigger value="folders" className="flex-1">
            {t("documents.folders")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="w-full mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard/templates">{t("documents.createNewDocument")}</Link>
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t("documents.noDocumentsFound")}</p>
              <Button asChild>
                <Link href="/dashboard/templates">{t("documents.createFirstDocument")}</Link>
              </Button>
            </div>
          ) : (
            <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden w-full">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1 text-base">{doc.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handlePreview(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("documents.preview")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCopy(doc.content)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t("documents.copyContent")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(doc.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("documents.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-1 h-3 w-3" />
                      {doc.word_count} {t("documents.words")}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Badge variant="secondary">{getCategory(doc)}</Badge>
                    <div className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</div>
                  </CardFooter>
                </Card>
              ))}
              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }}
                        />
                      </PaginationItem>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={pageNum === currentPage}
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(pageNum)
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                          }}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="w-full mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t("documents.noRecentDocuments")}</p>
              <Button asChild>
                <Link href="/dashboard/templates">{t("documents.createNewDocument")}</Link>
              </Button>
            </div>
          ) : (
            <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentRecentDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden w-full">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1 text-base">{doc.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handlePreview(doc)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("documents.preview")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCopy(doc.content)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t("documents.copyContent")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(doc.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("documents.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-1 h-3 w-3" />
                      {doc.word_count} {t("documents.words")}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Badge variant="secondary">{getCategory(doc)}</Badge>
                    <div className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</div>
                  </CardFooter>
                </Card>
              ))}
              {totalRecentPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }}
                        />
                      </PaginationItem>
                    )}

                    {Array.from({ length: Math.min(5, totalRecentPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum
                      if (totalRecentPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalRecentPages - 2) {
                        pageNum = totalRecentPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={pageNum === currentPage}
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(pageNum)
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    {currentPage < totalRecentPages && (
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage((prev) => Math.min(prev + 1, totalRecentPages))
                          }}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="overflow-hidden w-full">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FolderOpen className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{folder.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{t("documents.rename")}</DropdownMenuItem>
                        <DropdownMenuItem>{t("documents.move")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">{t("documents.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-sm text-muted-foreground">
                    {folder.count} {t("documents.documentsCount")}
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4">
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href={`/folders/${folder.id}`}>{t("documents.openFolder")}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              {t("documents.created")} {selectedDocument && formatDate(selectedDocument.created_at)} •{" "}
              {selectedDocument?.word_count} {t("documents.words")}
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
              {t("documents.close")}
            </Button>
            <Button onClick={() => selectedDocument && handleCopy(selectedDocument.content)}>
              <Copy className="mr-2 h-4 w-4" />
              {t("documents.copyContent")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
