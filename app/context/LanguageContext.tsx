// app/context/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

type LocaleKey = 'en' | 'ur';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  locale: LocaleKey;
  direction: Direction;
  switchLanguage: (lang: LocaleKey) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const RTL_LOCALES = ['ur', 'ar', 'fa'];

export function LanguageProvider({ 
  children, 
  initialLocale 
}: { 
  children: ReactNode; 
  initialLocale: LocaleKey 
}) {
  const [locale, setLocale] = useState<LocaleKey>(initialLocale);
  const router = useRouter();

  const switchLanguage = (lang: LocaleKey) => {
    // 1. Update State
    setLocale(lang);
    
    // 2. Set Cookie (so the server can read it on refresh)
    Cookies.set('NEXT_LOCALE', lang, { expires: 365 });

    // 3. Refresh the router to re-trigger Server Components
    router.refresh();
  };

  const direction = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ locale, direction, switchLanguage }}>
      <div dir={direction} className={direction}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}