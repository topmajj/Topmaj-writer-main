"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Save, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function BrainstormingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("form")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [formData, setFormData] = useState({
    topic: "",
    contentType: "",
    audience: "",
    ideaCount: "10",
    ideaFormat: "Bullet Points",
    industry: "",
    goal: "",
    creativity: "Balanced Mix",
    existingIdeas: "",
    additionalInstructions: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateContent = async () => {
    if (!formData.topic || !formData.contentType || !formData.audience) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // Construct the prompt
      const prompt = `Generate ${formData.ideaCount} creative ideas for ${formData.contentType} about "${
        formData.topic
      }" targeted at ${formData.audience}.
      
Industry: ${formData.industry || "Not specified"}
Goal: ${formData.goal || "Not specified"}
Creativity level: ${formData.creativity}
Format: ${formData.ideaFormat}

${formData.existingIdeas ? `Some existing ideas to build upon or avoid repetition:\n${formData.existingIdeas}` : ""}
${formData.additionalInstructions ? `Additional instructions:\n${formData.additionalInstructions}` : ""}

Please provide original, well-thought-out ideas with clear descriptions. Each idea should be distinct and valuable.`

      // Call the API to generate content
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          templateId: "brainstorming",
          formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
    } catch (error) {
      console.error("Error generating content:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveContent = async () => {
    if (!generatedContent) {
      toast({
        title: "No content to save",
        description: "Please generate content first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to save content.")
      }

      // Prepare the content for saving
      const contentToSave = {
        user_id: user.id,
        template_id: "brainstorming",
        title: `Brainstorming: ${formData.topic}`,
        content: generatedContent,
        form_data: formData,
        word_count: generatedContent.split(/\s+/).filter(Boolean).length,
      }

      // Save the content
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentToSave),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save content")
      }

      toast({
        title: "Content saved",
        description: "Your brainstorming ideas have been saved successfully.",
      })

      // Redirect to documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/ai-tools">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Brainstorming Tool</h1>
        </div>
        <div className="flex items-center gap-2">
          {generatedContent && (
            <Button onClick={saveContent} disabled={isSaving} className="flex items-center gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Ideas
            </Button>
          )}
        </div>
      </div>

      <p className="text-muted-foreground">
        Generate creative ideas for your content and projects. This tool helps you brainstorm concepts, topics, and
        approaches based on your specific needs.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="preview" disabled={isGenerating && !generatedContent}>
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <form
                className="grid gap-6 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  generateContent()
                }}
              >
                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="topic">
                    Topic <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="What are you brainstorming ideas for?"
                    value={formData.topic}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="contentType">
                    Content Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    name="contentType"
                    value={formData.contentType}
                    onValueChange={(value) => handleSelectChange("contentType", value)}
                    required
                  >
                    <SelectTrigger id="contentType">
                      <SelectValue placeholder="What type of content are you creating?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Blog Post">Blog Post</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                        <SelectItem value="Marketing Campaign">Marketing Campaign</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Business Name">Business Name</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Podcast">Podcast</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="audience">
                    Target Audience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="audience"
                    name="audience"
                    placeholder="Who is your target audience?"
                    value={formData.audience}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="ideaCount">Number of Ideas</Label>
                  <Select
                    name="ideaCount"
                    value={formData.ideaCount}
                    onValueChange={(value) => handleSelectChange("ideaCount", value)}
                  >
                    <SelectTrigger id="ideaCount">
                      <SelectValue placeholder="How many ideas do you want?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="5">5 ideas</SelectItem>
                        <SelectItem value="10">10 ideas</SelectItem>
                        <SelectItem value="15">15 ideas</SelectItem>
                        <SelectItem value="20">20 ideas</SelectItem>
                        <SelectItem value="25">25 ideas</SelectItem>
                        <SelectItem value="30">30 ideas</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="ideaFormat">Idea Format</Label>
                  <Select
                    name="ideaFormat"
                    value={formData.ideaFormat}
                    onValueChange={(value) => handleSelectChange("ideaFormat", value)}
                  >
                    <SelectTrigger id="ideaFormat">
                      <SelectValue placeholder="How should the ideas be formatted?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="List">Simple List</SelectItem>
                        <SelectItem value="Bullet Points">Bullet Points</SelectItem>
                        <SelectItem value="Numbered List">Numbered List</SelectItem>
                        <SelectItem value="Detailed Descriptions">Detailed Descriptions</SelectItem>
                        <SelectItem value="Title and Description">Title and Description</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="creativity">Creativity Level</Label>
                  <Select
                    name="creativity"
                    value={formData.creativity}
                    onValueChange={(value) => handleSelectChange("creativity", value)}
                  >
                    <SelectTrigger id="creativity">
                      <SelectValue placeholder="How creative should the ideas be?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Conventional">Conventional</SelectItem>
                        <SelectItem value="Moderately Creative">Moderately Creative</SelectItem>
                        <SelectItem value="Very Creative">Very Creative</SelectItem>
                        <SelectItem value="Wild and Unconventional">Wild and Unconventional</SelectItem>
                        <SelectItem value="Balanced Mix">Balanced Mix</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="What industry are you in?"
                    value={formData.industry}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label htmlFor="goal">Goal</Label>
                  <Input
                    id="goal"
                    name="goal"
                    placeholder="What is your goal with these ideas?"
                    value={formData.goal}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="existingIdeas">Existing Ideas</Label>
                  <Textarea
                    id="existingIdeas"
                    name="existingIdeas"
                    placeholder="List any existing ideas you have (one per line)"
                    value={formData.existingIdeas}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                  <Textarea
                    id="additionalInstructions"
                    name="additionalInstructions"
                    placeholder="Any specific instructions for the ideas"
                    value={formData.additionalInstructions}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="col-span-2 w-full flex items-center gap-2" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Ideas
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating creative ideas...</p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
                  <h2 className="text-xl font-bold mb-4">Brainstorming Ideas: {formData.topic}</h2>
                  <div className="whitespace-pre-line">{generatedContent}</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No ideas generated yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Fill out the form and click "Generate Ideas" to create brainstorming ideas.
                  </p>
                  <Button onClick={() => setActiveTab("form")}>Go to Form</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
