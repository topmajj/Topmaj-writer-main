import { BookText, Calendar, Edit, Plus, Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function BlogPostsPage() {
  // Sample blog posts
  const blogPosts = [
    {
      id: "1",
      title: "10 Tips for Effective Content Marketing",
      status: "Published",
      date: "May 15, 2023",
      category: "Marketing",
      wordCount: 1500,
    },
    {
      id: "2",
      title: "How to Optimize Your Website for SEO",
      status: "Draft",
      date: "June 2, 2023",
      category: "SEO",
      wordCount: 1800,
    },
    {
      id: "3",
      title: "The Future of AI in Content Creation",
      status: "Published",
      date: "April 28, 2023",
      category: "Technology",
      wordCount: 2200,
    },
    {
      id: "4",
      title: "Building a Strong Brand Identity",
      status: "Draft",
      date: "June 10, 2023",
      category: "Branding",
      wordCount: 1650,
    },
    {
      id: "5",
      title: "Social Media Strategies for Small Businesses",
      status: "Published",
      date: "May 5, 2023",
      category: "Social Media",
      wordCount: 1900,
    },
    {
      id: "6",
      title: "Email Marketing Best Practices",
      status: "Draft",
      date: "June 15, 2023",
      category: "Marketing",
      wordCount: 1700,
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
        <p className="text-muted-foreground">Create and manage your blog content with AI assistance.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search blog posts..." className="w-full pl-8" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Blog Post
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All Posts
          </TabsTrigger>
          <TabsTrigger value="published" className="flex-1">
            Published
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex-1">
            Drafts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden w-full">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2 text-base">{post.title}</CardTitle>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {post.date}
                    </div>
                    <div className="flex items-center">
                      <BookText className="mr-1 h-3 w-3" />
                      {post.wordCount} words
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <Badge variant={post.status === "Published" ? "default" : "secondary"}>{post.status}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/content/blog-posts/${post.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts
              .filter((post) => post.status === "Published")
              .map((post) => (
                <Card key={post.id} className="overflow-hidden w-full">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-2 text-base">{post.title}</CardTitle>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {post.date}
                      </div>
                      <div className="flex items-center">
                        <BookText className="mr-1 h-3 w-3" />
                        {post.wordCount} words
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Badge variant="default">{post.status}</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/content/blog-posts/${post.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts
              .filter((post) => post.status === "Draft")
              .map((post) => (
                <Card key={post.id} className="overflow-hidden w-full">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-2 text-base">{post.title}</CardTitle>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {post.date}
                      </div>
                      <div className="flex items-center">
                        <BookText className="mr-1 h-3 w-3" />
                        {post.wordCount} words
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t p-4">
                    <Badge variant="secondary">{post.status}</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/content/blog-posts/${post.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
