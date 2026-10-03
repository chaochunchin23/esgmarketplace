import { useState, useEffect } from "react";
import { useTranslations, Language } from "@/hooks/use-translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { TranslationKey } from "./TranslatedText";

// Language display names
const languageNames: Record<Language, string> = {
  "en": "English",
  "zh-TW": "繁體中文"
};

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);
  
  const handleLanguageChange = (newLanguage: Language) => {
    if (newLanguage !== language) {
      setLanguage(newLanguage);
      setLanguageChanged(true);
    }
    setIsOpen(false);
  };
  
  // Show a refresh message when language is changed
  useEffect(() => {
    if (languageChanged) {
      const timer = setTimeout(() => {
        setLanguageChanged(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [languageChanged]);
  
  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Globe className="h-5 w-5" />
            <span className="sr-only">
              {language === "en" ? "Change language" : "更改語言"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>
            {language === "en" ? "Select Language" : "選擇語言"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(languageNames).map(([langCode, name]) => (
            <DropdownMenuItem
              key={langCode}
              onClick={() => handleLanguageChange(langCode as Language)}
              className={`flex items-center ${langCode === language ? 'font-medium' : ''}`}
            >
              <span className="w-6 h-6 flex items-center justify-center mr-2">
                {langCode === 'en' ? '🇺🇸' : langCode === 'zh-TW' ? '🇹🇼' : ''}
              </span>
              {name}
              {langCode === language && (
                <span className="ml-2 text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Language change notification */}
      {languageChanged && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-primary text-primary-foreground rounded shadow-lg animate-in fade-in slide-in-from-top-5 z-50 text-sm">
          {language === "en" 
            ? "Language changed to English" 
            : "語言已更改為繁體中文"}
        </div>
      )}
    </div>
  );
}