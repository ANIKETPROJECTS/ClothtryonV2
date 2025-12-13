import { createContext, useContext, useState, useCallback } from "react";
import type { CartItem, Product } from "@shared/schema";

interface CartContextType {
  items: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: number;
  getProductDetails: (productId: string) => Product | undefined;
  products: Product[];
  setProducts: (products: Product[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const addToCart = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          item.size === size &&
          item.color === color
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id &&
          item.size === size &&
          item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, size: size as any, color, quantity }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && item.size === size && item.color === color)
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, color: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getProductDetails = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products]
  );

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = items.reduce((sum, item) => {
    const product = getProductDetails(item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItemCount,
        cartTotal,
        getProductDetails,
        products,
        setProducts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
