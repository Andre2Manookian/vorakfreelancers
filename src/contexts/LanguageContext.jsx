import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslation } from '../lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('vorak-lang') || 'en')

  useEffect(() => {
    localStorage.setItem('vorak-lang', lang)
    document.documentElement.lang = lang === 'am' ? 'hy' : lang
  }, [lang])

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
  }, [])

  const t = useCallback((key) => getTranslation(lang, key), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
