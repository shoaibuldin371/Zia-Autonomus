'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  isRtl: boolean;
  toggleLanguage: () => void;
  t: (key: string, defaultText: string) => string;
}

const URDU_DICTIONARY: Record<string, string> = {
  'Today': 'آج کا دن',
  'Client Requests': 'کلائنٹ فرمائشیں (Client Requests)',
  'Businesses Found': 'تلاش کردہ ادارے',
  'Found': 'تلاش کردہ ادارے',
  'Emails': 'ای میلز',
  'Local Business Contacts': 'مقامی کاروباری رابطے (Local Business Contacts)',
  'Manual': 'مقامی کاروباری رابطے',
  'Direct Leads (Social & Calls)': 'مقامی کاروباری رابطے (Local Business Contacts)',
  'Shops and clinics with no email: call or message them': 'جن دکانوں اور کلینکس کی ای میل نہیں: فون یا میسج کریں',
  'Companies and people that need your skills (Wellfound, Contra, Hacker News and more)': 'وہ کمپنیاں جنہیں آپ کی مہارت درکار ہے (Wellfound، Contra، HN وغیرہ)',
  'More': 'مزید آپشنز',
  'Find Businesses Now': 'ابھی نئے کلائنٹس تلاش کریں',
  'All systems calm': 'تمام سسٹمز پرسکون اور فعال ہیں',
  'Review first (safe)': 'پہلے جائزہ لیں (محفوظ)',
  'Auto-send within safe limits': 'خودکار ترسیل (محفوظ حدود میں)',
  'Emergency Stop': 'ہنگامی طور پر تمام سرگرمیاں روکیں',
  'Safety & Rules': 'حفاظت اور ضوابط',
  'Platforms': 'پلیٹ فارمز',
  'Hot Client Requests': 'کلائنٹ فرمائشیں',
  'Search Plan': 'تلاش کا منصوبہ',
  'Setup & Connections': 'کنکشنز اور ترتیبات',
  'Help': 'مدد و رہنمائی',
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isRtl: false,
  toggleLanguage: () => {},
  t: (_key, defaultText) => defaultText,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const isRtl = language === 'ur';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRtl, language]);

  const t = (key: string, defaultText: string): string => {
    if (language === 'ur' && URDU_DICTIONARY[key]) {
      return URDU_DICTIONARY[key];
    }
    return defaultText;
  };

  return (
    <LanguageContext.Provider value={{ language, isRtl, toggleLanguage, t }}>
      <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'font-sans rtl' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

