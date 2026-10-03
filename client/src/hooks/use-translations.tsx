import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { OpenAI } from "openai";

// Language options
export type Language = "en" | "zh-TW";

// Translation Context
interface TranslationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string) => Promise<string>;
  translatedTexts: Record<string, Record<Language, string>>;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

// Initial translations for common elements
const initialTranslations: Record<string, Record<Language, string>> = {
  // Navigation and general UI
  "Home": {
    "en": "Home",
    "zh-TW": "首頁"
  },
  "Consultants": {
    "en": "Consultants",
    "zh-TW": "顧問"
  },
  "Courses": {
    "en": "Courses",
    "zh-TW": "課程"
  },
  "Profile": {
    "en": "Profile",
    "zh-TW": "個人資料"
  },
  "Sign In": {
    "en": "Sign In",
    "zh-TW": "登入"
  },
  "Sign Up": {
    "en": "Sign Up",
    "zh-TW": "註冊"
  },
  "Sign Out": {
    "en": "Sign Out",
    "zh-TW": "登出"
  },
  "Register": {
    "en": "Register",
    "zh-TW": "註冊"
  },
  "Username": {
    "en": "Username",
    "zh-TW": "用戶名"
  },
  "Password": {
    "en": "Password",
    "zh-TW": "密碼"
  },
  "Email": {
    "en": "Email",
    "zh-TW": "電子郵件"
  },
  "Submit": {
    "en": "Submit",
    "zh-TW": "提交"
  },
  "Cancel": {
    "en": "Cancel",
    "zh-TW": "取消"
  },
  "Save": {
    "en": "Save",
    "zh-TW": "儲存"
  },
  "Edit": {
    "en": "Edit",
    "zh-TW": "編輯"
  },
  "Delete": {
    "en": "Delete",
    "zh-TW": "刪除"
  },
  "Search": {
    "en": "Search",
    "zh-TW": "搜尋"
  },
  
  // Consultation and booking related
  "Book Consultation": {
    "en": "Book Consultation",
    "zh-TW": "預約諮詢"
  },
  "Write Review": {
    "en": "Write Review",
    "zh-TW": "撰寫評論"
  },
  "Reviews": {
    "en": "Reviews",
    "zh-TW": "評論"
  },
  "Expertise": {
    "en": "Expertise",
    "zh-TW": "專業領域"
  },
  "Services": {
    "en": "Services",
    "zh-TW": "服務"
  },
  "Overview": {
    "en": "Overview",
    "zh-TW": "概覽"
  },
  "Training Offerings": {
    "en": "Training Offerings",
    "zh-TW": "培訓服務"
  },
  "Hourly Rate": {
    "en": "Hourly Rate",
    "zh-TW": "時薪"
  },
  "Years Experience": {
    "en": "Years Experience",
    "zh-TW": "年資"
  },
  "Message Consultant": {
    "en": "Message Consultant",
    "zh-TW": "發送訊息給顧問"
  },
  "Ask questions or discuss your needs": {
    "en": "Ask questions or discuss your needs",
    "zh-TW": "詢問問題或討論您的需求"
  },
  "Consultation Packages": {
    "en": "Consultation Packages",
    "zh-TW": "諮詢套餐"
  },
  "Select a package that suits your ESG needs": {
    "en": "Select a package that suits your ESG needs",
    "zh-TW": "選擇適合您ESG需求的套餐"
  },
  "Initial Consultation": {
    "en": "Initial Consultation",
    "zh-TW": "初步諮詢"
  },
  "Comprehensive Package": {
    "en": "Comprehensive Package",
    "zh-TW": "綜合套餐"
  },
  "Strategic Partnership": {
    "en": "Strategic Partnership",
    "zh-TW": "策略合作夥伴"
  },
  "Popular": {
    "en": "Popular",
    "zh-TW": "熱門"
  },
  "Custom Consultation Services": {
    "en": "Custom Consultation Services",
    "zh-TW": "客製化諮詢服務"
  },
  
  // Shopping and cart related
  "Add to Cart": {
    "en": "Add to Cart", 
    "zh-TW": "加入購物車"
  },
  "Buy Now": {
    "en": "Buy Now", 
    "zh-TW": "立即購買"
  },
  "Checkout": {
    "en": "Checkout",
    "zh-TW": "結帳"
  },
  "Shopping Cart": {
    "en": "Shopping Cart",
    "zh-TW": "購物車"
  },
  "Your cart is empty": {
    "en": "Your cart is empty",
    "zh-TW": "您的購物車是空的"
  },
  "Complete Purchase": {
    "en": "Complete Purchase",
    "zh-TW": "完成購買"
  },
  "Proceed to Payment": {
    "en": "Proceed to Payment",
    "zh-TW": "前往付款"
  },
  "Total": {
    "en": "Total",
    "zh-TW": "總計"
  },
  "Added to cart": {
    "en": "Added to cart",
    "zh-TW": "已加入購物車"
  },
  
  // ESG specific terms
  "ESG Consultants": {
    "en": "ESG Consultants",
    "zh-TW": "ESG顧問"
  },
  "ESG Courses": {
    "en": "ESG Courses",
    "zh-TW": "ESG課程"
  },
  "Environmental": {
    "en": "Environmental",
    "zh-TW": "環境"
  },
  "Social": {
    "en": "Social",
    "zh-TW": "社會"
  },
  "Governance": {
    "en": "Governance",
    "zh-TW": "治理"
  },
  "ESG Reporting": {
    "en": "ESG Reporting",
    "zh-TW": "ESG報告"
  },
  "Sustainability": {
    "en": "Sustainability",
    "zh-TW": "永續發展"
  },
  "ESG Assessment": {
    "en": "ESG Assessment",
    "zh-TW": "ESG評估"
  },
  "ESG Strategy": {
    "en": "ESG Strategy",
    "zh-TW": "ESG策略"
  },
  
  // Course related
  "Course Details": {
    "en": "Course Details",
    "zh-TW": "課程詳情"
  },
  "Course Level": {
    "en": "Course Level",
    "zh-TW": "課程級別"
  },
  "Beginner": {
    "en": "Beginner",
    "zh-TW": "初級"
  },
  "Intermediate": {
    "en": "Intermediate",
    "zh-TW": "中級"
  },
  "Advanced": {
    "en": "Advanced",
    "zh-TW": "高級"
  },
  "Enroll Now": {
    "en": "Enroll Now",
    "zh-TW": "立即報名"
  },
  "Learning Outcomes": {
    "en": "Learning Outcomes",
    "zh-TW": "學習成果"
  },
  "Course Syllabus": {
    "en": "Course Syllabus",
    "zh-TW": "課程大綱"
  },
  "Instructor": {
    "en": "Instructor",
    "zh-TW": "講師"
  },
  
  // Messaging system
  "Message": {
    "en": "Message",
    "zh-TW": "訊息"
  },
  "Send": {
    "en": "Send",
    "zh-TW": "發送"
  },
  "Please sign in to message this consultant": {
    "en": "Please sign in to message this consultant",
    "zh-TW": "請登入以向此顧問發送訊息"
  },
  "No messages yet. Start a conversation with this consultant.": {
    "en": "No messages yet. Start a conversation with this consultant.",
    "zh-TW": "尚無訊息。開始與此顧問的對話。"
  },
  "Type your message...": {
    "en": "Type your message...",
    "zh-TW": "輸入您的訊息..."
  },
  "Message sent": {
    "en": "Message sent",
    "zh-TW": "訊息已發送"
  },
  "Your message has been sent to the consultant": {
    "en": "Your message has been sent to the consultant",
    "zh-TW": "您的訊息已發送給顧問"
  },
  "Failed to send message": {
    "en": "Failed to send message",
    "zh-TW": "訊息發送失敗"
  }
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage
    const savedLanguage = localStorage.getItem("esg-marketplace-language");
    return (savedLanguage as Language) || "en";
  });
  
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, Record<Language, string>>>(initialTranslations);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem("esg-marketplace-language", language);
  }, [language]);

  // Function to translate text using OpenAI API with fallback to local dictionary
  const translate = async (text: string): Promise<string> => {
    // If already in English and user wants English, no need to translate
    if (language === "en") return text;
    
    // Check if we already have a translation for this text
    if (translatedTexts[text]?.[language]) {
      return translatedTexts[text][language];
    }
    
    // Create a basic dictionary for common checkout and payment terms
    const commonTerms: Record<string, string> = {
      "Complete Your Enrollment": "完成您的註冊",
      "Payment Information": "付款資訊",
      "Choose your preferred payment method": "選擇您偏好的付款方式",
      "Payment Method": "付款方式",
      "Review & Confirm": "檢查與確認",
      "Credit/Debit Card": "信用卡/借記卡",
      "Bank Transfer": "銀行轉賬",
      "Card Number": "卡號",
      "Cardholder Name": "持卡人姓名",
      "Expiry Date": "到期日",
      "Loading...": "加載中...",
      "Consultant not found": "找不到顧問",
      "Book Consultation": "預約諮詢",
      "Add to Cart": "加入購物車",
      "Client Reviews": "客戶評價",
      "Share your experience working with": "分享您與顧問合作的經驗",
      "See what others say about working with this consultant": "查看其他人對這位顧問的評價",
      "Professional Information": "專業資訊",
      "Consultation rate": "諮詢費率",
      "Completed ESG reports": "已完成的ESG報告",
      "Typical response time: 24 hours": "一般回應時間：24小時",
      "Working languages": "工作語言",
      "Remote & On-site": "遠程和現場",
      "Consultation options": "諮詢選項",
      "Industry Focus": "行業焦點"
    };

    // Check for common terms first
    if (commonTerms[text]) {
      // Store the translation for future use
      setTranslatedTexts(prev => ({
        ...prev,
        [text]: {
          ...prev[text],
          [language]: commonTerms[text]
        }
      }));
      
      return commonTerms[text];
    }
    
    try {
      // Make API call to translate only if necessary
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          targetLanguage: language,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Translation failed");
      }
      
      const data = await response.json();
      const translatedText = data.translatedText;
      
      // Store translation for future use
      setTranslatedTexts(prev => ({
        ...prev,
        [text]: {
          ...prev[text],
          [language]: translatedText
        }
      }));
      
      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      
      // If API translation fails, try to guess a translation for simple terms
      const simplifiedText = text
        .replace(/ESG/g, "ESG")
        .replace(/consultation/gi, "諮詢")
        .replace(/consultant/gi, "顧問")
        .replace(/payment/gi, "付款")
        .replace(/course/gi, "課程")
        .replace(/review/gi, "評價")
        .replace(/profile/gi, "資料");
      
      if (simplifiedText !== text) {
        return simplifiedText;
      }
      
      return text; // Return original text if all translation attempts fail
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage,
        translate,
        translatedTexts
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

// Using a named function declaration for consistent exports
export function useTranslations() {
  const context = useContext(TranslationContext);
  if (context === null) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }
  return context;
}