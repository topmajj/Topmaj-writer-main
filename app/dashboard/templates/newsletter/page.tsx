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
import { t } from "@/lib/translations"

export default function NewsletterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    brandName: "",
    subject: "",
    mainTopic: "",
    secondaryTopics: "",
    audience: "",
    tone: "",
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
      toast.error(t("auth.mustBeLoggedIn", language))
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.brandName || !formData.subject || !formData.mainTopic || !formData.audience) {
      toast.error(t("form.fillRequiredFields", language))
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Newsletter`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error(t("templates.notFound", language))
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a newsletter email for ${formData.brandName} with the subject "${formData.subject}". The main topic is ${
            formData.mainTopic
          } and it's targeted at ${formData.audience}. ${formData.tone ? `The tone should be ${formData.tone}.` : ""}

${formData.secondaryTopics ? `Also include these secondary topics: ${formData.secondaryTopics}` : ""}

${
  formData.callToAction
    ? `End with this call to action: ${formData.callToAction}`
    : "Include an appropriate call to action at the end."
}

The newsletter should be well-structured with a clear introduction, body sections covering the main and secondary topics, and a conclusion with a call to action. Use a format that's easy to read with short paragraphs, bullet points where appropriate, and clear section headings.`,
          templateId: templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error(t("auth.authError", language))
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || t("error.failedToGenerate", language))
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success(t("content.generatedSuccess", language))
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : t("error.occurred", language))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error(t("content.noContentOrUser", language))
      return
    }

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Newsletter`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error(t("templates.notFound", language))
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Newsletter: ${formData.subject}`,
          content: generatedContent,
          templateId: templateId,
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("error.failedToSave", language))
      }

      const data = await response.json()
      toast.success(t("content.savedToDocuments", language))
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : t("error.occurred", language))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.newsletter.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.newsletter.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="form" className="flex-1">
            {t("form.title", language)}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            {t("preview.title", language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("templates.newsletter.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.newsletter.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">
                  {t("templates.newsletter.form.newsletterName", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="brandName"
                  placeholder={t("templates.newsletter.form.newsletterNamePlaceholder", language)}
                  value={formData.brandName}
                  onChange={(e) => handleInputChange("brandName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {t("templates.newsletter.form.topic", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder={t("templates.newsletter.form.topicPlaceholder", language)}
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainTopic">
                  {t("templates.newsletter.form.keyPoints", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="mainTopic"
                  placeholder={t("templates.newsletter.form.keyPointsPlaceholder", language)}
                  value={formData.mainTopic}
                  onChange={(e) => handleInputChange("mainTopic", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryTopics">{t("templates.newsletter.form.additionalInfo", language)}</Label>
                <Textarea
                  id="secondaryTopics"
                  placeholder={t("templates.newsletter.form.additionalInfoPlaceholder", language)}
                  value={formData.secondaryTopics}
                  onChange={(e) => handleInputChange("secondaryTopics", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.newsletter.form.audience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.newsletter.form.audiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.newsletter.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.newsletter.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Informative">{t("tones.informative", language)}</SelectItem>
                    <SelectItem value="Conversational">{t("tones.conversational", language)}</SelectItem>
                    <SelectItem value="Professional">{t("tones.professional", language)}</SelectItem>
                    <SelectItem value="Friendly">{t("tones.friendly", language)}</SelectItem>
                    <SelectItem value="Enthusiastic">{t("tones.enthusiastic", language)}</SelectItem>
                    <SelectItem value="Authoritative">{t("tones.authoritative", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.newsletter.form.callToAction", language)}</Label>
                <Input
                  id="callToAction"
                  placeholder={t("templates.newsletter.form.callToActionPlaceholder", language)}
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
                    {t("actions.generating", language)}
                  </>
                ) : (
                  t("actions.generateContent", language)
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("preview.generatedContent", language)}</CardTitle>
              <CardDescription>{t("templates.newsletter.preview.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t("preview.generating", language)}</p>
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
                  <p className="text-muted-foreground">{t("preview.fillFormToSeeResult", language)}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                {t("actions.backToForm", language)}
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isGenerating}>
                <Save className="mr-2 h-4 w-4" />
                {t("actions.saveToDocuments", language)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
