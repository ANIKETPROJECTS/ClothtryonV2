import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItemCount, setCartOpen } = useCart();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/try-on", label: "Try On" },
    { href: "/products", label: "Shop" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight" data-testid="text-brand-name">VTRYON</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                className="text-sm font-medium"
                data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setCartOpen(true)}
            data-testid="button-cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <Badge
                variant="default"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
              >
                {cartItemCount}
              </Badge>
            )}
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-4 pt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={location === link.href ? "secondary" : "ghost"}
                      className="w-full justify-start text-lg"
                      data-testid={`link-mobile-${link.label.toLowerCase().replace(" ", "-")}`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
