"use client"

import { ArrowUpRight, BookText, FileText, MessageSquare, Search } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function TemplatesPage() {
  const { language } = useLanguage()

  // Sample template categories
  const categories = [
    { id: "blog", name: t("templates.categories.blogPosts", language), count: 12 },
    { id: "social", name: t("templates.categories.socialMedia", language), count: 8 },
    { id: "email", name: t("templates.categories.email", language), count: 10 },
    { id: "ads", name: t("templates.categories.ads", language), count: 6 },
    { id: "website", name: t("templates.categories.websiteCopy", language), count: 5 },
    { id: "product", name: t("templates.categories.ecommerce", language), count: 7 },
  ]

  // Sample templates
  const templates = [
    {
      id: "1",
      title: "Blog Post Introduction",
      description: t("templates.descriptions.blogPostIntro", language),
      category: t("templates.categories.blogPosts", language),
      icon: BookText,
      href: "/dashboard/templates/blog-post-introduction",
    },
    {
      id: "2",
      title: "Product Description",
      description: t("templates.descriptions.productDescription", language),
      category: t("templates.categories.ecommerce", language),
      icon: FileText,
      href: `/dashboard/templates/product-description`,
    },
    {
      id: "3",
      title: "Social Media Post",
      description: t("templates.descriptions.socialMediaPost", language),
      category: t("templates.categories.socialMedia", language),
      icon: MessageSquare,
      href: "/dashboard/templates/social-media-post",
    },
    {
      id: "4",
      title: "Email Newsletter",
      description: t("templates.descriptions.emailNewsletter", language),
      category: t("templates.categories.email", language),
      icon: FileText,
      href: "/dashboard/templates/newsletter",
    },
    {
      id: "5",
      title: "SEO Blog Post",
      description: t("templates.descriptions.seoBlogPost", language),
      category: t("templates.categories.blogPosts", language),
      icon: BookText,
      href: "/dashboard/templates/seo-blog-post",
    },
    {
      id: "6",
      title: "Instagram Caption",
      description: t("templates.descriptions.instagramCaption", language),
      category: t("templates.categories.socialMedia", language),
      icon: MessageSquare,
      href: "/dashboard/templates/instagram-caption",
    },
    {
      id: "7",
      title: "Landing Page Copy",
      description: t("templates.descriptions.landingPageCopy", language),
      category: t("templates.categories.websiteCopy", language),
      icon: FileText,
      href: `/dashboard/templates/landing-page-copy`,
    },
    {
      id: "8",
      title: "Ad Copy",
      description: t("templates.descriptions.adCopy", language),
      category: t("templates.categories.ads", language),
      icon: FileText,
      href: `/dashboard/templates/ad-copy`,
    },
    // Adding more template cards
    {
      id: "9",
      title: "Case Study",
      description: t("templates.descriptions.caseStudy", language),
      category: t("templates.categories.blogPosts", language),
      icon: BookText,
      href: "/dashboard/templates/case-study",
    },
    {
      id: "10",
      title: "LinkedIn Post",
      description: t("templates.descriptions.linkedinPost", language),
      category: t("templates.categories.socialMedia", language),
      icon: MessageSquare,
      href: "/dashboard/templates/linkedin-post",
    },
    {
      id: "11",
      title: "Welcome Email Sequence",
      description: t("templates.descriptions.welcomeEmail", language),
      category: t("templates.categories.email", language),
      icon: FileText,
      href: "/dashboard/templates/welcome-email",
    },
    {
      id: "12",
      title: "Facebook Ad Copy",
      description: t("templates.descriptions.facebookAdCopy", language),
      category: t("templates.categories.ads", language),
      icon: FileText,
      href: `/dashboard/templates/facebook-ad-copy`,
    },
    {
      id: "13",
      title: "About Us Page",
      description: t("templates.descriptions.aboutUsPage", language),
      category: t("templates.categories.websiteCopy", language),
      icon: FileText,
      href: `/dashboard/templates/about-us-page`,
    },
    // Removed E-commerce Product Description
    {
      id: "15",
      title: "How-To Guide",
      description: t("templates.descriptions.howToGuide", language),
      category: t("templates.categories.blogPosts", language),
      icon: BookText,
      href: "/dashboard/templates/how-to-guide",
    },
    {
      id: "16",
      title: "Twitter Thread",
      description: t("templates.descriptions.twitterThread", language),
      category: t("templates.categories.socialMedia", language),
      icon: MessageSquare,
      href: `/dashboard/templates/twitter-thread`,
    },
    {
      id: "17",
      title: "Promotional Email",
      description: t("templates.descriptions.promotionalEmail", language),
      category: t("templates.categories.email", language),
      icon: FileText,
      href: "/dashboard/templates/promotional-email",
    },
    {
      id: "18",
      title: "Google Ads Copy",
      description: t("templates.descriptions.googleAdsCopy", language),
      category: t("templates.categories.ads", language),
      icon: FileText,
      href: `/dashboard/templates/google-ads-copy`,
    },
    {
      id: "19",
      title: "FAQ Page",
      description: t("templates.descriptions.faqPage", language),
      category: t("templates.categories.websiteCopy", language),
      icon: FileText,
      href: `/dashboard/templates/faq-page`,
    },
    {
      id: "20",
      title: "Feature Comparison",
      description: t("templates.descriptions.featureComparison", language),
      category: t("templates.categories.ecommerce", language),
      icon: FileText,
      href: `/dashboard/templates/feature-comparison`,
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("templates.title", language)}</h1>
        <p className="text-muted-foreground">{t("templates.subtitle", language)}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder={t("templates.searchPlaceholder", language)} className="w-full pl-8" />
          </div>
        </div>
        <></>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap w-full">
          <TabsTrigger value="all" className="flex-1">
            {t("templates.allTemplates", language)}
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex-1">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="w-full mt-4">
          <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col w-full">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary/10 p-2">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{template.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <Badge variant="secondary">{template.category}</Badge>
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <Link href={template.href}>
                      {t("templates.useTemplate", language)}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="w-full mt-4">
            <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates
                .filter((t) => t.category.toLowerCase() === category.name.toLowerCase())
                .map((template) => (
                  <Card key={template.id} className="flex flex-col w-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-2">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardDescription>{template.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t p-4">
                      <Badge variant="secondary">{template.category}</Badge>
                      <Button variant="ghost" size="sm" className="gap-1" asChild>
                        <Link href={template.href}>
                          {t("templates.useTemplate", language)}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
