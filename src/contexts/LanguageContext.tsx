import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations, supportedLanguages, type Language } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem("preferred_language");
    if (stored) {
      const lang = supportedLanguages.find((l) => l.code === stored);
      if (lang) return lang;
    }
  } catch {}
  return supportedLanguages[0]; // English default
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang.code);
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  }, []);

  useEffect(() => {
    document.documentElement.dir = language.dir;
    document.documentElement.lang = language.code;
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      const langTranslations = translations[language.code];
      if (langTranslations && langTranslations[key]) return langTranslations[key];
      // Fallback to English
      return translations.en?.[key] || key;
    },
    [language.code]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
