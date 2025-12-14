import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { MongoClient, Db, Collection } from "mongodb";
import { randomUUID } from "crypto";
import { z } from "zod";

const sizeChartSchema = z.object({
  S: z.object({ shoulder: z.number(), chest: z.number() }),
  M: z.object({ shoulder: z.number(), chest: z.number() }),
  L: z.object({ shoulder: z.number(), chest: z.number() }),
  XL: z.object({ shoulder: z.number(), chest: z.number() }),
});

type SizeChart = z.infer<typeof sizeChartSchema>;

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  sizes: z.array(z.enum(["S", "M", "L", "XL"])),
  colors: z.array(z.string()),
  imageUrl: z.string(),
  category: z.enum(["tshirt", "hoodie"]),
  sizeChart: sizeChartSchema,
  inStock: z.boolean(),
});

type Product = z.infer<typeof productSchema>;

const insertProductSchema = productSchema.omit({ id: true });

const cartItemSchema = z.object({
  productId: z.string(),
  size: z.enum(["S", "M", "L", "XL"]),
  color: z.string(),
  quantity: z.number().min(1),
});

type CartItem = z.infer<typeof cartItemSchema>;

const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  items: z.array(cartItemSchema),
  totalPrice: z.number(),
});

type Cart = z.infer<typeof cartSchema>;

const defaultSizeChart: SizeChart = {
  S: { shoulder: 42, chest: 96 },
  M: { shoulder: 44, chest: 102 },
  L: { shoulder: 46, chest: 108 },
  XL: { shoulder: 48, chest: 114 },
};

type InsertProduct = z.infer<typeof insertProductSchema>;

const sampleProducts: InsertProduct[] = [
  {
    name: "Classic Black Tee",
    description:
      "Premium 100% cotton t-shirt with a relaxed fit. Perfect for everyday wear with exceptional comfort and durability.",
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

let client: MongoClient | null = null;
let db: Db | null = null;
let productsCollection: Collection<Product> | null = null;
let cartsCollection: Collection<Cart> | null = null;

async function getDb() {
  if (db)
    return {
      db,
      productsCollection: productsCollection!,
      cartsCollection: cartsCollection!,
    };

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is required");

  client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });

  await client.connect();
  db = client.db("virtualtryon");
  productsCollection = db.collection<Product>("products");
  cartsCollection = db.collection<Cart>("carts");

  const existingCount = await productsCollection.countDocuments();
  if (existingCount === 0) {
    const productsWithIds: Product[] = sampleProducts.map((product) => ({
      ...product,
      id: randomUUID(),
    }));
    await productsCollection.insertMany(productsWithIds);
  }

  return { db, productsCollection, cartsCollection };
}

async function calculateTotal(
  cart: Cart,
  productsCol: Collection<Product>,
): Promise<number> {
  let total = 0;
  for (const item of cart.items) {
    const product = await productsCol.findOne({ id: item.productId });
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return total;
}

async function getOrCreateCart(
  sessionId: string,
  cartsCol: Collection<Cart>,
): Promise<Cart> {
  const existingCart = await cartsCol.findOne({ sessionId });
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
  await cartsCol.insertOne(newCart as any);
  return newCart;
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext,
) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const path =
    event.path.replace("/.netlify/functions/api", "").replace("/api", "") ||
    "/";
  const method = event.httpMethod;
  const sessionId = event.headers["x-session-id"] || "default-session";

  try {
    const { productsCollection, cartsCollection } = await getDb();

    if (path === "/products" && method === "GET") {
      const products = await productsCollection.find({}).toArray();
      return { statusCode: 200, headers, body: JSON.stringify(products) };
    }

    if (path.startsWith("/products/") && method === "GET") {
      const id = path.split("/")[2];
      const product = await productsCollection.findOne({ id });
      if (!product) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Product not found" }),
        };
      }
      return { statusCode: 200, headers, body: JSON.stringify(product) };
    }

    if (path === "/products" && method === "POST") {
      try {
        const body = JSON.parse(event.body || "{}");
        const validated = insertProductSchema.parse(body);
        const id = randomUUID();
        const product: Product = { ...validated, id };
        await productsCollection.insertOne(product);
        return { statusCode: 201, headers, body: JSON.stringify(product) };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.errors }),
          };
        }
        throw error;
      }
    }

    if (path.startsWith("/products/") && method === "PATCH") {
      try {
        const id = path.split("/")[2];
        const body = JSON.parse(event.body || "{}");
        const validated = insertProductSchema.partial().parse(body);
        const result = await productsCollection.findOneAndUpdate(
          { id },
          { $set: validated },
          { returnDocument: "after" },
        );
        if (!result) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Product not found" }),
          };
        }
        return { statusCode: 200, headers, body: JSON.stringify(result) };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.errors }),
          };
        }
        throw error;
      }
    }

    if (path.startsWith("/products/") && method === "DELETE") {
      const id = path.split("/")[2];
      const result = await productsCollection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Product not found" }),
        };
      }
      return { statusCode: 204, headers, body: "" };
    }

    if (path === "/cart" && method === "GET") {
      const cart = await getOrCreateCart(sessionId, cartsCollection);
      cart.totalPrice = await calculateTotal(cart, productsCollection);
      await cartsCollection.updateOne(
        { sessionId },
        { $set: cart },
        { upsert: true },
      );
      return { statusCode: 200, headers, body: JSON.stringify(cart) };
    }

    if (path === "/cart/items" && method === "POST") {
      try {
        const body = JSON.parse(event.body || "{}");
        const item = cartItemSchema.parse(body);
        const cart = await getOrCreateCart(sessionId, cartsCollection);

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

        cart.totalPrice = await calculateTotal(cart, productsCollection);
        await cartsCollection.updateOne(
          { sessionId },
          { $set: cart },
          { upsert: true },
        );
        return { statusCode: 200, headers, body: JSON.stringify(cart) };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.errors }),
          };
        }
        throw error;
      }
    }

    if (path === "/cart/items" && method === "PATCH") {
      const { productId, size, color, quantity } = JSON.parse(
        event.body || "{}",
      );
      const cart = await getOrCreateCart(sessionId, cartsCollection);

      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (i) =>
            !(
              i.productId === productId &&
              i.size === size &&
              i.color === color
            ),
        );
      } else {
        const item = cart.items.find(
          (i) =>
            i.productId === productId && i.size === size && i.color === color,
        );
        if (item) {
          item.quantity = quantity;
        }
      }

      cart.totalPrice = await calculateTotal(cart, productsCollection);
      await cartsCollection.updateOne(
        { sessionId },
        { $set: cart },
        { upsert: true },
      );
      return { statusCode: 200, headers, body: JSON.stringify(cart) };
    }

    if (path === "/cart/items" && method === "DELETE") {
      const { productId, size, color } = JSON.parse(event.body || "{}");
      const cart = await getOrCreateCart(sessionId, cartsCollection);

      cart.items = cart.items.filter(
        (i) =>
          !(i.productId === productId && i.size === size && i.color === color),
      );

      cart.totalPrice = await calculateTotal(cart, productsCollection);
      await cartsCollection.updateOne(
        { sessionId },
        { $set: cart },
        { upsert: true },
      );
      return { statusCode: 200, headers, body: JSON.stringify(cart) };
    }

    if (path === "/cart" && method === "DELETE") {
      const cart = await getOrCreateCart(sessionId, cartsCollection);
      cart.items = [];
      cart.totalPrice = 0;
      await cartsCollection.updateOne(
        { sessionId },
        { $set: cart },
        { upsert: true },
      );
      return { statusCode: 200, headers, body: JSON.stringify(cart) };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

export { handler };
