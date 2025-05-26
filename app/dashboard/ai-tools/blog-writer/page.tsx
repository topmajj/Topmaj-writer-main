"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookText, Loader2, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function BlogWriterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    audience: "",
    tone: "",
    contentType: "full",
    wordCount: "1000",
    seoKeywords: "",
    includeIntroduction: "yes",
    includeConclusion: "yes",
    includeHeadings: "yes",
    includeCallToAction: "yes",
    outline: "",
    additionalInstructions: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGenerateContent = async () => {
    if (!user) {
      toast.error("You must be logged in to generate content")
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.title || !formData.topic || !formData.audience) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: constructPrompt(),
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error("Authentication error. Please sign in again.")
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success("Blog content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while generating content")
    } finally {
      setIsGenerating(false)
    }
  }

  const constructPrompt = () => {
    let prompt = `Write a ${formData.contentType === "full" ? "complete" : formData.contentType} blog post titled "${
      formData.title
    }" about ${formData.topic} targeted at ${formData.audience}.`

    // Add tone
    if (formData.tone) {
      prompt += ` The tone should be ${formData.tone}.`
    }

    // Add word count
    prompt += ` The blog post should be approximately ${formData.wordCount} words in length.`

    // Add SEO keywords
    if (formData.seoKeywords) {
      prompt += ` Optimize the content for these SEO keywords: ${formData.seoKeywords}.`
    }

    // Add structure requirements
    if (formData.includeIntroduction === "yes") {
      prompt += ` Include an engaging introduction that hooks the reader.`
    }

    if (formData.includeHeadings === "yes") {
      prompt += ` Use clear, descriptive headings and subheadings to organize the content.`
    }

    if (formData.includeConclusion === "yes") {
      prompt += ` Include a conclusion that summarizes the main points.`
    }

    if (formData.includeCallToAction === "yes") {
      prompt += ` End with a compelling call to action.`
    }

    // Add outline if provided
    if (formData.outline) {
      prompt += `\n\nFollow this outline for the blog post structure:\n${formData.outline}`
    }

    // Add additional instructions
    if (formData.additionalInstructions) {
      prompt += `\n\nAdditional instructions: ${formData.additionalInstructions}`
    }

    // Final instructions for quality
    prompt += `\n\nMake the content engaging, informative, and valuable to the reader. Use a conversational style, include examples where appropriate, and ensure the content flows naturally from one section to the next. Format the content with proper Markdown for headings, lists, and emphasis.`

    return prompt
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error("No content to save or user not authenticated")
      return
    }

    try {
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          content: generatedContent,
          contentType: "blog-post",
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      const data = await response.json()
      toast.success("Blog post saved to documents")
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while saving content")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard/ai-tools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-md bg-primary/10 p-2">
          <BookText className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Blog Writer</h1>
      </div>
      <p className="text-muted-foreground mb-6">Generate SEO-optimized blog posts with AI</p>
      <Separator className="my-6" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="form" className="flex-1">
            Form
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Blog Post Details</CardTitle>
              <CardDescription>Provide information to generate your blog post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Blog Title<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter a compelling title for your blog post"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">
                    Topic<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="topic"
                    placeholder="What is your blog post about?"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="audience">
                    Target Audience<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="audience"
                    placeholder="Who is your target audience?"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone of Voice</Label>
                  <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the tone for your blog post" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Humorous">Humorous</SelectItem>
                      <SelectItem value="Inspirational">Inspirational</SelectItem>
                      <SelectItem value="Authoritative">Authoritative</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => handleInputChange("contentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the type of content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Blog Post</SelectItem>
                      <SelectItem value="introduction">Introduction Only</SelectItem>
                      <SelectItem value="outline">Detailed Outline</SelectItem>
                      <SelectItem value="listicle">Listicle</SelectItem>
                      <SelectItem value="how-to">How-To Guide</SelectItem>
                      <SelectItem value="case-study">Case Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wordCount">Word Count</Label>
                  <Select value={formData.wordCount} onValueChange={(value) => handleInputChange("wordCount", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the approximate word count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">Short (~500 words)</SelectItem>
                      <SelectItem value="1000">Medium (~1000 words)</SelectItem>
                      <SelectItem value="1500">Long (~1500 words)</SelectItem>
                      <SelectItem value="2000">Comprehensive (~2000 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords</Label>
                <Input
                  id="seoKeywords"
                  placeholder="Enter primary and secondary keywords separated by commas"
                  value={formData.seoKeywords}
                  onChange={(e) => handleInputChange("seoKeywords", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Example: digital marketing, social media strategy, content marketing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Blog Structure</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="includeIntroduction" className="text-sm font-normal">
                        Introduction
                      </Label>
                      <RadioGroup
                        value={formData.includeIntroduction}
                        onValueChange={(value) => handleInputChange("includeIntroduction", value)}
                        className="flex"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="yes" id="intro-yes" />
                          <Label htmlFor="intro-yes" className="text-sm font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="no" id="intro-no" />
                          <Label htmlFor="intro-no" className="text-sm font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="includeConclusion" className="text-sm font-normal">
                        Conclusion
                      </Label>
                      <RadioGroup
                        value={formData.includeConclusion}
                        onValueChange={(value) => handleInputChange("includeConclusion", value)}
                        className="flex"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="yes" id="conclusion-yes" />
                          <Label htmlFor="conclusion-yes" className="text-sm font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="no" id="conclusion-no" />
                          <Label htmlFor="conclusion-no" className="text-sm font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="includeHeadings" className="text-sm font-normal">
                        Headings
                      </Label>
                      <RadioGroup
                        value={formData.includeHeadings}
                        onValueChange={(value) => handleInputChange("includeHeadings", value)}
                        className="flex"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="yes" id="headings-yes" />
                          <Label htmlFor="headings-yes" className="text-sm font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="no" id="headings-no" />
                          <Label htmlFor="headings-no" className="text-sm font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="includeCallToAction" className="text-sm font-normal">
                        Call to Action
                      </Label>
                      <RadioGroup
                        value={formData.includeCallToAction}
                        onValueChange={(value) => handleInputChange("includeCallToAction", value)}
                        className="flex"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="yes" id="cta-yes" />
                          <Label htmlFor="cta-yes" className="text-sm font-normal">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="no" id="cta-no" />
                          <Label htmlFor="cta-no" className="text-sm font-normal">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outline">Blog Outline (Optional)</Label>
                  <Textarea
                    id="outline"
                    placeholder="Provide a specific outline for your blog post (one point per line)"
                    value={formData.outline}
                    onChange={(e) => handleInputChange("outline", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions (Optional)</Label>
                <Textarea
                  id="additionalInstructions"
                  placeholder="Any specific requirements or additional information for the AI"
                  value={formData.additionalInstructions}
                  onChange={(e) => handleInputChange("additionalInstructions", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Blog Post...
                  </>
                ) : (
                  "Generate Blog Post"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{formData.title || "Generated Blog Post"}</CardTitle>
              <CardDescription>Review your generated blog content</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Generating your blog post... This may take a moment for longer content.
                  </p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {generatedContent.split("\n\n").map((paragraph, index) =>
                    paragraph.trim() ? (
                      <div
                        key={index}
                        className="mb-4"
                        dangerouslySetInnerHTML={{
                          __html: paragraph
                            .replace(/^# (.*$)/gim, "<h1>$1</h1>")
                            .replace(/^## (.*$)/gim, "<h2>$1</h2>")
                            .replace(/^### (.*$)/gim, "<h3>$1</h3>")
                            .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
                            .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
                            .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
                            .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
                            .replace(/\*(.*)\*/gim, "<em>$1</em>")
                            .replace(/\n/gim, "<br />"),
                        }}
                      />
                    ) : null,
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    Fill out the form and click "Generate Blog Post" to see the result here.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                Back to Form
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isGenerating}>
                <Save className="mr-2 h-4 w-4" />
                Save to Documents
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
