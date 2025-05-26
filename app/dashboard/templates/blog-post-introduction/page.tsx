"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookText, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function BlogPostIntroductionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    topic: "",
    audience: "",
    tone: "",
    keyPoints: "",
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
    if (!formData.topic || !formData.audience) {
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
          prompt: `Write an engaging introduction for a blog post about "${formData.topic}" targeted at ${
            formData.audience
          }. The tone should be ${formData.tone || "professional"}. ${
            formData.keyPoints ? `Include these key points: ${formData.keyPoints}` : ""
          }\n\nThe introduction should be 2-3 paragraphs long, hook the reader, and clearly state what the blog post will cover.`,
          templateId: "blog-post-introduction",
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
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while generating content")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error("No content to save or user not authenticated")
      return
    }

    try {
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Blog Post Introduction`)
        if (response.ok) {
          const data = await response.json()
          templateId = data.template?.id
        }
      } catch (e) {
        console.warn("Could not fetch template ID:", e)
      }

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Blog Post: ${formData.topic}`,
          content: generatedContent,
          templateId: templateId,
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <BookText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.blog-post-introduction.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.blog-post-introduction.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="form" className="flex-1">
            {t("common.form", language)}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            {t("common.preview", language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("templates.blog-post-introduction.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.blog-post-introduction.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.blog-post-introduction.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.blog-post-introduction.form.topicPlaceholder", language)}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.blog-post-introduction.form.audience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.blog-post-introduction.form.audiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">
                  {t("templates.blog-post-introduction.form.tone", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.blog-post-introduction.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Authoritative">Authoritative</SelectItem>
                    <SelectItem value="Humorous">Humorous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyPoints">{t("templates.blog-post-introduction.form.keyPoints", language)}</Label>
                <Textarea
                  id="keyPoints"
                  placeholder={t("templates.blog-post-introduction.form.keyPointsPlaceholder", language)}
                  value={formData.keyPoints}
                  onChange={(e) => handleInputChange("keyPoints", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.generating", language)}
                  </>
                ) : (
                  t("common.generateContent", language)
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("common.generatedContent", language)}</CardTitle>
              <CardDescription>{t("templates.blog-post-introduction.preview.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t("common.generatingContent", language)}</p>
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
                  <p className="text-muted-foreground">{t("common.fillFormToGenerate", language)}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                {t("common.backToForm", language)}
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isGenerating}>
                <Save className="mr-2 h-4 w-4" />
                {t("common.saveToDocuments", language)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
