import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture, Environment, ContactShadows, Float, OrbitControls, Html, useVideoTexture } from '@react-three/drei';
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
              Erro ao carregar mídia
            </div>
          </Html>
        </mesh>
      );
    }
    return this.props.children;
  }
}

function VideoContent({ videoUrl }: { videoUrl: string }) {
  const texture = useVideoTexture(videoUrl, {
    unsuspend: 'canplay',
    muted: true,
    loop: true,
    start: true,
  });
  
  return (
    <mesh position={[0, 0, 0.03]} castShadow>
      <planeGeometry args={[3.8, 5.3]} />
      <meshStandardMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function PageContent({ 
  textureUrl, 
  videoUrl,
  isRightPage, 
  foldAngle = 0,
  materialType = 'standard',
  customMaterialProps,
  coverTextureUrl,
  isCover = false
}: { 
  textureUrl?: string, 
  videoUrl?: string,
  isRightPage?: boolean, 
  foldAngle?: number,
  materialType?: string,
  customMaterialProps?: any,
  coverTextureUrl?: string,
  isCover?: boolean
}) {
  const texture = textureUrl ? useTexture(textureUrl) : null;
  const coverTexture = coverTextureUrl ? useTexture(coverTextureUrl) : null;
  
  // Load leather normal map for realism
  const leatherNormal = useTexture('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/leather/leather_normal.jpg');
  if (leatherNormal) {
    leatherNormal.wrapS = leatherNormal.wrapT = THREE.RepeatWrapping;
    leatherNormal.repeat.set(2, 2);
  }

  // Base materials with realistic properties
  const materialProps = useMemo(() => {
    if (customMaterialProps) return customMaterialProps;

    switch (materialType) {
      case 'leather':
        return { 
          color: '#121212', 
          roughness: 0.7, 
          metalness: 0.1,
          normalMap: leatherNormal,
          normalScale: new THREE.Vector2(0.5, 0.5),
          clearcoat: 0.1,
          clearcoatRoughness: 0.3
        };
      case 'acrylic':
        return { 
          color: '#ffffff', 
          transmission: 0.95,
          thickness: 1.5,
          roughness: 0.02, 
          metalness: 0,
          ior: 1.5,
          transparent: true,
          opacity: 1,
          envMapIntensity: 2
        };
      case 'velvet':
        return {
          color: '#1a0a2a',
          roughness: 0.9,
          metalness: 0,
          sheen: 1,
          sheenColor: new THREE.Color('#ffffff'),
          sheenRoughness: 0.8
        };
      case 'photo':
        return {
          color: '#ffffff',
          roughness: 0.2,
          metalness: 0.05,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1
        };
      default:
        return { 
          color: '#1a1a1a', 
          roughness: 0.6, 
          metalness: 0.1 
        };
    }
  }, [materialType, customMaterialProps, leatherNormal]);

  // Page stack to simulate depth
  const pageStack = useMemo(() => {
    const stack = [];
    const numPages = 5;
    const spacing = 0.01;
    for (let i = 0; i < numPages; i++) {
      stack.push(
        <mesh key={i} position={[0, 0, -i * spacing]} receiveShadow>
          <boxGeometry args={[4, 5.5, 0.01]} />
          <meshStandardMaterial color="#fff" roughness={0.8} />
        </mesh>
      );
    }
    return stack;
  }, []);

  return (
    <group rotation={[0, isRightPage ? -foldAngle : foldAngle, 0]}>
      {/* The main page/cover body */}
      <mesh castShadow receiveShadow position={[isRightPage ? 2 : -2, 0, 0]}>
        <boxGeometry args={[4, 5.5, isCover ? 0.15 : 0.05]} />
        <meshPhysicalMaterial 
          {...materialProps} 
          map={isCover && materialType === 'photo' ? coverTexture : null} 
        />
      </mesh>
      
      {/* Internal Page Stack (only if not cover or when open) */}
      {!isCover && (
        <group position={[isRightPage ? 2 : -2, 0, 0.03]}>
          {pageStack}
        </group>
      )}

      {/* Content (Photo or Video) */}
      {videoUrl ? (
        <group position={[isRightPage ? 2 : -2, 0, 0.04]}>
          <VideoContent videoUrl={videoUrl} />
        </group>
      ) : texture && (
        <mesh position={[isRightPage ? 2 : -2, 0, 0.04]} castShadow>
          <planeGeometry args={[3.8, 5.3]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}
    </group>
  );
}

interface PageProps {
  textureUrl?: string;
  videoUrl?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isRightPage?: boolean;
  foldAngle?: number;
  materialType?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
  isCover?: boolean;
}

function Page({ textureUrl, videoUrl, position, rotation, isRightPage, foldAngle = 0, materialType, customMaterialProps, coverTextureUrl, isCover }: PageProps) {
  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={
        <mesh position={[isRightPage ? 2 : -2, 0, 0]}>
          <boxGeometry args={[4, 5.5, 0.05]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      }>
        <TextureErrorBoundary>
          <PageContent 
            textureUrl={textureUrl} 
            videoUrl={videoUrl}
            isRightPage={isRightPage} 
            foldAngle={foldAngle} 
            materialType={materialType}
            customMaterialProps={customMaterialProps}
            coverTextureUrl={coverTextureUrl}
            isCover={isCover}
          />
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
  videoUrl?: string;
  materialType?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
}

function AlbumContent({ pages, currentPage, zoom = 1, isOpen, videoUrl, materialType = 'standard', customMaterialProps, coverTextureUrl }: Album3DProps) {
  const leftPageUrl = pages[currentPage * 2];
  const rightPageUrl = pages[currentPage * 2 + 1];
  
  // If it's the first page and we have a videoUrl, use it for the left page
  const isFirstPage = currentPage === 0;
  const currentVideoUrl = isFirstPage ? videoUrl : undefined;

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
    <>
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={15} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5} 
      />
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <group ref={groupRef} rotation={[0, 0, 0]}>
          {/* Back Cover */}
          <Page 
            position={[0, 0, -0.1]} 
            rotation={[0, 0, 0]} 
            foldAngle={fold}
            materialType={materialType}
            customMaterialProps={customMaterialProps}
            isCover
          />
          
          {/* Left Page */}
          <Page 
            textureUrl={leftPageUrl} 
            videoUrl={currentVideoUrl}
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            foldAngle={fold}
            materialType={materialType}
            customMaterialProps={customMaterialProps}
          />
          
          {/* Right Page */}
          <Page 
            textureUrl={rightPageUrl} 
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            isRightPage
            foldAngle={fold}
            materialType={materialType}
            customMaterialProps={customMaterialProps}
          />

          {/* Front Cover */}
          <Page 
            position={[0, 0, 0.1]} 
            rotation={[0, 0, 0]} 
            isRightPage
            foldAngle={fold}
            materialType={materialType}
            customMaterialProps={customMaterialProps}
            coverTextureUrl={coverTextureUrl}
            isCover
          />
          
          {/* Spine */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 5.5, 0.25]} />
            <meshStandardMaterial 
              color={materialType === 'standard' ? "#D4AF37" : "#111"} 
              metalness={0.8} 
              roughness={0.2} 
            />
          </mesh>
        </group>
      </Float>
    </>
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
