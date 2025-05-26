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

export default function HowToGuidePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    topic: "",
    audience: "",
    difficulty: "",
    prerequisites: "",
    steps: "",
    tips: "",
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
      return
    }

    // Validate required fields
    if (!formData.topic || !formData.audience || !formData.difficulty || !formData.steps) {
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
          prompt: `Write a ${formData.difficulty || "beginner"}-level how-to guide about "${
            formData.topic
          }" for ${formData.audience}.${
            formData.prerequisites ? `\n\nPrerequisites or materials needed: ${formData.prerequisites}` : ""
          }\n\nInclude these steps:\n${formData.steps}${
            formData.tips ? `\n\nAdditional tips: ${formData.tips}` : ""
          }\n\nThe guide should be clear, concise, and easy to follow. Include an introduction explaining why this guide is useful, step-by-step instructions with explanations, and a conclusion summarizing the benefits.`,
          templateId: "how-to-guide",
          formData,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(t("documents.authError", language))
          router.push("/auth/signin")
          return
        }
        throw new Error("Failed to generate content")
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
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=How-To Guide`)
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
          title: `How-To Guide: ${formData.topic}`,
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
            <BookText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.how-to-guide.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.how-to-guide.description", language)}</p>
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
              <CardTitle>{t("templates.how-to-guide.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.how-to-guide.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.how-to-guide.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.how-to-guide.form.topicPlaceholder", language)}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.how-to-guide.form.audience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.how-to-guide.form.audiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">
                  {t("templates.how-to-guide.form.difficulty", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => handleInputChange("difficulty", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.how-to-guide.form.difficultyPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">
                      {t("templates.how-to-guide.form.difficulties.beginner", language)}
                    </SelectItem>
                    <SelectItem value="Intermediate">
                      {t("templates.how-to-guide.form.difficulties.intermediate", language)}
                    </SelectItem>
                    <SelectItem value="Advanced">
                      {t("templates.how-to-guide.form.difficulties.advanced", language)}
                    </SelectItem>
                    <SelectItem value="Expert">
                      {t("templates.how-to-guide.form.difficulties.expert", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prerequisites">{t("templates.how-to-guide.form.prerequisites", language)}</Label>
                <Textarea
                  id="prerequisites"
                  placeholder={t("templates.how-to-guide.form.prerequisitesPlaceholder", language)}
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange("prerequisites", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">
                  {t("templates.how-to-guide.form.steps", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="steps"
                  placeholder={t("templates.how-to-guide.form.stepsPlaceholder", language)}
                  value={formData.steps}
                  onChange={(e) => handleInputChange("steps", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tips">{t("templates.how-to-guide.form.tips", language)}</Label>
                <Textarea
                  id="tips"
                  placeholder={t("templates.how-to-guide.form.tipsPlaceholder", language)}
                  value={formData.tips}
                  onChange={(e) => handleInputChange("tips", e.target.value)}
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
              <CardDescription>{t("templates.how-to-guide.preview.description", language)}</CardDescription>
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
