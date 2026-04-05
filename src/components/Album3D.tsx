import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, Environment, ContactShadows, Float, PresentationControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Error Boundary for 3D textures
class TextureErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <boxGeometry args={[4, 5.5, 0.05]} />
          <meshStandardMaterial color="#333" />
          <Html center>
            <div className="bg-black/80 text-white p-2 rounded text-[8px] whitespace-nowrap">
              Erro ao carregar imagem
            </div>
          </Html>
        </mesh>
      );
    }
    return this.props.children;
  }
}

function PageContent({ textureUrl, isRightPage, foldAngle = 0 }: { textureUrl: string, isRightPage?: boolean, foldAngle?: number }) {
  const texture = useTexture(textureUrl);
  
  return (
    <group rotation={[0, isRightPage ? -foldAngle : foldAngle, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4, 5.5, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0, 0.03]} castShadow>
        <planeGeometry args={[3.8, 5.3]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
}

interface PageProps {
  textureUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isRightPage?: boolean;
  foldAngle?: number;
}

function Page({ textureUrl, position, rotation, isRightPage, foldAngle = 0 }: PageProps) {
  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={
        <mesh>
          <boxGeometry args={[4, 5.5, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      }>
        <TextureErrorBoundary>
          <PageContent textureUrl={textureUrl} isRightPage={isRightPage} foldAngle={foldAngle} />
        </TextureErrorBoundary>
      </Suspense>
    </group>
  );
}

interface Album3DProps {
  pages: string[];
  currentPage: number;
  zoom?: number;
  isOpen?: boolean;
}

function AlbumContent({ pages, currentPage, zoom, isOpen }: Album3DProps) {
  const leftPageUrl = pages[currentPage * 2] || 'https://picsum.photos/seed/grad1/800/1200';
  const rightPageUrl = pages[currentPage * 2 + 1] || 'https://picsum.photos/seed/grad2/800/1200';
  
  const groupRef = useRef<THREE.Group>(null);
  const [fold, setFold] = useState(Math.PI / 2); // Start closed

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(zoom, zoom, zoom), 0.1);
    }
    
    // Animate opening/closing
    const targetFold = isOpen ? 0 : Math.PI / 2;
    const nextFold = THREE.MathUtils.lerp(fold, targetFold, 0.05);
    if (Math.abs(nextFold - fold) > 0.001) {
      setFold(nextFold);
    }
  });

  return (
    <PresentationControls
      global
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 3, Math.PI / 3]}
      azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
    >
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group ref={groupRef} rotation={[0.2, 0, 0]}>
          {/* Left Page */}
          <Page 
            textureUrl={leftPageUrl} 
            position={[-2.05, 0, 0]} 
            rotation={[0, 0, 0]} 
            foldAngle={fold}
          />
          {/* Right Page */}
          <Page 
            textureUrl={rightPageUrl} 
            position={[2.05, 0, 0]} 
            rotation={[0, 0, 0]} 
            isRightPage
            foldAngle={fold}
          />
          
          {/* Spine */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[0.1, 5.5, 0.15]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </Float>
    </PresentationControls>
  );
}

export default function Album3D(props: Album3DProps) {
  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px]">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <AlbumContent {...props} />

        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
