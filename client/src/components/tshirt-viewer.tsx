import React, { Suspense, useEffect } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";

function DebugCamera() {
  const { camera } = useThree();
  useEffect(() => {
    console.log("3D_DEBUG: Camera Settings:", {
      position: camera.position,
      rotation: camera.rotation,
      fov: (camera as any).fov,
      near: camera.near,
      far: camera.far
    });
  }, [camera]);
  return null;
}

function Model({ url }: { url: string }) {
  console.log("3D_DEBUG: Loading model from URL:", url);
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    if (scene) {
      console.log("3D_DEBUG: Model scene object:", scene);
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          console.log("3D_DEBUG: Mesh found:", child.name);
          const mesh = child as any;
          if (mesh.material) {
            mesh.material.transparent = false;
            mesh.material.opacity = 1;
            mesh.material.depthTest = true;
            mesh.material.depthWrite = true;
            mesh.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  if (!scene) return null;

  return <primitive object={scene} scale={2} position={[0, -1.5, 0]} />;
}

export default function TShirtViewer({ modelUrl }: { modelUrl: string }) {
  console.log("3D_DEBUG: TShirtViewer rendered with modelUrl:", modelUrl);
  
  return (
    <div className="w-full h-[500px] bg-[#111] rounded-lg overflow-hidden relative border-2 border-primary/20">
      <ErrorBoundary fallback={<div className="p-4 text-destructive bg-background h-full flex items-center justify-center">Error rendering 3D model. Check console for details.</div>}>
        <Canvas 
          shadows 
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 5], fov: 50 }}
          onCreated={({ gl, scene }) => {
            console.log("3D_DEBUG: Canvas created", {
              webgl: !!gl.getContext(),
              sceneChildren: scene.children.length
            });
          }}
          onError={(error) => console.error("3D_DEBUG: Canvas error:", error)}
        >
          <DebugCamera />
          <ambientLight intensity={2} />
          <pointLight position={[10, 10, 10]} intensity={2.5} />
          <directionalLight position={[-5, 5, 5]} intensity={1.5} />
          
          <Suspense fallback={<Html center><div className="text-white bg-black/50 p-2 rounded">Loading 3D Model...</div></Html>}>
            <Model url={modelUrl} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <div className="absolute bottom-4 left-4 text-xs text-white bg-black/50 px-2 py-1 rounded">
        {modelUrl ? "3D Model Active" : "No Model Found"}
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
  componentDidCatch(error: any, info: any) { console.error("3D_DEBUG: Render Error:", error, info); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
