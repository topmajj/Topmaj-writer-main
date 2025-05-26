import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"
// Import the RTL styles
import "./rtl.css"
// Import the LanguageProvider
import { LanguageProvider } from "@/contexts/language-context"
import "./rtl-fixes.css"

// Force dynamic rendering to ensure cookies are properly handled
export const dynamic = "force-dynamic"

export const metadata = {
  title: "WriterAI - Professional AI Writing Platform",
  description: "Create, edit, and manage your content with AI assistance",
}

// Wrap the AuthProvider with the LanguageProvider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
