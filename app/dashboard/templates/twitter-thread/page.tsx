"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Save } from "lucide-react"
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
import { getTranslation } from "@/lib/translations"

export default function TwitterThreadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = (key: string) => getTranslation(key, language)

  const [formData, setFormData] = useState({
    topic: "",
    audience: "",
    threadLength: "",
    tone: "",
    includeStats: "",
    includeQuestions: "",
    keyPoints: "",
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
      toast.error(t("common.authError"))
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.topic || !formData.audience || !formData.keyPoints) {
      toast.error(t("common.requiredFields"))
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Twitter Thread`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error("Template not found")
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a Twitter thread about ${formData.topic} targeted at ${formData.audience}. 
          ${formData.threadLength ? `The thread should be approximately ${formData.threadLength} tweets long.` : ""}
          ${formData.tone ? `The tone should be ${formData.tone}.` : ""}
          ${formData.includeStats === "yes" ? "Include relevant statistics and data points." : ""}
          ${formData.includeQuestions === "yes" ? "Include engaging questions to encourage interaction." : ""}
          
          Key points to cover:
          ${formData.keyPoints}
          
          ${formData.callToAction ? `End with this call to action: ${formData.callToAction}` : "Include an appropriate call to action at the end."}
          
          Format the thread as a series of numbered tweets, with each tweet being concise and under 280 characters. Make sure the thread flows naturally from one tweet to the next.`,
          templateId: templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error(t("documents.authError"))
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success(t("common.contentGenerated"))
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : t("common.generationError"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error(t("common.noContentToSave"))
      return
    }

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Twitter Thread`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error("Template not found")
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Twitter Thread: ${formData.topic}`,
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
      toast.success(t("common.contentSaved"))
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : t("common.savingError"))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.twitter-thread.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.twitter-thread.description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="form" className="flex-1">
            {t("common.form")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            {t("common.preview")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("templates.twitter-thread.form.title")}</CardTitle>
              <CardDescription>{t("templates.twitter-thread.form.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">
                  {t("templates.twitter-thread.form.topic")}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="topic"
                  placeholder={t("templates.twitter-thread.form.topicPlaceholder")}
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.twitter-thread.form.audience")}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.twitter-thread.form.audiencePlaceholder")}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threadLength">{t("templates.twitter-thread.form.threadLength")}</Label>
                <Select
                  value={formData.threadLength}
                  onValueChange={(value) => handleInputChange("threadLength", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.twitter-thread.form.threadLengthPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-5">{t("templates.twitter-thread.form.threadLengths.short")}</SelectItem>
                    <SelectItem value="5-7">{t("templates.twitter-thread.form.threadLengths.medium")}</SelectItem>
                    <SelectItem value="7-10">{t("templates.twitter-thread.form.threadLengths.long")}</SelectItem>
                    <SelectItem value="10+">{t("templates.twitter-thread.form.threadLengths.extraLong")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.twitter-thread.form.tone")}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.twitter-thread.form.tonePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casual">{t("templates.twitter-thread.form.tones.casual")}</SelectItem>
                    <SelectItem value="Professional">
                      {t("templates.twitter-thread.form.tones.professional")}
                    </SelectItem>
                    <SelectItem value="Educational">{t("templates.twitter-thread.form.tones.educational")}</SelectItem>
                    <SelectItem value="Humorous">{t("templates.twitter-thread.form.tones.humorous")}</SelectItem>
                    <SelectItem value="Controversial">
                      {t("templates.twitter-thread.form.tones.controversial")}
                    </SelectItem>
                    <SelectItem value="Inspirational">
                      {t("templates.twitter-thread.form.tones.inspirational")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includeStats">{t("templates.twitter-thread.form.includeStats")}</Label>
                <Select
                  value={formData.includeStats}
                  onValueChange={(value) => handleInputChange("includeStats", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.twitter-thread.form.includeStatsPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common.yes")}</SelectItem>
                    <SelectItem value="no">{t("common.no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="includeQuestions">{t("templates.twitter-thread.form.includeQuestions")}</Label>
                <Select
                  value={formData.includeQuestions}
                  onValueChange={(value) => handleInputChange("includeQuestions", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.twitter-thread.form.includeQuestionsPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t("common.yes")}</SelectItem>
                    <SelectItem value="no">{t("common.no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyPoints">
                  {t("templates.twitter-thread.form.keyPoints")}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="keyPoints"
                  placeholder={t("templates.twitter-thread.form.keyPointsPlaceholder")}
                  value={formData.keyPoints}
                  onChange={(e) => handleInputChange("keyPoints", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.twitter-thread.form.callToAction")}</Label>
                <Input
                  id="callToAction"
                  placeholder={t("templates.twitter-thread.form.callToActionPlaceholder")}
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
                    {t("common.generating")}
                  </>
                ) : (
                  t("common.generateContent")
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("common.generatedContent")}</CardTitle>
              <CardDescription>{t("templates.twitter-thread.preview.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t("common.generatingContent")}</p>
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
                  <p className="text-muted-foreground">{t("common.fillFormToGenerate")}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                {t("common.backToForm")}
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isGenerating}>
                <Save className="mr-2 h-4 w-4" />
                {t("common.saveToDocuments")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
