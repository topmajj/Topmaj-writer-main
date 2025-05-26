"use client"

import { Languages, ArrowRightLeft } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function TranslationPage() {
  const { language } = useLanguage()
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sample language options
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ]

  const handleTranslation = async () => {
    if (!inputText.trim()) return

    setIsTranslating(true)
    setOutputText("")

    try {
      // Call OpenAI API for translation with a more specific prompt
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Translate the following text from ${languages.find((l) => l.code === sourceLanguage)?.name} to ${
            languages.find((l) => l.code === targetLanguage)?.name
          }. Return ONLY the translated text without any explanations, introductions, or additional text:\n\n${inputText}`,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const data = await response.json()

      // Clean up the response to remove any explanatory text
      let translatedText = data.content || ""

      // Remove common prefixes that the AI might add
      translatedText = translatedText
        .replace(/^(here is|here's|the translation is|translation:|translated text:|in [a-z]+:)/i, "")
        .replace(/^(sure!|certainly!|of course!)/i, "")
        .replace(/^the translation of .* into [a-z]+ is:/i, "")
        .replace(/^translated from [a-z]+ to [a-z]+:/i, "")
        .trim()

      setOutputText(translatedText)
    } catch (error) {
      console.error("Translation error:", error)
      toast.error(t("translationTool.errors.translationFailed", language))
      setOutputText("")
    } finally {
      setIsTranslating(false)
    }
  }

  const saveTranslation = async () => {
    if (!outputText.trim()) {
      toast.error(t("translationTool.errors.noTranslation", language))
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Translation: ${
            languages.find((l) => l.code === sourceLanguage)?.name
          } to ${languages.find((l) => l.code === targetLanguage)?.name}`,
          content: `Original (${languages.find((l) => l.code === sourceLanguage)?.name}):\n${inputText}\n\nTranslation (${
            languages.find((l) => l.code === targetLanguage)?.name
          }):\n${outputText}`,
          formData: {
            sourceLanguage,
            targetLanguage,
            inputText,
            outputText,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save translation")
      }

      const data = await response.json()
      toast.success(t("translationTool.success.translationSaved", language))
    } catch (error) {
      console.error("Save error:", error)
      toast.error(t("translationTool.errors.saveFailed", language))
    } finally {
      setIsSaving(false)
    }
  }

  const swapLanguages = () => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
    setInputText(outputText)
    setOutputText("")
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("translationTool.title", language)}</h1>
        <p className="text-muted-foreground">{t("translationTool.subtitle", language)}</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t("translationTool.textTranslation", language)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="source-language">{t("translationTool.translateFrom", language)}</Label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger id="source-language" className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder={t("translationTool.enterText", language)}
                className="min-h-[200px] resize-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="text-xs text-muted-foreground text-right">
                {inputText.length} {t("translationTool.characters", language)}
              </div>
            </div>

            <div className="hidden md:flex items-center self-center">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={swapLanguages}
                disabled={isTranslating}
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span className="sr-only">{t("translationTool.swapLanguages", language)}</span>
              </Button>
            </div>

            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="target-language">{t("translationTool.translateTo", language)}</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger id="target-language" className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder={t("translationTool.translationOutput", language)}
                className="min-h-[200px] resize-none bg-muted"
                value={outputText}
                readOnly
              />
              <div className="text-xs text-muted-foreground text-right">
                {outputText.length} {t("translationTool.characters", language)}
              </div>
            </div>
          </div>

          <div className="md:hidden flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={swapLanguages}
              disabled={isTranslating}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="sr-only">{t("translationTool.swapLanguages", language)}</span>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="flex-1" onClick={handleTranslation} disabled={!inputText.trim() || isTranslating}>
            {isTranslating ? t("translationTool.translating", language) : t("translationTool.translate", language)}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={saveTranslation}
            disabled={!outputText.trim() || isSaving || isTranslating}
          >
            {isSaving ? t("translationTool.saving", language) : t("translationTool.saveTranslation", language)}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
