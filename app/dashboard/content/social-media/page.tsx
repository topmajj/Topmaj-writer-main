import { Calendar, Instagram, Linkedin, MessageSquare, Plus, Search, SlidersHorizontal, Twitter } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function SocialMediaPage() {
  // Sample social media posts
  const socialPosts = [
    {
      id: "1",
      content: "Excited to announce our new AI-powered content creation platform! #AIWriting #ContentCreation",
      platform: "Twitter",
      status: "Scheduled",
      date: "June 20, 2023",
      icon: Twitter,
    },
    {
      id: "2",
      content: "Check out our latest blog post on '10 Ways AI Can Improve Your Content Strategy' - link in bio!",
      platform: "Instagram",
      status: "Published",
      date: "May 15, 2023",
      icon: Instagram,
    },
    {
      id: "3",
      content:
        "We're hiring! Join our team of AI enthusiasts and help shape the future of content creation. Apply now through the link below.",
      platform: "LinkedIn",
      status: "Draft",
      date: "June 25, 2023",
      icon: Linkedin,
    },
    {
      id: "4",
      content: "How are you using AI in your content strategy? Share your experiences in the comments below!",
      platform: "Twitter",
      status: "Published",
      date: "May 10, 2023",
      icon: Twitter,
    },
    {
      id: "5",
      content:
        "New feature alert! Our AI writer now supports 12 languages. Try it out today and reach a global audience.",
      platform: "LinkedIn",
      status: "Scheduled",
      date: "June 22, 2023",
      icon: Linkedin,
    },
    {
      id: "6",
      content:
        "Behind the scenes look at our AI development team working on the next big update. #TeamWork #AIInnovation",
      platform: "Instagram",
      status: "Draft",
      date: "June 30, 2023",
      icon: Instagram,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Social Media</h1>
        <p className="text-muted-foreground">Create, schedule, and manage your social media content.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search posts..." className="w-full pl-8" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4 w-full">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 w-full">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {socialPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <post.icon className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{post.platform}</CardTitle>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="line-clamp-3 text-sm">{post.content}</p>
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {post.date}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <Badge
                    variant={
                      post.status === "Published" ? "default" : post.status === "Scheduled" ? "outline" : "secondary"
                    }
                  >
                    {post.status}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/content/social-media/${post.id}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {["published", "scheduled", "drafts"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 w-full">
            <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {socialPosts
                .filter((post) => post.status.toLowerCase() === status.charAt(0).toUpperCase() + status.slice(1))
                .map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary/10 p-1">
                            <post.icon className="h-4 w-4 text-primary" />
                          </div>
                          <CardTitle className="text-base">{post.platform}</CardTitle>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Archive</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="line-clamp-3 text-sm">{post.content}</p>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {post.date}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t p-4">
                      <Badge
                        variant={
                          post.status === "Published"
                            ? "default"
                            : post.status === "Scheduled"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/content/social-media/${post.id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Edit
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
