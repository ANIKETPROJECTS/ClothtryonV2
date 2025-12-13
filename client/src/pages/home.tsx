import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Ruler, ShoppingBag, Star, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Live Try-On",
    description: "See clothes on your body in real-time using your camera",
  },
  {
    icon: Ruler,
    title: "Perfect Fit",
    description: "AI-powered size recommendations based on your measurements",
  },
  {
    icon: ShoppingBag,
    title: "Shop With Confidence",
    description: "Buy knowing exactly how it looks on you",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    rating: 5,
    text: "Finally found a brand that fits perfectly! The try-on feature is amazing.",
  },
  {
    name: "Alex K.",
    rating: 5,
    text: "No more returns! I love being able to see how clothes look before buying.",
  },
  {
    name: "Jordan T.",
    rating: 5,
    text: "The size recommendation was spot on. Best online shopping experience ever.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-4 py-20 text-center md:py-32">
          <div className="flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Virtual Try-On</span>
          </div>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl" data-testid="text-hero-title">
            See How It Fits{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Before You Buy
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Experience the future of online shopping. Try on our premium apparel 
            using your camera and find your perfect fit with AI-powered recommendations.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/try-on">
              <Button size="lg" className="gap-2 px-8 text-base" data-testid="button-hero-try-on">
                <Camera className="h-5 w-5" />
                Start Try-On
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="gap-2 px-8 text-base" data-testid="button-hero-shop">
                Browse Collection
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>No app download required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Works on any device</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Free shipping over $50</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to find your perfect fit
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={feature.title} className="relative overflow-hidden border-0 bg-background">
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join thousands of happy customers
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-muted/30">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-4 text-foreground">"{testimonial.text}"</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Find Your Perfect Fit?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Try on our collection now and experience the future of online shopping.
          </p>
          <Link href="/try-on">
            <Button size="lg" className="gap-2 px-8 text-base" data-testid="button-cta-try-on">
              <Camera className="h-5 w-5" />
              Start Virtual Try-On
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">ONYU</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Size Guide</a>
              <a href="#" className="hover:text-foreground">Contact</a>
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} ONYU. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
