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

export default function LinkedInPostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    topic: "",
    industry: "",
    purpose: "",
    tone: "",
    includePersonalStory: "no",
    includeStatistics: "no",
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
      toast.error(t("common.authError", language))
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.topic || !formData.industry || !formData.purpose) {
      toast.error(t("common.requiredFields", language))
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
          prompt: `Create a professional LinkedIn post about ${formData.topic} for someone in the ${
            formData.industry
          } industry. The purpose of this post is to ${formData.purpose}. The tone should be ${
            formData.tone || "professional"
          }. ${
            formData.includePersonalStory === "yes"
              ? "Include a brief personal story or anecdote related to the topic."
              : ""
          } ${
            formData.includeStatistics === "yes"
              ? "Include relevant statistics or data points to support the message."
              : ""
          } ${formData.callToAction ? `End with this call to action: ${formData.callToAction}` : ""}

The post should be well-structured with short paragraphs for readability. Use line breaks effectively. Keep the post between 1200-1500 characters for optimal engagement. Format it in a way that's engaging and professional for a LinkedIn audience.`,
          templateId: "linkedin-post",
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error(t("documents.authError", language))
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || t("common.generationError", language))
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success(t("common.contentGenerated", language))
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : t("common.generationError", language))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error(t("common.noContentToSave", language))
      return
    }

    try {
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `LinkedIn Post: ${formData.topic}`,
          content: generatedContent,
          templateId: "linkedin-post",
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("common.savingError", language))
      }

      const data = await response.json()
      toast.success(t("common.contentSaved", language))
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : t("common.savingError", language))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.linkedin-post.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.linkedin-post.description", language)}</p>
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
              <CardTitle>{t("templates.linkedin-post.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.linkedin-post.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.linkedin-post.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.linkedin-post.form.topicPlaceholder", language)}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t("templates.linkedin-post.form.industry", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder={t("templates.linkedin-post.form.industryPlaceholder", language)}
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">
                  {t("templates.linkedin-post.form.purpose", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => handleInputChange("purpose", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.linkedin-post.form.purposePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="share industry insights">
                      {t("templates.linkedin-post.form.purposes.shareInsights", language)}
                    </SelectItem>
                    <SelectItem value="showcase expertise">
                      {t("templates.linkedin-post.form.purposes.showcaseExpertise", language)}
                    </SelectItem>
                    <SelectItem value="announce a company update">
                      {t("templates.linkedin-post.form.purposes.announceUpdate", language)}
                    </SelectItem>
                    <SelectItem value="share a professional achievement">
                      {t("templates.linkedin-post.form.purposes.shareAchievement", language)}
                    </SelectItem>
                    <SelectItem value="start a discussion">
                      {t("templates.linkedin-post.form.purposes.startDiscussion", language)}
                    </SelectItem>
                    <SelectItem value="promote a product or service">
                      {t("templates.linkedin-post.form.purposes.promoteProduct", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.linkedin-post.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.linkedin-post.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">
                      {t("templates.linkedin-post.form.tones.professional", language)}
                    </SelectItem>
                    <SelectItem value="Conversational">
                      {t("templates.linkedin-post.form.tones.conversational", language)}
                    </SelectItem>
                    <SelectItem value="Authoritative">
                      {t("templates.linkedin-post.form.tones.authoritative", language)}
                    </SelectItem>
                    <SelectItem value="Inspirational">
                      {t("templates.linkedin-post.form.tones.inspirational", language)}
                    </SelectItem>
                    <SelectItem value="Educational">
                      {t("templates.linkedin-post.form.tones.educational", language)}
                    </SelectItem>
                    <SelectItem value="Thoughtful">
                      {t("templates.linkedin-post.form.tones.thoughtful", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includePersonalStory">
                  {t("templates.linkedin-post.form.includePersonalStory", language)}
                </Label>
                <Select
                  value={formData.includePersonalStory}
                  onValueChange={(value) => handleInputChange("includePersonalStory", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("templates.linkedin-post.form.includePersonalStoryPlaceholder", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common.yes", language)}</SelectItem>
                    <SelectItem value="no">{t("common.no", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includeStatistics">
                  {t("templates.linkedin-post.form.includeStatistics", language)}
                </Label>
                <Select
                  value={formData.includeStatistics}
                  onValueChange={(value) => handleInputChange("includeStatistics", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("templates.linkedin-post.form.includeStatisticsPlaceholder", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common.yes", language)}</SelectItem>
                    <SelectItem value="no">{t("common.no", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.linkedin-post.form.callToAction", language)}</Label>
                <Input
                  id="callToAction"
                  placeholder={t("templates.linkedin-post.form.callToActionPlaceholder", language)}
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
              <CardDescription>{t("templates.linkedin-post.preview.description", language)}</CardDescription>
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
