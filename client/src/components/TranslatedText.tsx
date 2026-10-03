import { useState, useEffect } from "react";
import { useTranslations, Language } from "@/hooks/use-translations";

interface TranslatedTextProps {
  text: string;
  className?: string;
  fallback?: string;
}

/**
 * Component that handles text translation based on the selected language
 * 
 * Usage:
 * <TranslatedText text="Hello World" />
 */
export function TranslatedText({ 
  text, 
  className = "", 
  fallback 
}: TranslatedTextProps) {
  const { language, translate, translatedTexts } = useTranslations();
  
  // Handle common phrases directly (without API calls)
  const commonPhrases: Record<string, Record<Language, string>> = {
    "Loading...": { "en": "Loading...", "zh-TW": "加載中..." },
    "Not found": { "en": "Not found", "zh-TW": "未找到" },
    "Environmental": { "en": "Environmental", "zh-TW": "環境" },
    "Social": { "en": "Social", "zh-TW": "社會" },
    "Governance": { "en": "Governance", "zh-TW": "治理" },
    "Consultation": { "en": "Consultation", "zh-TW": "諮詢" },
    "Book now": { "en": "Book now", "zh-TW": "立即預約" },
    "Add to cart": { "en": "Add to cart", "zh-TW": "加入購物車" },
    "Payment method": { "en": "Payment method", "zh-TW": "付款方式" },
    "Checkout": { "en": "Checkout", "zh-TW": "結帳" },
    "Reviews": { "en": "Reviews", "zh-TW": "評價" },
    "Expertise": { "en": "Expertise", "zh-TW": "專業領域" },
    "Profile": { "en": "Profile", "zh-TW": "個人資料" },
    "Services": { "en": "Services", "zh-TW": "服務" }
  };
  
  // Get initial text, prioritizing existing translations
  const getInitialText = () => {
    // First check our common phrases dictionary
    if (commonPhrases[text]?.[language]) {
      return commonPhrases[text][language];
    }
    
    // Then check existing translations
    if (translatedTexts[text]?.[language]) {
      return translatedTexts[text][language];
    }
    
    // If in English mode, just use the original text
    if (language === "en") {
      return text;
    }
    
    // For fallback, return the provided fallback or original text
    return fallback || text;
  };
  
  const [translatedText, setTranslatedText] = useState<string>(getInitialText());
  const [isLoading, setIsLoading] = useState(
    language !== "en" && 
    !translatedTexts[text]?.[language] && 
    !commonPhrases[text]?.[language]
  );

  useEffect(() => {
    // If we already have the translation from our cache or common phrases
    if (
      translatedTexts[text]?.[language] || 
      commonPhrases[text]?.[language] ||
      language === "en"
    ) {
      setTranslatedText(
        language === "en" 
          ? text 
          : commonPhrases[text]?.[language] || translatedTexts[text]?.[language]
      );
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch the translation
    setIsLoading(true);
    translate(text)
      .then((result) => {
        setTranslatedText(result);
        setIsLoading(false);
      })
      .catch(() => {
        // If translation fails, try to make a best-effort translation
        const bestEffort = text
          .replace(/ESG/g, "ESG")
          .replace(/consultation/gi, "諮詢")
          .replace(/consultant/gi, "顧問")
          .replace(/payment/gi, "付款")
          .replace(/course/gi, "課程")
          .replace(/review/gi, "評價")
          .replace(/profile/gi, "資料");
          
        setTranslatedText(bestEffort !== text ? bestEffort : (fallback || text));
        setIsLoading(false);
      });
  }, [text, language, translate, translatedTexts]);

  return (
    <span className={`${className} ${isLoading ? "opacity-70" : ""}`}>
      {translatedText}
    </span>
  );
}

interface TranslationKeyProps {
  textKey: string;
  className?: string;
}

/**
 * Component that uses predefined translation keys
 * 
 * Usage:
 * <TranslationKey textKey="Home" />
 */
export function TranslationKey({ 
  textKey, 
  className = "" 
}: TranslationKeyProps) {
  const { language, translatedTexts } = useTranslations();
  
  // Get the translation for this key if it exists
  const translation = translatedTexts[textKey]?.[language];
  
  // If no translation exists, return the key itself
  return (
    <span className={className}>
      {translation || textKey}
    </span>
  );
}