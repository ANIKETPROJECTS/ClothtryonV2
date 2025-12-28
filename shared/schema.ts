import { z } from "zod";

// Size chart measurements for each size
export const sizeChartSchema = z.object({
  S: z.object({ shoulder: z.number(), chest: z.number() }),
  M: z.object({ shoulder: z.number(), chest: z.number() }),
  L: z.object({ shoulder: z.number(), chest: z.number() }),
  XL: z.object({ shoulder: z.number(), chest: z.number() }),
});

export type SizeChart = z.infer<typeof sizeChartSchema>;
export type SizeKey = keyof SizeChart;

// Product schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  sizes: z.array(z.enum(["S", "M", "L", "XL"])),
  colors: z.array(z.string()),
  imageUrl: z.string(),
  modelUrl: z.string().optional(),
  category: z.enum(["tshirt", "hoodie"]),
  sizeChart: sizeChartSchema,
  inStock: z.boolean(),
});

export type Product = z.infer<typeof productSchema>;

export const insertProductSchema = productSchema.omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Cart item schema
export const cartItemSchema = z.object({
  productId: z.string(),
  size: z.enum(["S", "M", "L", "XL"]),
  color: z.string(),
  quantity: z.number().min(1),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Cart schema
export const cartSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  items: z.array(cartItemSchema),
  totalPrice: z.number(),
});

export type Cart = z.infer<typeof cartSchema>;

export const insertCartItemSchema = cartItemSchema;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Analytics event schema
export const analyticsEventSchema = z.object({
  id: z.string(),
  productId: z.string(),
  action: z.enum(["view", "try-on", "add-to-cart"]),
  timestamp: z.string(),
  sessionId: z.string(),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

// Size recommendation result
export const sizeRecommendationSchema = z.object({
  recommendedSize: z.enum(["S", "M", "L", "XL"]),
  shoulderWidth: z.number(),
  chestWidth: z.number(),
  confidence: z.number(),
});

export type SizeRecommendation = z.infer<typeof sizeRecommendationSchema>;

// Pose keypoints for body tracking
export const poseKeypointsSchema = z.object({
  leftShoulder: z.object({ x: z.number(), y: z.number(), visibility: z.number() }),
  rightShoulder: z.object({ x: z.number(), y: z.number(), visibility: z.number() }),
  leftHip: z.object({ x: z.number(), y: z.number(), visibility: z.number() }),
  rightHip: z.object({ x: z.number(), y: z.number(), visibility: z.number() }),
});

export type PoseKeypoints = z.infer<typeof poseKeypointsSchema>;

// Default size chart for products
export const defaultSizeChart: SizeChart = {
  S: { shoulder: 42, chest: 96 },
  M: { shoulder: 44, chest: 102 },
  L: { shoulder: 46, chest: 108 },
  XL: { shoulder: 48, chest: 114 },
};
