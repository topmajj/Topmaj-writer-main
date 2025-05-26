"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Download, Save } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function ImageGenerationPage() {
  const { language } = useLanguage()
  const [title, setTitle] = useState("")
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("photorealistic")
  const [size, setSize] = useState("1024x1024")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedImage, setGeneratedImage] = useState("")
  const [savedImages, setSavedImages] = useState([])
  const [activeTab, setActiveTab] = useState("generate")
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const tab = searchParams.get("tab")

  useEffect(() => {
    if (tab === "result" && generatedImage) {
      setActiveTab("result")
    } else {
      setActiveTab("generate")
    }
  }, [tab, generatedImage])

  useEffect(() => {
    fetchSavedImages()
  }, [])

  const fetchSavedImages = async () => {
    try {
      const response = await fetch("/api/images/list")
      if (response.ok) {
        const data = await response.json()
        setSavedImages(data.images)
      }
    } catch (error) {
      console.error("Error fetching saved images:", error)
    }
  }

  const handleGenerateImage = async (e) => {
    e.preventDefault()

    if (!prompt) {
      toast({
        title: t("imageGeneration.messages.enterPrompt", language),
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          style,
          size,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedImage(data.imageUrl)
        router.push("?tab=result")
        toast({
          title: t("imageGeneration.messages.generationSuccess", language),
        })
      } else {
        throw new Error("Image generation failed")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast({
        title: t("imageGeneration.messages.generationError", language),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveImage = async () => {
    if (!generatedImage) return

    setIsSaving(true)

    try {
      const response = await fetch("/api/images/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || prompt.substring(0, 50),
          prompt,
          imageUrl: generatedImage,
          style,
          size,
        }),
      })

      if (response.ok) {
        toast({
          title: t("imageGeneration.messages.saveSuccess", language),
        })
        fetchSavedImages()
      } else {
        throw new Error("Failed to save image")
      }
    } catch (error) {
      console.error("Error saving image:", error)
      toast({
        title: t("imageGeneration.messages.saveError", language),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `${title || "generated-image"}-${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderStyleName = (styleName) => {
    const styleMap = {
      none: t("imageGeneration.styles.none", language),
      "3d-render": t("imageGeneration.styles.3dRender", language),
      "pixel-art": t("imageGeneration.styles.pixelArt", language),
      "digital-art": t("imageGeneration.styles.digitalArt", language),
      photorealistic: t("imageGeneration.styles.photorealistic", language),
      anime: t("imageGeneration.styles.anime", language),
      watercolor: t("imageGeneration.styles.watercolor", language),
      "oil-painting": t("imageGeneration.styles.oilPainting", language),
      "pencil-drawing": t("imageGeneration.styles.pencilDrawing", language),
    }

    return styleMap[styleName] || styleName
  }

  const renderDimensionName = (dimension) => {
    const dimensionMap = {
      "1024x1024": t("imageGeneration.dimensions.square", language),
      "1024x1792": t("imageGeneration.dimensions.portrait", language),
      "1792x1024": t("imageGeneration.dimensions.landscape", language),
    }

    return dimensionMap[dimension] || dimension
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">{t("imageGeneration.title", language)}</h1>
        <p className="text-muted-foreground">{t("imageGeneration.subtitle", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generate">{t("imageGeneration.tabs.generate", language)}</TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedImage}>
            {t("imageGeneration.tabs.result", language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("imageGeneration.tabs.generate", language)}</CardTitle>
              <CardDescription>{t("imageGeneration.subtitle", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateImage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("imageGeneration.form.title", language)}</Label>
                  <Input
                    id="title"
                    placeholder={t("imageGeneration.form.titlePlaceholder", language)}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">{t("imageGeneration.form.prompt", language)}</Label>
                  <Textarea
                    id="prompt"
                    placeholder={t("imageGeneration.form.promptPlaceholder", language)}
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="style">{t("imageGeneration.form.style", language)}</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("imageGeneration.styles.none", language)}</SelectItem>
                        <SelectItem value="3d-render">{t("imageGeneration.styles.3dRender", language)}</SelectItem>
                        <SelectItem value="pixel-art">{t("imageGeneration.styles.pixelArt", language)}</SelectItem>
                        <SelectItem value="digital-art">{t("imageGeneration.styles.digitalArt", language)}</SelectItem>
                        <SelectItem value="photorealistic">
                          {t("imageGeneration.styles.photorealistic", language)}
                        </SelectItem>
                        <SelectItem value="anime">{t("imageGeneration.styles.anime", language)}</SelectItem>
                        <SelectItem value="watercolor">{t("imageGeneration.styles.watercolor", language)}</SelectItem>
                        <SelectItem value="oil-painting">
                          {t("imageGeneration.styles.oilPainting", language)}
                        </SelectItem>
                        <SelectItem value="pencil-drawing">
                          {t("imageGeneration.styles.pencilDrawing", language)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">{t("imageGeneration.form.dimensions", language)}</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">{t("imageGeneration.dimensions.square", language)}</SelectItem>
                        <SelectItem value="1024x1792">{t("imageGeneration.dimensions.portrait", language)}</SelectItem>
                        <SelectItem value="1792x1024">{t("imageGeneration.dimensions.landscape", language)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating
                    ? t("imageGeneration.form.generating", language)
                    : t("imageGeneration.form.generateButton", language)}
                </Button>

                {isGenerating && (
                  <div className="text-center text-sm text-muted-foreground">
                    <p>{t("imageGeneration.messages.generating", language)}</p>
                    <p>{t("imageGeneration.messages.generatingTime", language)}</p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {savedImages && savedImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("imageGeneration.gallery.title", language)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedImages.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={image.image_url || "/placeholder.svg"}
                        alt={image.title || "Generated image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardFooter className="flex justify-between p-2">
                      <div className="text-xs">
                        <div className="font-medium truncate max-w-[100px]">{image.title}</div>
                        <div className="text-muted-foreground">
                          {t("imageGeneration.gallery.style", language)}: {renderStyleName(image.style)}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={image.image_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">{t("imageGeneration.gallery.download", language)}</span>
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {(!savedImages || savedImages.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-muted-foreground">{t("imageGeneration.gallery.noImages", language)}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("imageGeneration.result.title", language)}</CardTitle>
              <CardDescription>{t("imageGeneration.result.subtitle", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border">
                    <Image
                      src={generatedImage || "/placeholder.svg"}
                      alt="Generated image"
                      width={1024}
                      height={1024}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">{t("imageGeneration.result.prompt", language)}</h3>
                      <p className="text-sm text-muted-foreground">{prompt}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("imageGeneration.result.style", language)}</h3>
                      <p className="text-sm text-muted-foreground">{renderStyleName(style)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("imageGeneration.result.dimensions", language)}</h3>
                      <p className="text-sm text-muted-foreground">{renderDimensionName(size)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-muted-foreground">{t("imageGeneration.result.noImage", language)}</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("generate")}>
                    {t("imageGeneration.result.goToGenerator", language)}
                  </Button>
                </div>
              )}
            </CardContent>
            {generatedImage && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("imageGeneration.result.downloadButton", language)}
                </Button>
                <Button onClick={handleSaveImage} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving
                    ? t("imageGeneration.result.saving", language)
                    : t("imageGeneration.result.saveButton", language)}
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => router.push("?tab=generate")}>
              {t("common.back", language)}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
