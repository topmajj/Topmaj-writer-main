"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type LanguageContextType = {
  language: "en" | "ar"
  setLanguage: (language: "en" | "ar") => void
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  isRTL: false,
})

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<"en" | "ar">("en")
  const isRTL = language === "ar"

  const setLanguage = (newLanguage: "en" | "ar") => {
    setLanguageState(newLanguage)
    localStorage.setItem("preferred-language", newLanguage)
    document.documentElement.lang = newLanguage
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr"
  }

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language") as "en" | "ar" | null
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguage(savedLanguage)
    }
  }, [])

  return <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>{children}</LanguageContext.Provider>
}
