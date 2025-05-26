"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookText, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

export default function SEOBlogPostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    keyword: "",
    secondaryKeywords: "",
    topic: "",
    audience: "",
    wordCount: "",
    outline: "",
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
      return
    }

    // Validate required fields
    if (!formData.keyword || !formData.topic || !formData.audience || !formData.wordCount) {
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
          prompt: `Write an SEO-optimized blog post about "${formData.topic}" targeted at ${
            formData.audience
          }. The primary keyword is "${formData.keyword}"${
            formData.secondaryKeywords ? ` and secondary keywords include ${formData.secondaryKeywords}` : ""
          }. The blog post should be approximately ${formData.wordCount} in length.${
            formData.outline ? `\n\nFollow this outline: ${formData.outline}` : ""
          }\n\nInclude a compelling introduction, well-structured body with subheadings, and a conclusion with a call to action. Naturally incorporate the keywords throughout the text.`,
          templateId: "seo-blog-post",
          formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("An error occurred while generating content")
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
        const response = await fetch(`/api/templates/get-by-title?title=SEO Blog Post`)
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
          title: `SEO Blog: ${formData.topic}`,
          content: generatedContent,
          templateId: templateId,
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
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
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.seo-blog-post.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.seo-blog-post.description", language)}</p>
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
              <CardTitle>{t("templates.seo-blog-post.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.seo-blog-post.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="keyword">
                  {t("templates.seo-blog-post.form.primaryKeyword", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="keyword"
                  placeholder={t("templates.seo-blog-post.form.primaryKeywordPlaceholder", language)}
                  value={formData.keyword}
                  onChange={(e) => handleInputChange("keyword", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryKeywords">
                  {t("templates.seo-blog-post.form.secondaryKeywords", language)}
                </Label>
                <Input
                  id="secondaryKeywords"
                  placeholder={t("templates.seo-blog-post.form.secondaryKeywordsPlaceholder", language)}
                  value={formData.secondaryKeywords}
                  onChange={(e) => handleInputChange("secondaryKeywords", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.seo-blog-post.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.seo-blog-post.form.topicPlaceholder", language)}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.seo-blog-post.form.audience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.seo-blog-post.form.audiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordCount">
                  {t("templates.seo-blog-post.form.wordCount", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.wordCount}
                  onValueChange={(value) => handleInputChange("wordCount", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.seo-blog-post.form.wordCountPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500-750 words">500-750 words</SelectItem>
                    <SelectItem value="750-1000 words">750-1000 words</SelectItem>
                    <SelectItem value="1000-1500 words">1000-1500 words</SelectItem>
                    <SelectItem value="1500-2000 words">1500-2000 words</SelectItem>
                    <SelectItem value="2000+ words">2000+ words</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outline">{t("templates.seo-blog-post.form.outline", language)}</Label>
                <Textarea
                  id="outline"
                  placeholder={t("templates.seo-blog-post.form.outlinePlaceholder", language)}
                  value={formData.outline}
                  onChange={(e) => handleInputChange("outline", e.target.value)}
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
              <CardDescription>{t("templates.seo-blog-post.preview.description", language)}</CardDescription>
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
