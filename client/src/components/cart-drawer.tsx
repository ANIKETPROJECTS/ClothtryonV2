import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Link } from "wouter";

export function CartDrawer() {
  const {
    items,
    cartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    getProductDetails,
  } = useCart();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Start trying on some clothes!
              </p>
            </div>
            <Link href="/try-on">
              <Button onClick={() => setCartOpen(false)} data-testid="button-start-trying">
                Start Trying On
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col gap-4 py-4">
                {items.map((item) => {
                  const product = getProductDetails(item.productId);
                  if (!product) return null;

                  return (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex gap-4"
                      data-testid={`cart-item-${item.productId}`}
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h4 className="font-medium leading-tight">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Size: {item.size} | Color: {item.color}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.size,
                                  item.color,
                                  item.quantity - 1
                                )
                              }
                              data-testid={`button-decrease-${item.productId}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.size,
                                  item.color,
                                  item.quantity + 1
                                )
                              }
                              data-testid={`button-increase-${item.productId}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              removeFromCart(item.productId, item.size, item.color)
                            }
                            data-testid={`button-remove-${item.productId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right font-semibold">
                        ${(product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold" data-testid="text-cart-total">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <Button className="w-full" size="lg" data-testid="button-checkout">
                Proceed to Checkout
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
