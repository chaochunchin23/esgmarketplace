import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useTranslations } from "@/hooks/use-translations";
import { TranslatedText, TranslationKey } from "@/components/TranslatedText";

export default function Home() {
  const { language } = useTranslations();
  
  return (
    <div className="space-y-8">
      <section className="py-12 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {language === "en" ? "Welcome to esgOne" : "歡迎來到 esgOne"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          <TranslatedText 
            text="Connect with expert ESG consultants and access professional training to drive sustainable business practices"
            fallback={language === "en" 
              ? "Connect with expert ESG consultants and access professional training to drive sustainable business practices" 
              : "與ESG專業顧問聯繫並獲取專業培訓，推動可持續的商業實踐"
            }
          />
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/consultants">
              <TranslatedText 
                text="Find Consultants" 
                fallback={language === "en" ? "Find Consultants" : "尋找顧問"}
              />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/courses">
              <TranslatedText 
                text="Browse Courses" 
                fallback={language === "en" ? "Browse Courses" : "瀏覽課程"}
              />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <img
              src="https://images.unsplash.com/photo-1480944657103-7fed22359e1d"
              alt={language === "en" ? "Sustainable Business" : "可持續業務"}
              className="rounded-lg aspect-video object-cover mb-4"
            />
            <h3 className="text-lg font-semibold">
              <TranslatedText 
                text="Expert Consultants" 
                fallback={language === "en" ? "Expert Consultants" : "專業顧問"}
              />
            </h3>
            <p className="text-muted-foreground">
              <TranslatedText 
                text="Connect with experienced ESG professionals to guide your sustainability journey"
                fallback={language === "en" 
                  ? "Connect with experienced ESG professionals to guide your sustainability journey" 
                  : "與有經驗的ESG專家聯繫，指導您的可持續發展之旅"
                }
              />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf"
              alt={language === "en" ? "Professional Consultant" : "專業顧問"}
              className="rounded-lg aspect-video object-cover mb-4"
            />
            <h3 className="text-lg font-semibold">
              <TranslatedText 
                text="Professional Training" 
                fallback={language === "en" ? "Professional Training" : "專業培訓"}
              />
            </h3>
            <p className="text-muted-foreground">
              <TranslatedText 
                text="Access certified courses and training programs in ESG and sustainability"
                fallback={language === "en" 
                  ? "Access certified courses and training programs in ESG and sustainability" 
                  : "獲取ESG和可持續發展的認證課程和培訓計劃"
                }
              />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
              alt={language === "en" ? "Environmental Corporate" : "環保企業"}
              className="rounded-lg aspect-video object-cover mb-4"
            />
            <h3 className="text-lg font-semibold">
              <TranslatedText 
                text="Sustainable Growth" 
                fallback={language === "en" ? "Sustainable Growth" : "可持續增長"}
              />
            </h3>
            <p className="text-muted-foreground">
              <TranslatedText 
                text="Build a more sustainable future for your business with expert guidance"
                fallback={language === "en" 
                  ? "Build a more sustainable future for your business with expert guidance" 
                  : "在專家指導下為您的企業構建更可持續的未來"
                }
              />
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}