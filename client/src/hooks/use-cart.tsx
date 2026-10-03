import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "./use-toast";

// Cart item types
export type CartItemType = "course" | "consultation";

export interface CartItem {
  id: number;
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
  details?: any; // Additional item-specific details
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number, type: CartItemType) => void;
  updateQuantity: (id: number, type: CartItemType, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Initialize cart from localStorage if available
  useEffect(() => {
    const savedCart = localStorage.getItem("esg-marketplace-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart", e);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("esg-marketplace-cart", JSON.stringify(items));
  }, [items]);
  
  // Calculate total number of items
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total price
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Add item to cart
  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      // Check if item already exists in cart
      const existingItemIndex = prev.findIndex(
        item => item.id === newItem.id && item.type === newItem.type
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, increase quantity
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += 1;
        
        toast({
          title: "Item quantity updated",
          description: `${newItem.name} quantity increased to ${updatedItems[existingItemIndex].quantity}`,
        });
        
        return updatedItems;
      } else {
        // New item, add to cart
        toast({
          title: "Item added to cart",
          description: `${newItem.name} has been added to your cart`,
        });
        
        return [...prev, { ...newItem, quantity: 1 }];
      }
    });
  };
  
  // Remove item from cart
  const removeItem = (id: number, type: CartItemType) => {
    setItems(prev => {
      const removedItem = prev.find(item => item.id === id && item.type === type);
      
      if (removedItem) {
        toast({
          title: "Item removed from cart",
          description: `${removedItem.name} has been removed from your cart`,
        });
      }
      
      return prev.filter(item => !(item.id === id && item.type === type));
    });
  };
  
  // Update item quantity
  const updateQuantity = (id: number, type: CartItemType, quantity: number) => {
    if (quantity < 1) {
      removeItem(id, type);
      return;
    }
    
    setItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === id && item.type === type) {
          return { ...item, quantity };
        }
        return item;
      });
      
      return updatedItems;
    });
  };
  
  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}