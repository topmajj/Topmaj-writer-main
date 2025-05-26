"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { ContentPreviewDialog } from "@/components/admin/content-preview-dialog"
import { getAdminContent, deleteContent } from "./actions"

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

export default function AdminContentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [itemToPreview, setItemToPreview] = useState<ContentItem | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch content when parameters change
  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      setError(null)

      try {
        const result = await getAdminContent(page, pageSize, debouncedSearchTerm, sortBy, sortOrder)

        if (result.error) {
          setError(result.error)
          toast.error(result.error)
        } else if (result.data) {
          setContent(result.data)
          setTotalPages(result.pagination?.totalPages || 1)
          setTotalItems(result.pagination?.total || 0)
        }
      } catch (err) {
        console.error("Error fetching content:", err)
        setError("Failed to fetch content")
        toast.error("Failed to fetch content")
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [page, pageSize, debouncedSearchTerm, sortBy, sortOrder])

  // Handle sort toggle
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      const result = await deleteContent(itemToDelete)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Content deleted successfully")
        // Refresh content
        const result = await getAdminContent(page, pageSize, debouncedSearchTerm, sortBy, sortOrder)

        if (result.data) {
          setContent(result.data)
          setTotalPages(result.pagination?.totalPages || 1)
          setTotalItems(result.pagination?.total || 0)
        }
      }
    } catch (err) {
      console.error("Error deleting content:", err)
      toast.error("Failed to delete content")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Handle preview
  const handlePreview = (item: ContentItem) => {
    setItemToPreview(item)
    setPreviewDialogOpen(true)
  }

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

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Content Management</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No content found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center cursor-pointer" onClick={() => toggleSort("title")}>
                        Title
                        {sortBy === "title" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="ml-1 h-4 w-4" />
                          ) : (
                            <SortDesc className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Content</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <div className="flex items-center cursor-pointer" onClick={() => toggleSort("word_count")}>
                        Words
                        {sortBy === "word_count" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="ml-1 h-4 w-4" />
                          ) : (
                            <SortDesc className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">User ID</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => toggleSort("created_at")}>
                        Created
                        {sortBy === "created_at" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="ml-1 h-4 w-4" />
                          ) : (
                            <SortDesc className="ml-1 h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{truncateText(item.title, 30)}</TableCell>
                      <TableCell className="hidden md:table-cell">{truncateText(item.content, 50)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{item.word_count}</TableCell>
                      <TableCell className="hidden lg:table-cell">{truncateText(item.user_id, 8)}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setItemToDelete(item.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {content.length} of {totalItems} items
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {itemToPreview && (
        <ContentPreviewDialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen} content={itemToPreview} />
      )}
    </div>
  )
}
