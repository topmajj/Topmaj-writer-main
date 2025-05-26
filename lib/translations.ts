import enTranslations from "@/translations/en.json"
import arTranslations from "@/translations/ar.json"

type TranslationKey = string

export function getTranslation(key: TranslationKey, language: "en" | "ar", params?: Record<string, any>): string {
  const translations = language === "en" ? enTranslations : arTranslations

  // Split the key by dots to navigate the nested structure
  const keys = key.split(".")
  let result: any = translations

  // Navigate through the nested structure
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k]
    } else {
      // If key not found, return the key itself
      return key
    }
  }

  // Handle parameter substitution if needed
  if (params && typeof result === "string") {
    return Object.entries(params).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{${key}}`, "g"), String(value))
    }, result)
  }

  return typeof result === "string" ? result : key
}

export function t(key: TranslationKey, language: "en" | "ar", params?: Record<string, any>): string {
  return getTranslation(key, language, params)
}
