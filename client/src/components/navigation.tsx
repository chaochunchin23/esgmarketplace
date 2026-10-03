import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, Building2, Briefcase } from "lucide-react";
import { ShoppingCart } from "./ShoppingCart";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TranslationKey, TranslatedText } from "./TranslatedText";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { translate, language } = useTranslations();

  // Fix the nested <a> tag issue by using a custom Link wrapper
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <span 
          className={`cursor-pointer ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
        >
          {children}
        </span>
      </Link>
    );
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <span className="font-semibold text-lg cursor-pointer">esgOne</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/consultants">
              <TranslationKey textKey="Consultants" />
            </NavLink>
            <NavLink href="/courses">
              <TranslationKey textKey="Courses" />
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ShoppingCart />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 px-3">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 font-medium flex items-center gap-2">
                  <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {language === "en" ? "Dashboard" : "儀表板"}
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <TranslationKey textKey="Profile" />
                  </DropdownMenuItem>
                </Link>
                {user.role === "provider" && (
                  <Link href="/provider-management">
                    <DropdownMenuItem className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      {language === "en" ? "Provider Dashboard" : "供應商儀表板"}
                    </DropdownMenuItem>
                  </Link>
                )}
                {user.role === "consultant" && (
                  <Link href="/consultant-dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      {language === "en" ? "Consultant Dashboard" : "顧問儀表板"}
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <TranslationKey textKey="Sign Out" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button>{language === "en" ? "Sign In" : "登入"}</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}