import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, cartItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, updates);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Cart routes
  const getSessionId = (req: any): string => {
    return req.headers["x-session-id"] as string || "default-session";
  };

  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cart = await storage.getCart(sessionId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/items", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const item = cartItemSchema.parse(req.body);
      const cart = await storage.addToCart(sessionId, item);
      res.json(cart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/items", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { productId, size, color, quantity } = req.body;
      const cart = await storage.updateCartItem(sessionId, productId, size, color, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/items", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { productId, size, color } = req.body;
      const cart = await storage.removeFromCart(sessionId, productId, size, color);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cart = await storage.clearCart(sessionId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  return httpServer;
}
