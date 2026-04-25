import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.campaigns': 'Campaigns',
    'nav.volunteer': 'Volunteer',
    'nav.donate': 'Donate Now',
    'hero.title': 'Empowering Lives, Building Hope',
    'hero.subtitle': 'Supporting orphanages and elderly homes across India',
    'hero.donate': 'Donate Now',
    'hero.volunteer': 'Become a Volunteer',
    'stats.donations': 'Total Donations',
    'stats.children': 'Children Helped',
    'stats.volunteers': 'Active Volunteers',
    'stats.campaigns': 'Active Campaigns',
    'dashboard': 'Dashboard',
    'impact': 'Impact',
    'donate': 'Donate',
    'donations': 'Donations',
    'sponsorship': 'Sponsorship',
    'wishlist': 'Wishlist',
    'volunteers': 'Volunteers',
    'my tasks': 'My Tasks',
    'achievements': 'Achievements',
    'needs': 'Needs',
    'events': 'Events',
    'campaigns': 'Campaigns',
    'reports': 'Reports',
    'success stories': 'Success Stories',
    'transparency': 'Transparency',
    'beneficiaries': 'Beneficiaries',
    'users': 'Users',
    'approvals': 'Approvals',
    'settings': 'Settings',
    'my support': 'My Support',
    'requests': 'Requests',
    'announcements': 'Announcements',
    'admin': 'Admin Panel',
  },
  hi: {
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.campaigns': 'अभियान',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.donate': 'दान करें',
    'hero.title': 'जीवन को सशक्त बनाना, आशा का निर्माण',
    'hero.subtitle': 'भारत भर में अनाथालयों और वृद्धाश्रमों का समर्थन',
    'hero.donate': 'अभी दान करें',
    'hero.volunteer': 'स्वयंसेवक बनें',
    'stats.donations': 'कुल दान',
    'stats.children': 'बच्चों की मदद की',
    'stats.volunteers': 'सक्रिय स्वयंसेवक',
    'stats.campaigns': 'सक्रिय अभियान',
    'dashboard': 'डैशबोर्ड',
    'impact': 'प्रभाव',
    'donate': 'दान करें',
    'donations': 'दान',
    'sponsorship': 'प्रायोजन',
    'wishlist': 'विशलिस्ट',
    'volunteers': 'स्वयंसेवक',
    'my tasks': 'मेरे कार्य',
    'achievements': 'उपलब्धियां',
    'needs': 'जरूरतें',
    'events': 'घटनाएं',
    'campaigns': 'अभियान',
    'reports': 'रिपोर्ट',
    'success stories': 'सफलता की कहानियां',
    'transparency': 'पारदर्शिता',
    'beneficiaries': 'लाभार्थी',
    'users': 'उपयोगकर्ता',
    'approvals': 'स्वीकृति',
    'settings': 'सेटिंग्स',
    'my support': 'मेरी सहायता',
    'requests': 'अनुरोध',
    'announcements': 'घोषणाएं',
    'admin': 'एडमिन पैनल',
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.about': 'आमच्याबद्दल',
    'nav.campaigns': 'मोहिमा',
    'nav.volunteer': 'स्वयंसेवक',
    'nav.donate': 'दान करा',
    'hero.title': 'जीवन सशक्त करणे, आशा निर्माण करणे',
    'hero.subtitle': 'संपूर्ण भारतातील अनाथाश्रम आणि वृद्धाश्रमांना पाठिंबा',
    'hero.donate': 'आता दान करा',
    'hero.volunteer': 'स्वयंसेवक व्हा',
    'stats.donations': 'एकूण देणग्या',
    'stats.children': 'मुलांना मदत केली',
    'stats.volunteers': 'सक्रिय स्वयंसेवक',
    'stats.campaigns': 'सक्रिय मोहिमा',
    'dashboard': 'डॅशबोर्ड',
    'impact': 'प्रभाव',
    'donate': 'दान करा',
    'donations': 'देणग्या',
    'sponsorship': 'प्रायोजकत्व',
    'wishlist': 'विशलिस्ट',
    'volunteers': 'स्वयंसेवक',
    'my tasks': 'माझी कार्ये',
    'achievements': 'यश',
    'needs': 'गरजा',
    'events': 'कार्यक्रम',
    'campaigns': 'मोहिमा',
    'reports': 'अहवाल',
    'success stories': 'यशोगाथा',
    'transparency': 'पारदर्शकता',
    'beneficiaries': 'लाभार्थी',
    'users': 'वापरकर्ते',
    'approvals': 'मंजुरी',
    'settings': 'सेटिंग्ज',
    'my support': 'माझे समर्थन',
    'requests': 'विनंत्या',
    'announcements': 'घोषणा',
    'admin': 'प्रशासन पॅनेल',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
