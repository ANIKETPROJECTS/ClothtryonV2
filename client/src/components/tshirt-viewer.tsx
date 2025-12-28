import React, { Suspense } from "react";
import { useGLTF, Stage, PresentationControls, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function Model({ url }: { url: string }) {
  console.log("Loading model from URL:", url);
  const { scene } = useGLTF(url);
  console.log("Model scene loaded:", !!scene);
  
  if (!scene) {
    console.warn("Model scene is empty or failed to load");
    return null;
  }

  return <primitive object={scene} scale={2} position={[0, -1.5, 0]} />;
}

export default function TShirtViewer({ modelUrl }: { modelUrl: string }) {
  console.log("TShirtViewer rendered with modelUrl:", modelUrl);
  return (
    <div className="w-full h-[500px] bg-muted/30 rounded-lg overflow-hidden relative">
      <ErrorBoundary fallback={<div className="p-4 text-destructive">Error rendering 3D model. Check console for details.</div>}>
        <Canvas 
          shadows 
          camera={{ position: [0, 0, 4], fov: 45 }}
          onCreated={({ gl }) => {
            console.log("Canvas created with WebGL context:", gl.getContext());
          }}
          onError={(error) => console.error("Canvas error:", error)}
        >
          <Suspense fallback={<Html center>Loading 3D Model...</Html>}>
            <Stage environment="city" intensity={0.6}>
              <PresentationControls
                global
                zoom={0.8}
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 4, Math.PI / 4]}
                azimuth={[-Math.PI / 4, Math.PI / 4]}
              >
                <Model url={modelUrl} />
              </PresentationControls>
            </Stage>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error("3D Render Error:", error, info); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
