import React, { useEffect, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  VideoOff,
  Sparkles,
  Ruler,
  ShoppingBag,
  RotateCcw,
  Info,
} from "lucide-react";
import { usePoseDetection } from "@/hooks/use-pose-detection";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import type { Product, SizeKey } from "@shared/schema";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, OrbitControls, useFBX, Center } from "@react-three/drei";
import * as THREE from "three";

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function OBJModel({ url, color }: { url: string; color?: string | null }) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!url) return;

    const loadOBJ = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        const vertices: number[] = [];
        const faces: number[] = [];

        const lines = text.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('v ')) {
            const parts = trimmed.substring(2).split(/\s+/).filter(p => p);
            if (parts.length >= 3) {
              vertices.push(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
            }
          } else if (trimmed.startsWith('f ')) {
            const parts = trimmed.substring(2).split(/\s+/).filter(p => p);
            for (const part of parts) {
              const idx = parseInt(part.split('/')[0]) - 1;
              if (!isNaN(idx) && idx >= 0) faces.push(idx);
            }
          }
        }

        if (vertices.length > 0 && faces.length > 0) {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
          geo.setIndex(new THREE.BufferAttribute(new Uint32Array(faces), 1));
          geo.computeVertexNormals();
          setGeometry(geo);
        }
      } catch (error) {
        console.error("Failed to load OBJ:", error);
      }
    };

    loadOBJ();
  }, [url]);

  if (!geometry) {
    return null;
  }

  return (
    <group scale={2.5} position={[0, -0.2, 0]}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color || "#000000"} 
          side={THREE.DoubleSide}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

function ModelContent({ url, color }: { url: string; color?: string | null }) {
  console.log("3D_TRYON: ModelContent loading URL:", url);
  const isFBX = url.toLowerCase().endsWith(".fbx");
  const isOBJ = url.toLowerCase().endsWith(".obj");
  const isGLTF = url.toLowerCase().endsWith(".gltf") || url.toLowerCase().endsWith(".glb");

  if (isFBX) {
    console.log("3D_TRYON: Using FBX path for", url);
    return <FBXModel url={url} color={color} />;
  }
  if (isOBJ) {
    console.log("3D_TRYON: Using OBJ path for", url);
    return <OBJModel url={url} color={color} />;
  }
  if (isGLTF) {
    console.log("3D_TRYON: Using GLTF path for", url);
    return <GLTFModel url={url} color={color} />;
  }

  console.warn("3D_TRYON: Unknown model format for", url);
  return null;
}

function FBXModel({ url, color }: { url: string; color?: string | null }) {
  console.log("3D_TRYON: FBXModel component mounting for", url);
  const fbx = useFBX(url);
  
  useEffect(() => {
    if (fbx) {
      console.log("3D_TRYON: FBX object details:", {
        type: fbx.type,
        uuid: fbx.uuid,
        name: fbx.name,
        children: fbx.children?.map(c => ({ name: c.name, type: c.type })),
        scale: fbx.scale,
        position: fbx.position
      });
      fbx.traverse((child: any) => {
        if (child.isMesh) {
          console.log("3D_TRYON: FBX Mesh detailed:", {
            name: child.name,
            geometry: !!child.geometry,
            material: !!child.material,
            visible: child.visible,
            opacity: child.material?.opacity,
            transparent: child.material?.transparent
          });
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            if (child.material.color) {
              child.material.color.set(0xffffff); // Force visibility
              if (color) child.material.color.set(color);
            }
            child.material.needsUpdate = true;
          }
        }
      });
    } else {
      console.warn("3D_TRYON: FBX object is null for", url);
    }
  }, [fbx, color]);

  if (!fbx) return null;

  return (
    <Center>
      <primitive object={fbx} scale={0.01} />
    </Center>
  );
}

function GLTFModel({ url, color }: { url: string; color?: string | null }) {
  const { scene } = useGLTF(url);
  useEffect(() => {
    if (scene) {
      console.log("3D_TRYON: GLTF Model Loaded:", {
        uuid: scene.uuid,
        name: scene.name,
        children: scene.children.length
      });
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material && color) {
            child.material.color.set(color);
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene, color]);

  return <primitive object={scene} scale={2.5} position={[0, -0.2, 0]} />;
}

function ModelOverlay({ url, color }: { url: string; color?: string | null }) {
  console.log("3D_TRYON: ModelOverlay rendering with URL:", url);
  return (
    <Suspense fallback={<Html center><div className="text-white bg-black/50 p-2 rounded">Loading Model...</div></Html>}>
      <ModelContent url={url} color={color} />
    </Suspense>
  );
}

export default function TryOnPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialProductId = searchParams.get("product");
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const {
    videoRef,
    canvasRef,
    isLoading: cameraLoading,
    isTracking,
    error: cameraError,
    sizeRecommendation,
    bodyBounds,
    startCamera,
    stopCamera,
  } = usePoseDetection({
    sizeChart: selectedProduct?.sizeChart,
  });

  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (selectedProduct && selectedProduct.colors.length > 0 && !selectedColor) {
      setSelectedColor(selectedProduct.colors[0]);
    }
  }, [selectedProduct, selectedColor]);

  const handlePrevProduct = () => {
    if (!products) return;
    const currentIndex = products.findIndex((p) => p.id === selectedProductId);
    const prevIndex = currentIndex <= 0 ? products.length - 1 : currentIndex - 1;
    setSelectedProductId(products[prevIndex].id);
    setSelectedColor(null);
  };

  const handleNextProduct = () => {
    if (!products) return;
    const currentIndex = products.findIndex((p) => p.id === selectedProductId);
    const nextIndex = currentIndex >= products.length - 1 ? 0 : currentIndex + 1;
    setSelectedProductId(products[nextIndex].id);
    setSelectedColor(null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !sizeRecommendation || !selectedColor) {
      toast({
        title: "Unable to add to cart",
        description: "Please start the camera for size recommendation",
        variant: "destructive",
      });
      return;
    }

    addToCart(selectedProduct, sizeRecommendation.recommendedSize, selectedColor);
    toast({
      title: "Added to cart",
      description: `${selectedProduct.name} (${sizeRecommendation.recommendedSize}) added to your cart`,
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col bg-muted/30 p-4 lg:p-6">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-2xl bg-background shadow-lg">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            playsInline
            muted
            style={{ transform: "scaleX(-1)" }}
          />
          
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ transform: "scaleX(-1)" }}
          />

          {isTracking && selectedProduct && bodyBounds && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${((videoRef.current?.videoWidth || 640) - bodyBounds.centerX) / (videoRef.current?.videoWidth || 640) * 100}%`,
                top: `${(bodyBounds.centerY / (videoRef.current?.videoHeight || 480)) * 100}%`,
                width: `${(bodyBounds.width / (videoRef.current?.videoWidth || 640)) * 100}%`,
                height: `${(bodyBounds.height / (videoRef.current?.videoHeight || 480)) * 100}%`,
                transform: "translate(-50%, -50%)",
                transformOrigin: "center center",
                opacity: 0.9,
              }}
            >
              {(() => {
                console.log("3D_TRYON: Checking product", {
                  id: selectedProduct.id,
                  hasModel: !!selectedProduct.modelUrl,
                  url: selectedProduct.modelUrl
                });
                return null;
              })()}
              {selectedProduct.modelUrl ? (
                <div className="h-full w-full" style={{ minHeight: '300px', pointerEvents: 'auto', background: '#f5f5f5' }}>
                  <Canvas 
                    key={selectedProduct.modelUrl}
                    camera={{ position: [0, 0, 3.5], fov: 60 }}
                    onCreated={({ gl }) => {
                      gl.setClearColor(0xf5f5f5);
                      console.log("3D_TRYON: Canvas Created Successfully", !!gl);
                    }}
                    onError={(err) => console.error("3D_TRYON: Canvas Critical Error", err)}
                  >
                    <CameraController />
                    <ambientLight intensity={2.2} />
                    <pointLight position={[5, 5, 8]} intensity={3} />
                    <pointLight position={[-5, 3, 5]} intensity={1.5} />
                    <directionalLight position={[0, 5, 5]} intensity={1.8} />
                    <ModelOverlay url={selectedProduct.modelUrl} color={selectedColor} />
                  </Canvas>
                </div>
              ) : (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="h-full w-full object-fill"
                  style={{
                    filter: selectedColor
                      ? `drop-shadow(0 0 10px ${selectedColor}40)`
                      : undefined,
                    mixBlendMode: "multiply",
                  }}
                />
              )}
            </div>
          )}

          {!isTracking && !cameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-muted/80 to-muted">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">Virtual Try-On</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Enable your camera to try on clothes virtually and get personalized size recommendations
                </p>
              </div>
              <Button
                size="lg"
                onClick={startCamera}
                className="gap-2"
                data-testid="button-start-camera"
              >
                <Camera className="h-5 w-5" />
                Start Camera
              </Button>
            </div>
          )}

          {cameraLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Starting camera...</p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-destructive/10 p-8 text-center">
              <VideoOff className="h-12 w-12 text-destructive" />
              <p className="text-destructive">{cameraError}</p>
              <Button variant="outline" onClick={startCamera} data-testid="button-retry-camera">
                Try Again
              </Button>
            </div>
          )}

          {sizeRecommendation && isTracking && (
            <div className="absolute right-4 top-4 animate-in fade-in slide-in-from-right-4">
              <Card className="border-0 bg-background/90 shadow-xl backdrop-blur-lg">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Ruler className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recommended Size</p>
                    <p className="text-xl font-bold" data-testid="text-recommended-size">
                      {sizeRecommendation.recommendedSize}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {Math.round(sizeRecommendation.confidence * 100)}% match
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {isTracking && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="border-0 bg-background/90 shadow-xl backdrop-blur-lg">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevProduct}
                      data-testid="button-prev-product"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextProduct}
                      data-testid="button-next-product"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedProduct?.colors.map((color) => (
                      <button
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        data-testid={`button-try-color-${color}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stopCamera}
                      data-testid="button-stop-camera"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      className="gap-2"
                      disabled={!sizeRecommendation}
                      data-testid="button-add-from-tryon"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {!isTracking && (
          <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-lg bg-primary/5 p-4">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <p className="mt-1">
                Stand in front of your camera with good lighting. Our AI will detect your body shape 
                and overlay the selected garment in real-time. You'll also get a personalized size 
                recommendation based on your measurements.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full border-t bg-background lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
        <div className="sticky top-16 flex flex-col">
          <div className="border-b p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Products
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a product to try on
            </p>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-1">
              {productsLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden border-0 bg-muted/30">
                      <Skeleton className="aspect-square w-full" />
                      <CardContent className="p-3">
                        <Skeleton className="mb-2 h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))
                : products?.map((product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer overflow-hidden border-0 transition-all hover-elevate ${
                        selectedProductId === product.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : "bg-muted/30"
                      }`}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setSelectedColor(null);
                      }}
                      data-testid={`card-sidebar-product-${product.id}`}
                    >
                      <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium leading-tight line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="mt-1 font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </ScrollArea>

          {selectedProduct && (
            <div className="border-t p-4">
              <Link href={`/product/${selectedProduct.id}`}>
                <Button variant="outline" className="w-full gap-2" data-testid="button-view-details">
                  View Full Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
