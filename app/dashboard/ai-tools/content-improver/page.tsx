"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContentImproverPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("form")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [formData, setFormData] = useState({
    originalContent: "",
    contentType: "",
    audience: "",
    tone: "",
    improvementGoal: "",
    keywords: "",
    lengthPreference: "",
    additionalInstructions: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateContent = async () => {
    // Validate required fields
    if (
      !formData.originalContent ||
      !formData.contentType ||
      !formData.audience ||
      !formData.tone ||
      !formData.improvementGoal
    ) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before generating content.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // Construct the prompt
      const prompt = `
        I need you to improve the following content:
        
        ORIGINAL CONTENT:
        ${formData.originalContent}
        
        CONTENT TYPE: ${formData.contentType}
        TARGET AUDIENCE: ${formData.audience}
        DESIRED TONE: ${formData.tone}
        IMPROVEMENT GOAL: ${formData.improvementGoal}
        ${formData.keywords ? `SEO KEYWORDS: ${formData.keywords}` : ""}
        ${formData.lengthPreference ? `LENGTH PREFERENCE: ${formData.lengthPreference}` : ""}
        ${formData.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${formData.additionalInstructions}` : ""}
        
        Please improve this content by enhancing its quality, readability, and effectiveness. 
        Focus on the specified improvement goal while maintaining the core message.
        ${formData.improvementGoal === "SEO Optimization" ? "Make sure to naturally incorporate the provided keywords." : ""}
        ${formData.lengthPreference === "Make More Concise" ? "Make the content more concise without losing important information." : ""}
        ${formData.lengthPreference === "Expand with More Detail" ? "Expand the content with more details and examples." : ""}
      `

      // Call the API to generate content
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          templateId: "content-improver",
          formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)

      toast({
        title: "Content improved successfully",
        description: "Your content has been improved. You can now save it or make further edits.",
      })
    } catch (error) {
      console.error("Error generating content:", error)
      toast({
        title: "Error improving content",
        description: "There was an error improving your content. Please try again.",
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
        description: "Please generate content before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const contentToSave = {
        title: `Improved ${formData.contentType}`,
        content: generatedContent,
        template_id: "content-improver",
        form_data: formData,
      }

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentToSave),
      })

      if (!response.ok) {
        throw new Error("Failed to save content")
      }

      toast({
        title: "Content saved successfully",
        description: "Your improved content has been saved to your documents.",
      })

      // Redirect to documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast({
        title: "Error saving content",
        description: "There was an error saving your content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/ai-tools")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Content Improver</h1>
        </div>
        {generatedContent && (
          <Button onClick={saveContent} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save to Documents"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="mt-4">
          <Card className="p-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="originalContent" className="required">
                  Original Content
                </Label>
                <Textarea
                  id="originalContent"
                  name="originalContent"
                  placeholder="Paste your content here to improve"
                  className="min-h-[200px]"
                  value={formData.originalContent}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="contentType" className="required">
                    Content Type
                  </Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => handleSelectChange("contentType", value)}
                  >
                    <SelectTrigger id="contentType">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Blog Post">Blog Post</SelectItem>
                      <SelectItem value="Social Media Post">Social Media Post</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Website Copy">Website Copy</SelectItem>
                      <SelectItem value="Product Description">Product Description</SelectItem>
                      <SelectItem value="Advertisement">Advertisement</SelectItem>
                      <SelectItem value="Academic Writing">Academic Writing</SelectItem>
                      <SelectItem value="Business Document">Business Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="audience" className="required">
                    Target Audience
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="tone" className="required">
                    Desired Tone
                  </Label>
                  <Select value={formData.tone} onValueChange={(value) => handleSelectChange("tone", value)}>
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Persuasive">Persuasive</SelectItem>
                      <SelectItem value="Humorous">Humorous</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Inspirational">Inspirational</SelectItem>
                      <SelectItem value="Authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="improvementGoal" className="required">
                    Improvement Goal
                  </Label>
                  <Select
                    value={formData.improvementGoal}
                    onValueChange={(value) => handleSelectChange("improvementGoal", value)}
                  >
                    <SelectTrigger id="improvementGoal">
                      <SelectValue placeholder="Select improvement goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clarity and Readability">Clarity and Readability</SelectItem>
                      <SelectItem value="Engagement and Interest">Engagement and Interest</SelectItem>
                      <SelectItem value="SEO Optimization">SEO Optimization</SelectItem>
                      <SelectItem value="Grammar and Style">Grammar and Style</SelectItem>
                      <SelectItem value="Persuasiveness">Persuasiveness</SelectItem>
                      <SelectItem value="Conciseness">Conciseness</SelectItem>
                      <SelectItem value="Comprehensive Coverage">Comprehensive Coverage</SelectItem>
                      <SelectItem value="All of the Above">All of the Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="keywords">SEO Keywords (optional)</Label>
                  <Input
                    id="keywords"
                    name="keywords"
                    placeholder="Enter SEO keywords to include (comma separated)"
                    value={formData.keywords}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="lengthPreference">Length Preference (optional)</Label>
                  <Select
                    value={formData.lengthPreference}
                    onValueChange={(value) => handleSelectChange("lengthPreference", value)}
                  >
                    <SelectTrigger id="lengthPreference">
                      <SelectValue placeholder="Select length preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Keep Similar Length">Keep Similar Length</SelectItem>
                      <SelectItem value="Make More Concise">Make More Concise</SelectItem>
                      <SelectItem value="Expand with More Detail">Expand with More Detail</SelectItem>
                      <SelectItem value="Significantly Shorter">Significantly Shorter</SelectItem>
                      <SelectItem value="Significantly Longer">Significantly Longer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="additionalInstructions">Additional Instructions (optional)</Label>
                <Textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any specific instructions for improvement"
                  value={formData.additionalInstructions}
                  onChange={handleInputChange}
                />
              </div>

              <Button onClick={generateContent} disabled={isGenerating} className="w-full">
                {isGenerating ? "Improving Content..." : "Improve Content"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card className="p-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Improving your content...</p>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                <h2 className="text-2xl font-bold mb-4">Improved {formData.contentType}</h2>
                <div className="whitespace-pre-wrap">{generatedContent}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="text-muted-foreground">
                  Fill out the form and click "Improve Content" to see the improved version here.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
