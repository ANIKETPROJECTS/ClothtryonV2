import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Camera, Filter } from "lucide-react";
import type { Product } from "@shared/schema";
import { useState } from "react";

export default function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter((product) =>
    categoryFilter ? product.category === categoryFilter : true
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="text-page-title">
              Our Collection
            </h1>
            <p className="mt-1 text-muted-foreground">
              Premium apparel designed for the modern you
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={categoryFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(null)}
              data-testid="button-filter-all"
            >
              All
            </Button>
            <Button
              variant={categoryFilter === "tshirt" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("tshirt")}
              data-testid="button-filter-tshirts"
            >
              T-Shirts
            </Button>
            <Button
              variant={categoryFilter === "hoodie" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("hoodie")}
              data-testid="button-filter-hoodies"
            >
              Hoodies
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 bg-muted/30">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Filter className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card 
        className="group cursor-pointer overflow-hidden border-0 bg-muted/30 transition-all duration-200 hover-elevate"
        data-testid={`card-product-${product.id}`}
      >
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Link href={`/try-on?product=${product.id}`}>
              <Button size="sm" className="gap-1 shadow-lg" data-testid={`button-quick-try-${product.id}`}>
                <Camera className="h-3 w-3" />
                Try On
              </Button>
            </Link>
          </div>
          {!product.inStock && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              Out of Stock
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium leading-tight line-clamp-1" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-lg font-bold" data-testid={`text-product-price-${product.id}`}>
              ${product.price.toFixed(2)}
            </span>
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((color) => (
                <div
                  key={color}
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
