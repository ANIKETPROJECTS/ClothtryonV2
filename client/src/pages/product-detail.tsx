import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, ShoppingBag, Check, ChevronLeft, Ruler, Rotate3d, Image as ImageIcon } from "lucide-react";
import type { Product, SizeKey } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TShirtViewer from "@/components/tshirt-viewer";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
  });

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) {
      toast({
        title: "Please select options",
        description: "Choose a size and color to add to cart",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/products">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50">
              {product.modelUrl ? (
                <TShirtViewer modelUrl={product.modelUrl} />
              ) : (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                  data-testid="img-product-main"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category === "tshirt" ? "T-Shirt" : "Hoodie"}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="text-product-title">
                {product.name}
              </h1>
              <p className="mt-4 text-2xl font-bold" data-testid="text-product-price">
                ${product.price.toFixed(2)}
              </p>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-sm font-medium">
                  Size: {selectedSize || "Select a size"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      className="min-w-14"
                      onClick={() => setSelectedSize(size)}
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium">
                  Color: {selectedColor || "Select a color"}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      data-testid={`button-color-${color}`}
                    >
                      {selectedColor === color && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                className="gap-2"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
              <Link href={`/try-on?product=${product.id}`}>
                <Button size="lg" variant="outline" className="w-full gap-2" data-testid="button-try-on">
                  <Camera className="h-5 w-5" />
                  Try On with Camera
                </Button>
              </Link>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="size-chart">
                <AccordionTrigger className="gap-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Size Chart
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-medium">Size</th>
                          <th className="py-2 text-left font-medium">Shoulder (cm)</th>
                          <th className="py-2 text-left font-medium">Chest (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(["S", "M", "L", "XL"] as const).map((size) => (
                          <tr key={size} className="border-b">
                            <td className="py-2 font-medium">{size}</td>
                            <td className="py-2">{product.sizeChart[size].shoulder}</td>
                            <td className="py-2">{product.sizeChart[size].chest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="description">
                <AccordionTrigger>Product Details</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Premium quality fabric</li>
                    <li>Comfortable fit for everyday wear</li>
                    <li>Machine washable</li>
                    <li>Sustainably sourced materials</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
