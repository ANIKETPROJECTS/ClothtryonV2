import type { Product, InsertProduct, Cart, CartItem } from "@shared/schema";
import { randomUUID } from "crypto";
import { defaultSizeChart } from "@shared/schema";

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Cart
  getCart(sessionId: string): Promise<Cart>;
  addToCart(sessionId: string, item: CartItem): Promise<Cart>;
  updateCartItem(sessionId: string, productId: string, size: string, color: string, quantity: number): Promise<Cart>;
  removeFromCart(sessionId: string, productId: string, size: string, color: string): Promise<Cart>;
  clearCart(sessionId: string): Promise<Cart>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private carts: Map<string, Cart>;

  constructor() {
    this.products = new Map();
    this.carts = new Map();
    this.seedProducts();
  }

  private seedProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Classic Black Tee",
        description: "Premium 100% cotton t-shirt with a relaxed fit. Perfect for everyday wear with exceptional comfort and durability.",
        price: 29.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#000000", "#FFFFFF", "#3B82F6", "#EF4444"],
        imageUrl: "/attached_assets/1_1765646362966.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Real Friend Graphic Tee",
        description: "Street-style graphic t-shirt featuring original artwork. Made with soft, breathable fabric.",
        price: 34.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#1F2937", "#F59E0B", "#10B981"],
        imageUrl: "/attached_assets/2_1765646362965.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Sunshine Yellow Tee",
        description: "Bright and cheerful yellow t-shirt crafted from ultra-soft fabric blend. Stand out with this vibrant style.",
        price: 32.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#F59E0B", "#EC4899", "#14B8A6"],
        imageUrl: "/attached_assets/3_1765646362965.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Cozy Pullover Hoodie",
        description: "Warm and cozy hoodie with kangaroo pocket. Premium fleece lining for ultimate comfort.",
        price: 59.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#1E293B", "#7C3AED", "#059669"],
        imageUrl: "/attached_assets/image_1765645153215.png",
        category: "hoodie",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Athletic Zip Hoodie",
        description: "Performance hoodie with full-zip design. Moisture-wicking fabric perfect for workouts or casual wear.",
        price: 64.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#0F172A", "#DC2626", "#2563EB"],
        imageUrl: "/attached_assets/image_1765645155974.png",
        category: "hoodie",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Vintage Wash Tee",
        description: "Retro-inspired t-shirt with a unique vintage wash finish. Soft hand-feel with lived-in comfort.",
        price: 39.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#78716C", "#A1A1AA", "#D6D3D1"],
        imageUrl: "/attached_assets/image_1765645162774.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Oversized Comfort Hoodie",
        description: "Trendy oversized hoodie for maximum comfort. Extra soft fleece with dropped shoulders.",
        price: 69.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#F5F5F4", "#18181B", "#854D0E"],
        imageUrl: "/attached_assets/image_1765645420814.png",
        category: "hoodie",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Minimalist Logo Tee",
        description: "Clean minimalist design with subtle logo detail. Premium pima cotton for exceptional softness.",
        price: 36.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#FFFFFF", "#000000", "#6B7280"],
        imageUrl: "/attached_assets/image_1765645790987.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Tech Fleece Hoodie",
        description: "Modern tech fleece construction with sleek silhouette. Lightweight warmth with premium finish.",
        price: 79.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#334155", "#4F46E5", "#0D9488"],
        imageUrl: "/attached_assets/image_1765647518464.png",
        category: "hoodie",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
      {
        name: "Essential Crew Tee",
        description: "Everyday essential t-shirt with classic crew neck. Durable construction that gets softer with every wash.",
        price: 24.99,
        sizes: ["S", "M", "L", "XL"],
        colors: ["#292524", "#FAFAF9", "#3B82F6", "#22C55E"],
        imageUrl: "/attached_assets/image_1765647576112.png",
        category: "tshirt",
        sizeChart: defaultSizeChart,
        inStock: true,
      },
    ];

    sampleProducts.forEach((product) => {
      const id = randomUUID();
      this.products.set(id, { ...product, id });
    });
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = { ...existing, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  private getOrCreateCart(sessionId: string): Cart {
    let cart = this.carts.get(sessionId);
    if (!cart) {
      cart = {
        id: randomUUID(),
        sessionId,
        items: [],
        totalPrice: 0,
      };
      this.carts.set(sessionId, cart);
    }
    return cart;
  }

  private async calculateTotal(cart: Cart): Promise<number> {
    let total = 0;
    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    }
    return total;
  }

  async getCart(sessionId: string): Promise<Cart> {
    const cart = this.getOrCreateCart(sessionId);
    cart.totalPrice = await this.calculateTotal(cart);
    return cart;
  }

  async addToCart(sessionId: string, item: CartItem): Promise<Cart> {
    const cart = this.getOrCreateCart(sessionId);
    
    const existingIndex = cart.items.findIndex(
      (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    cart.totalPrice = await this.calculateTotal(cart);
    return cart;
  }

  async updateCartItem(
    sessionId: string,
    productId: string,
    size: string,
    color: string,
    quantity: number
  ): Promise<Cart> {
    const cart = this.getOrCreateCart(sessionId);

    if (quantity <= 0) {
      return this.removeFromCart(sessionId, productId, size, color);
    }

    const item = cart.items.find(
      (i) => i.productId === productId && i.size === size && i.color === color
    );

    if (item) {
      item.quantity = quantity;
    }

    cart.totalPrice = await this.calculateTotal(cart);
    return cart;
  }

  async removeFromCart(sessionId: string, productId: string, size: string, color: string): Promise<Cart> {
    const cart = this.getOrCreateCart(sessionId);
    
    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && i.size === size && i.color === color)
    );

    cart.totalPrice = await this.calculateTotal(cart);
    return cart;
  }

  async clearCart(sessionId: string): Promise<Cart> {
    const cart = this.getOrCreateCart(sessionId);
    cart.items = [];
    cart.totalPrice = 0;
    return cart;
  }
}

export const storage = new MemStorage();
