import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, X, Minus, Plus, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import PayPalButton from "@/components/PayPalButton";
import { TranslationKey, TranslatedText } from "./TranslatedText";

export function ShoppingCart() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const [, navigate] = useLocation();
  const [isPayPalOpen, setIsPayPalOpen] = useState(false);
  const { language } = useTranslations();
  
  const handleCheckout = () => {
    // Redirect to checkout page with cart data
    navigate("/checkout");
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            <TranslationKey textKey="Shopping Cart" />
          </SheetTitle>
          <SheetDescription>
            {items.length === 0 
              ? <TranslationKey textKey="Your cart is empty" />
              : language === "en" 
                ? `You have ${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart` 
                : `您的購物車中有 ${totalItems} 個項目`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">
                <TranslationKey textKey="Your cart is empty" />
              </h3>
              <p className="text-muted-foreground mt-1">
                <TranslatedText 
                  text="Explore our consultants and courses to add items to your cart"
                  fallback={language === "en" 
                    ? "Explore our consultants and courses to add items to your cart" 
                    : "瀏覽我們的顧問和課程，將項目添加到您的購物車"}
                />
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={`${item.type}-${item.id}`} className="border rounded-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "course" 
                            ? (language === "en" ? "Course" : "課程") 
                            : (language === "en" ? "Consultation" : "諮詢")}
                        </p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removeItem(item.id, item.type)}
                        className="h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-7 w-7"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                          className="h-7 w-7"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-medium">${item.price.toFixed(2)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {items.length > 0 && (
          <>
            <Separator />
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === "en" ? "Subtotal" : "小計"}</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === "en" ? "Fees" : "費用"}</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span><TranslationKey textKey="Total" /></span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <SheetClose asChild>
                  <Button onClick={handleCheckout} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <TranslationKey textKey="Checkout" />
                  </Button>
                </SheetClose>
                
                <Button variant="outline" onClick={() => setIsPayPalOpen(!isPayPalOpen)}>
                  {language === "en" ? "Pay with PayPal" : "使用PayPal付款"}
                </Button>
                
                {isPayPalOpen && (
                  <div className="p-2 border rounded-md mt-2">
                    <PayPalButton 
                      amount={totalPrice.toString()} 
                      currency="USD" 
                      intent="CAPTURE" 
                    />
                  </div>
                )}
                
                <Button variant="ghost" onClick={clearCart}>
                  {language === "en" ? "Clear Cart" : "清空購物車"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}