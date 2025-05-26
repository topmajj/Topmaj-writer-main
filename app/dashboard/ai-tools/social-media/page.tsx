"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Loader2, Save, ArrowLeft } from "lucide-react"
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

export default function SocialMediaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    platform: "",
    topic: "",
    audience: "",
    tone: "",
    contentType: "",
    includeEmojis: "yes",
    includeHashtags: "yes",
    hashtagCount: "4-6",
    goal: "",
    keyPoints: "",
    callToAction: "",
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
    if (
      !formData.platform ||
      !formData.topic ||
      !formData.audience ||
      !formData.tone ||
      !formData.contentType ||
      !formData.goal
    ) {
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
      toast.success("Social media content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while generating content")
    } finally {
      setIsGenerating(false)
    }
  }

  const constructPrompt = () => {
    let prompt = `Create a ${formData.contentType} for ${formData.platform} about ${formData.topic} targeted at ${formData.audience}.`

    // Add tone
    if (formData.tone) {
      prompt += ` The tone should be ${formData.tone}.`
    }

    // Add goal
    if (formData.goal) {
      prompt += ` The goal of this content is to ${formData.goal}.`
    }

    // Add emojis preference
    if (formData.includeEmojis === "yes") {
      prompt += ` Include appropriate emojis throughout the content.`
    }

    // Add hashtags preference
    if (formData.includeHashtags === "yes") {
      prompt += ` Include ${formData.hashtagCount} relevant hashtags at the end.`
    }

    // Add key points if provided
    if (formData.keyPoints) {
      prompt += `\n\nInclude these key points:\n${formData.keyPoints}`
    }

    // Add call to action if provided
    if (formData.callToAction) {
      prompt += `\n\nEnd with this call to action: ${formData.callToAction}`
    }

    // Add additional instructions
    if (formData.additionalInstructions) {
      prompt += `\n\nAdditional instructions: ${formData.additionalInstructions}`
    }

    // Final instructions for quality
    prompt += `\n\nMake the content engaging, concise, and optimized for ${formData.platform}. Ensure it follows platform best practices and character limits.`

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
          title: `${formData.platform} ${formData.contentType}: ${formData.topic}`,
          content: generatedContent,
          contentType: "social-media",
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      const data = await response.json()
      toast.success("Social media content saved to documents")
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
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Social Media Generator</h1>
      </div>
      <p className="text-muted-foreground mb-6">Create engaging content for your social media platforms</p>
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
              <CardTitle>Social Media Content Details</CardTitle>
              <CardDescription>Provide information to generate your social media content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform">
                    Platform<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select value={formData.platform} onValueChange={(value) => handleInputChange("platform", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="TikTok">TikTok</SelectItem>
                      <SelectItem value="Pinterest">Pinterest</SelectItem>
                      <SelectItem value="YouTube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentType">
                    Content Type<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => handleInputChange("contentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Post">Post</SelectItem>
                      <SelectItem value="Caption">Caption</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Poll">Poll</SelectItem>
                      <SelectItem value="Question">Question</SelectItem>
                      <SelectItem value="Announcement">Announcement</SelectItem>
                      <SelectItem value="Promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">
                    Topic<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="topic"
                    placeholder="What is your post about?"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tone">
                    Tone<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Humorous">Humorous</SelectItem>
                      <SelectItem value="Inspirational">Inspirational</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Promotional">Promotional</SelectItem>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">
                    Content Goal<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select value={formData.goal} onValueChange={(value) => handleInputChange("goal", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Increase engagement">Increase engagement</SelectItem>
                      <SelectItem value="Drive traffic">Drive traffic</SelectItem>
                      <SelectItem value="Generate leads">Generate leads</SelectItem>
                      <SelectItem value="Build brand awareness">Build brand awareness</SelectItem>
                      <SelectItem value="Promote product/service">Promote product/service</SelectItem>
                      <SelectItem value="Share information">Share information</SelectItem>
                      <SelectItem value="Start a conversation">Start a conversation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="includeEmojis">Include Emojis</Label>
                  <Select
                    value={formData.includeEmojis}
                    onValueChange={(value) => handleInputChange("includeEmojis", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="includeHashtags">Include Hashtags</Label>
                  <Select
                    value={formData.includeHashtags}
                    onValueChange={(value) => handleInputChange("includeHashtags", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.includeHashtags === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="hashtagCount">Number of Hashtags</Label>
                    <Select
                      value={formData.hashtagCount}
                      onValueChange={(value) => handleInputChange("hashtagCount", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-3">1-3</SelectItem>
                        <SelectItem value="4-6">4-6</SelectItem>
                        <SelectItem value="7-10">7-10</SelectItem>
                        <SelectItem value="10+">10+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyPoints">Key Points</Label>
                <Textarea
                  id="keyPoints"
                  placeholder="List the key points to cover (one per line)"
                  value={formData.keyPoints}
                  onChange={(e) => handleInputChange("keyPoints", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callToAction">Call to Action</Label>
                <Input
                  id="callToAction"
                  placeholder="What action do you want readers to take?"
                  value={formData.callToAction}
                  onChange={(e) => handleInputChange("callToAction", e.target.value)}
                />
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
                    Generating Content...
                  </>
                ) : (
                  "Generate Content"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {formData.platform ? `${formData.platform} ${formData.contentType}` : "Generated Content"}
              </CardTitle>
              <CardDescription>Review your generated social media content</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Generating your social media content... This will only take a moment.
                  </p>
                </div>
              ) : generatedContent ? (
                <div className="p-4 border rounded-lg bg-muted/30 whitespace-pre-wrap">{generatedContent}</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    Fill out the form and click "Generate Content" to see the result here.
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
