"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookText, FileText, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import type { Template, TemplateField } from "@/lib/openai-service"
import { getTemplateById } from "@/lib/openai-service"

export default function TemplatePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [template, setTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")

  useEffect(() => {
    async function fetchTemplate() {
      if (!params.id) return

      try {
        const templateData = await getTemplateById(params.id as string)
        if (templateData) {
          setTemplate(templateData)
          // Initialize form data with empty values
          const initialFormData: Record<string, any> = {}
          templateData.fields?.forEach((field) => {
            initialFormData[field.name] = ""
          })
          setFormData(initialFormData)
        } else {
          toast.error("Template not found")
          router.push("/dashboard/templates")
        }
      } catch (error) {
        console.error("Error fetching template:", error)
        toast.error("Failed to load template")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [params.id, router])

  const handleInputChange = (field: TemplateField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field.name]: value,
    }))
  }

  const handleGenerateContent = async () => {
    if (!template || !user) {
      toast.error("You must be logged in to generate content")
      return
    }

    // Validate required fields
    const missingFields = template.fields
      ?.filter((field) => field.required && !formData[field.name])
      .map((field) => field.label)

    if (missingFields && missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(", ")}`)
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
          prompt: constructPrompt(template, formData),
          templateId: template.id,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error("Authentication error. Please sign in again.")
          // Optionally redirect to login
          // router.push("/auth/signin");
          return
        }
        throw new Error(errorData.error || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while generating content")
    } finally {
      setIsGenerating(false)
    }
  }

  // Add this helper function to construct prompts
  function constructPrompt(template: Template, formData: Record<string, any>): string {
    let prompt = `Generate a ${template.title}.\n\n`

    // Add context from form data
    if (template.fields) {
      template.fields.forEach((field) => {
        if (formData[field.name]) {
          prompt += `${field.label}: ${formData[field.name]}\n`
        }
      })
    }

    // Add specific instructions based on template type
    switch (template.title) {
      case "Blog Post Introduction":
        prompt += `\nWrite an engaging introduction for a blog post about "${formData.topic}" targeted at ${
          formData.audience
        }. The tone should be ${formData.tone || "professional"}. ${
          formData.keyPoints ? `Include these key points: ${formData.keyPoints}` : ""
        }\n\nThe introduction should be 2-3 paragraphs long, hook the reader, and clearly state what the blog post will cover.`
        break

      case "SEO Blog Post":
        prompt += `\nWrite an SEO-optimized blog post about "${formData.topic}" targeted at ${
          formData.audience
        }. The primary keyword is "${formData.keyword}"${
          formData.secondaryKeywords ? ` and secondary keywords include ${formData.secondaryKeywords}` : ""
        }. The blog post should be approximately ${formData.wordCount || "1000-1500 words"} in length.${
          formData.outline ? `\n\nFollow this outline: ${formData.outline}` : ""
        }\n\nInclude a compelling introduction, well-structured body with subheadings, and a conclusion with a call to action. Naturally incorporate the keywords throughout the text.`
        break

      case "Case Study":
        prompt += `\nWrite a detailed case study about ${formData.clientName} in the ${formData.industry} industry.\n\nChallenge: ${formData.challenge}\n\nSolution: ${formData.solution}\n\nResults: ${formData.results}${
          formData.testimonial ? `\n\nClient Testimonial: ${formData.testimonial}` : ""
        }\n\nThe case study should follow a narrative structure, clearly explaining the problem, your approach to solving it, and the measurable outcomes achieved. Include specific details and metrics where possible.`
        break

      case "How-To Guide":
        prompt += `\nWrite a ${formData.difficulty || "beginner"}-level how-to guide about "${
          formData.topic
        }" for ${formData.audience}.${
          formData.prerequisites ? `\n\nPrerequisites or materials needed: ${formData.prerequisites}` : ""
        }\n\nInclude these steps:\n${formData.steps}${
          formData.tips ? `\n\nAdditional tips: ${formData.tips}` : ""
        }\n\nThe guide should be clear, concise, and easy to follow. Include an introduction explaining why this guide is useful, step-by-step instructions with explanations, and a conclusion summarizing the benefits.`
        break

      default:
        prompt += `\nPlease provide detailed and high-quality content based on the information above.`
    }

    return prompt
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !template || !user) {
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
          title: formData.title || template.title,
          content: generatedContent,
          templateId: template.id || null,
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error saving content:", errorData)
        throw new Error(errorData.error || "Failed to save content")
      }

      const data = await response.json()
      toast.success("Content saved to documents")
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while saving content")
    }
  }

  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
          />
        )
      case "textarea":
        return (
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
            className="min-h-[100px]"
          />
        )
      case "select":
        return (
          <Select
            value={formData[field.name] || ""}
            onValueChange={(value) => handleInputChange(field, value)}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            id={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Template not found</h2>
        <p className="text-muted-foreground mt-2">The template you're looking for doesn't exist.</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/templates")}>
          Back to Templates
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            {template.icon === "BookText" ? (
              <BookText className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{template.title}</h1>
        </div>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

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
              <CardTitle>Fill in the details</CardTitle>
              <CardDescription>Provide information to generate your {template.title.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {template.fields?.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                  {field.placeholder && <p className="text-xs text-muted-foreground">{field.placeholder}</p>}
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
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
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>Review your generated {template.title.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating your content... This may take a moment.</p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {generatedContent.split("\n\n").map((paragraph, index) =>
                    paragraph.trim() ? (
                      <p key={index} className="mb-4 text-base leading-relaxed">
                        {paragraph}
                      </p>
                    ) : null,
                  )}
                </div>
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
