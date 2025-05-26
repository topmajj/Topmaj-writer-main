"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function InstagramCaptionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    imageDescription: "",
    topic: "",
    tone: "",
    includeEmojis: "yes",
    hashtags: "",
    callToAction: "",
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
    if (!formData.imageDescription || !formData.topic) {
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
          prompt: `Create an engaging Instagram caption for an image of ${formData.imageDescription}. The caption should be about ${
            formData.topic
          } with a ${formData.tone || "casual"} tone. ${
            formData.includeEmojis === "yes"
              ? "Include relevant emojis throughout the caption."
              : "Do not include emojis."
          } ${formData.hashtags ? `Include these hashtags at the end: ${formData.hashtags}` : ""} ${
            formData.callToAction ? `End with this call to action: ${formData.callToAction}` : ""
          }

The caption should be engaging, relevant to the image, and encourage engagement. Keep it between 150-220 characters for optimal engagement, not including hashtags.`,
          templateId: "instagram-caption",
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
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Instagram Caption: ${formData.topic}`,
          content: generatedContent,
          templateId: "instagram-caption",
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
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.instagram-caption.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.instagram-caption.description", language)}</p>
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
              <CardTitle>{t("templates.instagram-caption.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.instagram-caption.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="imageDescription">
                  {t("templates.instagram-caption.form.imageDescription", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="imageDescription"
                  placeholder={t("templates.instagram-caption.form.imageDescriptionPlaceholder", language)}
                  value={formData.imageDescription}
                  onChange={(e) => handleInputChange("imageDescription", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.instagram-caption.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.instagram-caption.form.topicPlaceholder", language)}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.instagram-caption.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.instagram-caption.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Inspirational">Inspirational</SelectItem>
                    <SelectItem value="Humorous">Humorous</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Mysterious">Mysterious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includeEmojis">{t("templates.instagram-caption.form.includeEmojis", language)}</Label>
                <Select
                  value={formData.includeEmojis}
                  onValueChange={(value) => handleInputChange("includeEmojis", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("templates.instagram-caption.form.includeEmojisPlaceholder", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("templates.instagram-caption.form.yes", language)}</SelectItem>
                    <SelectItem value="no">{t("templates.instagram-caption.form.no", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashtags">{t("templates.instagram-caption.form.hashtags", language)}</Label>
                <Input
                  id="hashtags"
                  placeholder={t("templates.instagram-caption.form.hashtagsPlaceholder", language)}
                  value={formData.hashtags}
                  onChange={(e) => handleInputChange("hashtags", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.instagram-caption.form.callToAction", language)}</Label>
                <Input
                  id="callToAction"
                  placeholder={t("templates.instagram-caption.form.callToActionPlaceholder", language)}
                  value={formData.callToAction}
                  onChange={(e) => handleInputChange("callToAction", e.target.value)}
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
              <CardDescription>{t("templates.instagram-caption.preview.description", language)}</CardDescription>
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
