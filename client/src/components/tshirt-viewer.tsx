import React, { Suspense, useEffect } from "react";
import { useGLTF, Html, useFBX, Center } from "@react-three/drei";
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
  console.log("3D_DEBUG: Model component mounted with URL:", url);
  const isFBX = url.toLowerCase().endsWith(".fbx");
  
  let model: any;
  try {
    model = isFBX ? useFBX(url) : useGLTF(url).scene;
    console.log("3D_DEBUG: Model loaded successfully:", { 
      type: isFBX ? "FBX" : "GLTF",
      hasModel: !!model,
      uuid: model?.uuid,
      name: model?.name,
      childrenCount: model?.children?.length
    });
  } catch (err) {
    console.error("3D_DEBUG: Error loading model:", err);
  }
  
  useEffect(() => {
    if (model) {
      console.log("3D_DEBUG: Traversing model for materials...");
      let meshCount = 0;
      model.traverse((child: any) => {
        if (child.isMesh) {
          meshCount++;
          console.log(`3D_DEBUG: Mesh[${meshCount}] found:`, {
            name: child.name,
            geometry: !!child.geometry,
            material: !!child.material,
            visible: child.visible,
            position: child.position,
            scale: child.scale
          });
          if (child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
            child.material.depthTest = true;
            child.material.depthWrite = true;
            if (child.material.color) child.material.color.set(0xffffff);
            child.material.needsUpdate = true;
          }
        }
      });
      console.log("3D_DEBUG: Total meshes found:", meshCount);
    }
  }, [model]);

  if (!model) {
    console.warn("3D_DEBUG: Model is null, rendering nothing");
    return null;
  }

  return (
    <Center>
      <primitive object={model} scale={0.005} />
    </Center>
  );
}

export default function TShirtViewer({ modelUrl }: { modelUrl: string }) {
  console.log("3D_DEBUG: TShirtViewer rendered with modelUrl:", modelUrl);
  
  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <ErrorBoundary fallback={<div className="p-4 text-destructive bg-background h-full flex items-center justify-center">Error rendering 3D model. Check console for details.</div>}>
        <Canvas 
          shadows 
          gl={{ antialias: true, alpha: true, logarithmicDepthBuffer: true }}
          camera={{ position: [0, 0, 10], fov: 35 }}
          onCreated={({ gl, scene }) => {
            console.log("3D_DEBUG: Canvas created", {
              webgl: !!gl.getContext(),
              sceneChildren: scene.children.length
            });
          }}
          onError={(error) => console.error("3D_DEBUG: Canvas error:", error)}
        >
          <DebugCamera />
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <directionalLight position={[-5, 5, 5]} intensity={1.5} />
          <spotLight position={[0, 10, 0]} intensity={1} />
          
          <Suspense fallback={<Html center><div className="text-white bg-black/50 p-2 rounded">Loading 3D Model...</div></Html>}>
            <Model url={modelUrl} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
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
