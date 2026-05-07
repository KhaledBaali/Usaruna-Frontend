import { createContext, useContext, useState, useEffect } from 'react';
import ar from '../translations/ar';
import en from '../translations/en';

const TRANSLATIONS = { ar, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('usaruna_lang') ?? 'ar');

  useEffect(() => {
    localStorage.setItem('usaruna_lang', lang);
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggle = () => setLang((l) => (l === 'ar' ? 'en' : 'ar'));
  const dir    = lang === 'ar' ? 'rtl' : 'ltr';
  const t      = (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.ar?.[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, dir, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
