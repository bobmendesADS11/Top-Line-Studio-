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

function VideoContent({ videoUrl, width, height }: { videoUrl: string, width: number, height: number }) {
  const texture = useVideoTexture(videoUrl, {
    unsuspend: 'canplay',
    muted: true,
    loop: true,
    start: true,
  });
  
  return (
    <mesh position={[0, 0, 0]} castShadow>
      <planeGeometry args={[width, height]} />
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
  albumSize = '30x30',
  customMaterialProps,
  coverTextureUrl,
  isCover = false
}: { 
  textureUrl?: string, 
  videoUrl?: string,
  isRightPage?: boolean, 
  foldAngle?: number,
  materialType?: string,
  albumSize?: string,
  customMaterialProps?: any,
  coverTextureUrl?: string,
  isCover?: boolean
}) {
  const texture = textureUrl ? useTexture(textureUrl) : null;
  const coverTexture = coverTextureUrl ? useTexture(coverTextureUrl) : null;

  useMemo(() => {
    if (texture) {
      texture.anisotropy = 16;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
    }
    if (coverTexture) {
      coverTexture.anisotropy = 16;
      coverTexture.minFilter = THREE.LinearMipmapLinearFilter;
      coverTexture.magFilter = THREE.LinearFilter;
      coverTexture.needsUpdate = true;
    }
  }, [texture, coverTexture]);
  
  // Base materials with realistic properties
  const materialProps = useMemo(() => {
    if (customMaterialProps) return customMaterialProps;

    switch (materialType) {
      case 'leather':
        return { 
          color: '#080808', 
          roughness: 0.85, 
          metalness: 0.2,
          clearcoat: 0.2,
          clearcoatRoughness: 0.4
        };
      case 'acrylic':
        return { 
          color: '#ffffff', 
          transmission: 0.98,
          thickness: 1.5,
          roughness: 0.01, 
          metalness: 0,
          ior: 1.52,
          transparent: true,
          opacity: 1,
          envMapIntensity: 2.5
        };
      case 'velvet':
        return {
          color: '#120520',
          roughness: 0.95,
          metalness: 0,
          sheen: 1,
          sheenColor: new THREE.Color('#331144'),
          sheenRoughness: 0.9
        };
      case 'photo':
        return {
          color: '#ffffff',
          roughness: 0.15,
          metalness: 0,
          clearcoat: 0.6,
          clearcoatRoughness: 0.05
        };
      default:
        return { 
          color: '#121212', 
          roughness: 0.5, 
          metalness: 0.05 
        };
    }
  }, [materialType, customMaterialProps]);

  // Page stack to simulate depth with high-quality paper feel
  const pageStack = useMemo(() => {
    const stack = [];
    const numPages = 15; // More pages for thicker feel
    const spacing = 0.004;
    const width = albumSize === '30x30' ? 5 : albumSize === '20x30' ? 3.33 : 3.75;
    for (let i = 1; i <= numPages; i++) {
      stack.push(
        <mesh key={i} position={[0, 0, -i * spacing]} receiveShadow>
          <boxGeometry args={[width, 5, 0.005]} />
          <meshPhysicalMaterial 
            color="#ffffff" 
            roughness={0.8} 
            metalness={0}
            clearcoat={0.1}
          />
        </mesh>
      );
    }
    return stack;
  }, [albumSize]);

  const pageArgs = useMemo(() => {
    const width = albumSize === '30x30' ? 5 : albumSize === '20x30' ? 3.33 : 3.75;
    return [width, 5, 0.05];
  }, [albumSize]);

  return (
    <group rotation={[0, isRightPage ? -foldAngle : foldAngle, 0]}>
      {/* The main page/cover body */}
      <mesh castShadow receiveShadow position={[isRightPage ? pageArgs[0] / 2 : -pageArgs[0] / 2, 0, 0]}>
        <boxGeometry args={pageArgs as [number, number, number]} />
        <meshPhysicalMaterial 
          {...materialProps} 
          map={isCover && materialType === 'photo' ? coverTexture : null} 
        />
      </mesh>
      
      {/* Internal Page Stack (only if not cover) */}
      {!isCover && (
        <group position={[isRightPage ? pageArgs[0] / 2 : -pageArgs[0] / 2, 0, 0.02]}>
          {pageStack}
        </group>
      )}

      {/* Content (Photo or Video) */}
      {videoUrl ? (
        <group position={[isRightPage ? pageArgs[0] / 2 : -pageArgs[0] / 2, 0, 0.04]}>
          <VideoContent videoUrl={videoUrl} width={pageArgs[0] * 0.98} height={pageArgs[1] * 0.98} />
        </group>
      ) : texture && (
        <mesh 
          position={[isRightPage ? pageArgs[0] / 2 : -pageArgs[0] / 2, 0, 0.04]} 
          castShadow 
          rotation={[0, 0, 0]}
        >
          <planeGeometry args={[pageArgs[0] * 0.98, pageArgs[1] * 0.98]} />
          <meshPhysicalMaterial 
            map={texture} 
            roughness={0.2} 
            metalness={0.05}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
            reflectivity={0.5}
          />
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
  albumSize?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
  isCover?: boolean;
}

function Page({ textureUrl, videoUrl, position, rotation, isRightPage, foldAngle = 0, materialType, albumSize, customMaterialProps, coverTextureUrl, isCover }: PageProps) {
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
            albumSize={albumSize}
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
  albumSize?: string;
  materialType?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
}

function AlbumContent({ pages, currentPage, zoom = 1, isOpen, videoUrl, albumSize = '30x30', materialType = 'standard', customMaterialProps, coverTextureUrl }: Album3DProps) {
  const leftPageUrl = pages[currentPage * 2];
  const rightPageUrl = pages[currentPage * 2 + 1];
  
  // If it's the first page and we have a videoUrl, use it for the left page
  const isFirstPage = currentPage === 0;
  const currentVideoUrl = isFirstPage ? videoUrl : undefined;

  const groupRef = useRef<THREE.Group>(null);
  const [fold, setFold] = useState(0); // Start open

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(zoom, zoom, zoom), 0.1);
    }
    
    // Animate opening/closing
    const targetFold = isOpen ? 0 : Math.PI / 1.1;
    const nextFold = THREE.MathUtils.lerp(fold, targetFold, 0.05);
    if (Math.abs(nextFold - fold) > 0.001) {
      setFold(nextFold);
    }
  });

  return (
    <>
      <OrbitControls 
        enablePan={false} 
        minDistance={3} 
        maxDistance={12} 
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
      />
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <group ref={groupRef} position={[0, 0, 0]}>
          {/* Back Cover - stays behind */}
          <Page 
            position={[0, 0, -0.2]} 
            rotation={[0, 0, 0]} 
            foldAngle={Math.max(0, fold - 0.1)}
            materialType={materialType}
            albumSize={albumSize}
            customMaterialProps={customMaterialProps}
            isCover
          />
          
          {/* Left Page content */}
          <Page 
            textureUrl={leftPageUrl} 
            videoUrl={currentVideoUrl}
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            foldAngle={fold}
            materialType={materialType}
            albumSize={albumSize}
            customMaterialProps={customMaterialProps}
          />
          
          {/* Right Page content */}
          <Page 
            textureUrl={rightPageUrl} 
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            isRightPage
            foldAngle={fold}
            materialType={materialType}
            albumSize={albumSize}
            customMaterialProps={customMaterialProps}
          />

          {/* Front Cover - folds with pages */}
          <Page 
            position={[0, 0, 0.2]} 
            rotation={[0, 0, 0]} 
            isRightPage
            foldAngle={Math.max(0, fold - 0.1)}
            materialType={materialType}
            albumSize={albumSize}
            customMaterialProps={customMaterialProps}
            coverTextureUrl={coverTextureUrl}
            isCover
          />
          
          {/* Spine - center logic */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.2, albumSize === '20x30' ? 5 : 5, 0.4]} />
            <meshStandardMaterial 
              color={materialType === 'standard' ? "#D4AF37" : "#111"} 
              metalness={0.9} 
              roughness={0.1} 
            />
          </mesh>
        </group>
      </Float>
    </>
  );
}

export default function Album3D(props: Album3DProps) {
  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] cursor-grab active:cursor-grabbing">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -5, 5]} intensity={0.5} color="#D4AF37" />
        
        <AlbumContent {...props} />

        <ContactShadows 
          position={[0, -3.5, 0]} 
          opacity={0.4} 
          scale={20} 
          blur={2} 
          far={4.5} 
          color="#000000" 
        />
        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
