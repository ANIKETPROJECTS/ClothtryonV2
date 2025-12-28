import type { Product, InsertProduct, Cart, CartItem } from "@shared/schema";
import { randomUUID } from "crypto";
import { defaultSizeChart } from "@shared/schema";
import { MongoClient, Db, Collection } from "mongodb";

export interface IStorage {
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  getCart(sessionId: string): Promise<Cart>;
  addToCart(sessionId: string, item: CartItem): Promise<Cart>;
  updateCartItem(
    sessionId: string,
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ): Promise<Cart>;
  removeFromCart(
    sessionId: string,
    productId: string,
    size: string,
    color: string,
  ): Promise<Cart>;
  clearCart(sessionId: string): Promise<Cart>;
}

const sampleProducts: InsertProduct[] = [
  {
    name: "Classic Black Tee",
    description:
      "Premium 100% cotton t-shirt with a relaxed fit. Perfect for everyday wear with exceptional comfort and durability.",
    price: 29.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["#000000", "#FFFFFF", "#3B82F6", "#EF4444"],
    imageUrl: "/attached_assets/1_1765646362966.png",
    modelUrl: "/t_shirt.fbx",
    category: "tshirt",
    sizeChart: defaultSizeChart,
    inStock: true,
  },
  {
    name: "Real Friend Graphic Tee",
    description:
      "Street-style graphic t-shirt featuring original artwork. Made with soft, breathable fabric.",
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
    description:
      "Bright and cheerful yellow t-shirt crafted from ultra-soft fabric blend. Stand out with this vibrant style.",
    price: 32.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["#F59E0B", "#EC4899", "#14B8A6"],
    imageUrl: "/attached_assets/3_1765646362965.png",
    category: "tshirt",
    sizeChart: defaultSizeChart,
    inStock: true,
  },
];

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db | null = null;
  private productsCollection: Collection<Product> | null = null;
  private cartsCollection: Collection<Cart> | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is required");
    }
    this.client = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.client.connect();
      this.db = this.client.db("virtualtryon");
      this.productsCollection = this.db.collection<Product>("products");
      this.cartsCollection = this.db.collection<Cart>("carts");

      await this.seedProducts();
      this.initialized = true;
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async seedProducts(): Promise<void> {
    if (!this.productsCollection) return;

    // Always clear and reseed to ensure product list matches sample data
    await this.productsCollection.deleteMany({});

    const productsWithIds: Product[] = sampleProducts.map((product) => ({
      ...product,
      id: randomUUID(),
    }));

    await this.productsCollection.insertMany(productsWithIds);
    console.log(`Seeded ${productsWithIds.length} products`);
  }

  async getAllProducts(): Promise<Product[]> {
    await this.ensureInitialized();
    if (!this.productsCollection) return [];
    return this.productsCollection.find({}).toArray();
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await this.ensureInitialized();
    if (!this.productsCollection) return undefined;
    const product = await this.productsCollection.findOne({ id });
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    await this.ensureInitialized();
    if (!this.productsCollection) throw new Error("Database not initialized");

    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    await this.productsCollection.insertOne(product);
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    await this.ensureInitialized();
    if (!this.productsCollection) return undefined;

    const result = await this.productsCollection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" },
    );
    return result || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.productsCollection) return false;

    const result = await this.productsCollection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  private async getOrCreateCart(sessionId: string): Promise<Cart> {
    await this.ensureInitialized();
    if (!this.cartsCollection) throw new Error("Database not initialized");

    const existingCart = await this.cartsCollection.findOne({ sessionId });
    if (existingCart) {
      const { _id, ...cart } = existingCart as any;
      return cart as Cart;
    }

    const newCart: Cart = {
      id: randomUUID(),
      sessionId,
      items: [],
      totalPrice: 0,
    };
    await this.cartsCollection.insertOne(newCart as any);
    return newCart;
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

  private async saveCart(cart: Cart): Promise<void> {
    await this.ensureInitialized();
    if (!this.cartsCollection) return;

    await this.cartsCollection.updateOne(
      { sessionId: cart.sessionId },
      { $set: cart },
      { upsert: true },
    );
  }

  async getCart(sessionId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionId);
    cart.totalPrice = await this.calculateTotal(cart);
    await this.saveCart(cart);
    return cart;
  }

  async addToCart(sessionId: string, item: CartItem): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionId);

    const existingIndex = cart.items.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.size === item.size &&
        i.color === item.color,
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    cart.totalPrice = await this.calculateTotal(cart);
    await this.saveCart(cart);
    return cart;
  }

  async updateCartItem(
    sessionId: string,
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionId);

    if (quantity <= 0) {
      return this.removeFromCart(sessionId, productId, size, color);
    }

    const item = cart.items.find(
      (i) => i.productId === productId && i.size === size && i.color === color,
    );

    if (item) {
      item.quantity = quantity;
    }

    cart.totalPrice = await this.calculateTotal(cart);
    await this.saveCart(cart);
    return cart;
  }

  async removeFromCart(
    sessionId: string,
    productId: string,
    size: string,
    color: string,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionId);

    cart.items = cart.items.filter(
      (i) =>
        !(i.productId === productId && i.size === size && i.color === color),
    );

    cart.totalPrice = await this.calculateTotal(cart);
    await this.saveCart(cart);
    return cart;
  }

  async clearCart(sessionId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionId);
    cart.items = [];
    cart.totalPrice = 0;
    await this.saveCart(cart);
    return cart;
  }
}

export const storage = new MongoStorage();
