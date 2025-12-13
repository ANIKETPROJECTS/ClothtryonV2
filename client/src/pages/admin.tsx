import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Trash2, Edit2, Eye, TrendingUp, ShoppingCart, Camera } from "lucide-react";
import type { Product, InsertProduct } from "@shared/schema";
import { insertProductSchema, defaultSizeChart } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  sizes: z.array(z.enum(["S", "M", "L", "XL"])).min(1, "Select at least one size"),
  colors: z.string().min(1, "Enter at least one color"),
  imageUrl: z.string().url("Must be a valid URL"),
  category: z.enum(["tshirt", "hoodie"]),
  inStock: z.boolean(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      sizes: ["S", "M", "L", "XL"],
      colors: "",
      imageUrl: "",
      category: "tshirt",
      inStock: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProduct> }) => {
      return apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({ title: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    const productData: InsertProduct = {
      ...data,
      colors: data.colors.split(",").map((c) => c.trim()),
      sizeChart: defaultSizeChart,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      sizes: product.sizes,
      colors: product.colors.join(", "),
      imageUrl: product.imageUrl,
      category: product.category,
      inStock: product.inStock,
    });
    setDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    form.reset();
    setDialogOpen(true);
  };

  const stats = {
    totalProducts: products?.length || 0,
    inStock: products?.filter((p) => p.inStock).length || 0,
    tshirts: products?.filter((p) => p.category === "tshirt").length || 0,
    hoodies: products?.filter((p) => p.category === "hoodie").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your product catalog
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewProduct} className="gap-2" data-testid="button-add-product">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product name" {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Product description" {...field} data-testid="input-product-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="tshirt">T-Shirt</SelectItem>
                              <SelectItem value="hoodie">Hoodie</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="colors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colors (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="#000000, #FFFFFF, #3B82F6" {...field} data-testid="input-product-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.png" {...field} data-testid="input-product-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inStock"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel>In Stock</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Product is available for purchase
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-in-stock"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-product"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingProduct
                        ? "Update"
                        : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-muted/30">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/30">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">{stats.inStock}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/30">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Camera className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">T-Shirts</p>
                <p className="text-2xl font-bold">{stats.tshirts}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-muted/30">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <ShoppingCart className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hoodies</p>
                <p className="text-2xl font-bold">{stats.hoodies}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-muted/30">
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {product.category === "tshirt" ? "T-Shirt" : "Hoodie"}
                          </Badge>
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={product.inStock ? "default" : "secondary"}>
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(product.id)}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No products yet</p>
                <p className="text-muted-foreground">
                  Add your first product to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
