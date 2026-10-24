import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Eye, Sparkles } from 'lucide-react';

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
  onPageChange?: (page: number) => void;
}

// Fallback texture generator for canvas
function createFallbackTexture(text: string, subtext?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dark luxury gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#161616');
    grad.addColorStop(0.5, '#0d0d0d');
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Gold border line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, 944, 944);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 904, 904);

    // Text
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOP LINE STUDIO', 512, 480);

    ctx.fillStyle = '#888888';
    ctx.font = '24px sans-serif';
    ctx.fillText(text, 512, 540);

    if (subtext) {
      ctx.fillStyle = '#555555';
      ctx.font = '18px sans-serif';
      ctx.fillText(subtext, 512, 580);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

// Custom hook to load texture safely without throwing or hanging Suspense
function useSafeTexture(url?: string, fallbackLabel = 'Página'): THREE.Texture {
  const [texture, setTexture] = useState<THREE.Texture>(() => createFallbackTexture(fallbackLabel));

  useEffect(() => {
    if (!url) {
      setTexture(createFallbackTexture(fallbackLabel));
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      url,
      (loadedTexture) => {
        if (!isMounted) return;
        loadedTexture.anisotropy = 16;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = true;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.warn('Failed to load texture for 3D page:', url, err);
        setTexture(createFallbackTexture(fallbackLabel, 'Registro Top Line'));
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url, fallbackLabel]);

  return texture;
}

// Single Page Surface
function PageMesh({
  texture,
  width,
  height,
  side = 'right',
  materialType = 'standard'
}: {
  texture: THREE.Texture;
  width: number;
  height: number;
  side: 'left' | 'right';
  materialType?: string;
}) {
  return (
    <mesh position={[side === 'right' ? width / 2 : -width / 2, 0, 0]} receiveShadow castShadow>
      <planeGeometry args={[width, height, 16, 16]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.25}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Turning Leaf with front and back textures
function FlippingLeaf({
  frontTexture,
  backTexture,
  width,
  height,
  progress, // 0 (flat on right) to 1 (flat on left)
}: {
  frontTexture: THREE.Texture;
  backTexture: THREE.Texture;
  width: number;
  height: number;
  progress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Rotation angle around the spine (Y axis at x=0)
  // 0 rad = right side; -Math.PI rad = left side
  const angle = -progress * Math.PI;

  // Gentle bend along page curl
  const curlAngle = Math.sin(progress * Math.PI) * 0.15;

  return (
    <group ref={groupRef} rotation={[0, angle, 0]} position={[0, 0, 0.03]}>
      {/* Front Face (visible when on the right, facing up) */}
      <mesh position={[width / 2, 0, 0.002]} rotation={[0, 0, curlAngle]} castShadow receiveShadow>
        <planeGeometry args={[width, height, 8, 8]} />
        <meshStandardMaterial
          map={frontTexture}
          roughness={0.25}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Back Face (visible when on the left, facing up) */}
      <mesh position={[width / 2, 0, -0.002]} rotation={[0, Math.PI, -curlAngle]} castShadow receiveShadow>
        <planeGeometry args={[width, height, 8, 8]} />
        <meshStandardMaterial
          map={backTexture}
          roughness={0.25}
          metalness={0.05}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Page Thickness Core */}
      <mesh position={[width / 2, 0, 0]}>
        <boxGeometry args={[width, height, 0.003]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Book Spine and Luxury Cover
function BookCover({
  width,
  height,
  materialType = 'standard',
  isOpen,
  coverTexture
}: {
  width: number;
  height: number;
  materialType: string;
  isOpen: boolean;
  coverTexture?: THREE.Texture;
}) {
  const frontCoverRef = useRef<THREE.Group>(null);
  const targetCoverAngle = isOpen ? -Math.PI : 0;
  const currentAngle = useRef(isOpen ? -Math.PI : 0);

  useFrame((_, delta) => {
    currentAngle.current = THREE.MathUtils.damp(currentAngle.current, targetCoverAngle, 4, delta);
    if (frontCoverRef.current) {
      frontCoverRef.current.rotation.y = currentAngle.current;
    }
  });

  const coverMaterial = useMemo(() => {
    switch (materialType) {
      case 'leather':
        return new THREE.MeshStandardMaterial({
          color: '#1a1412',
          roughness: 0.8,
          metalness: 0.15
        });
      case 'acrylic':
        return new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          transmission: 0.9,
          roughness: 0.05,
          thickness: 0.8,
          ior: 1.5
        });
      case 'velvet':
        return new THREE.MeshStandardMaterial({
          color: '#1a0b2e',
          roughness: 0.95,
          metalness: 0
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: '#141414',
          roughness: 0.4,
          metalness: 0.2
        });
    }
  }, [materialType]);

  const coverThickness = 0.08;

  return (
    <group position={[0, 0, -0.05]}>
      {/* Back Cover (Left stationary base) */}
      <mesh position={[-width / 2 - 0.02, 0, -0.02]} receiveShadow castShadow>
        <boxGeometry args={[width + 0.08, height + 0.12, coverThickness]} />
        <primitive object={coverMaterial} attach="material" />
      </mesh>

      {/* Book Spine */}
      <mesh position={[0, 0, -0.01]} castShadow>
        <boxGeometry args={[0.22, height + 0.12, coverThickness * 1.5]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Front Cover (Hinged at spine) */}
      <group ref={frontCoverRef} position={[0, 0, 0.05]}>
        <mesh position={[width / 2 + 0.02, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.08, height + 0.12, coverThickness]} />
          <primitive object={coverMaterial} attach="material" />
        </mesh>

        {/* Cover Plate / Gold Logo Stamp */}
        <mesh position={[width / 2 + 0.02, 0, coverThickness / 2 + 0.002]}>
          <planeGeometry args={[width * 0.7, height * 0.5]} />
          <meshStandardMaterial
            map={coverTexture}
            color={coverTexture ? '#ffffff' : '#D4AF37'}
            metalness={coverTexture ? 0.1 : 0.8}
            roughness={coverTexture ? 0.2 : 0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

// Main 3D Book Scene
function BookScene({
  pages,
  currentPage,
  zoom = 1,
  isOpen = true,
  albumSize = '30x30',
  materialType = 'standard',
  coverTextureUrl
}: Album3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Compute page dimensions in 3D units based on selected albumSize
  const { width, height } = useMemo(() => {
    if (albumSize === '20x30') return { width: 3.2, height: 4.8 };
    if (albumSize === '30x40') return { width: 3.8, height: 5.0 };
    return { width: 4.2, height: 4.2 }; // 30x30 square
  }, [albumSize]);

  // Page index management
  // Spread K represents left page: K*2, right page: K*2 + 1
  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const validCurrentPage = Math.min(Math.max(0, currentPage), totalSpreads - 1);

  // Animated turning leaf state
  const [flippingDirection, setFlippingDirection] = useState<'forward' | 'backward' | null>(null);
  const [flipProgress, setFlipProgress] = useState(0);
  const prevPageRef = useRef(validCurrentPage);

  useEffect(() => {
    if (validCurrentPage > prevPageRef.current) {
      setFlippingDirection('forward');
      setFlipProgress(0);
    } else if (validCurrentPage < prevPageRef.current) {
      setFlippingDirection('backward');
      setFlipProgress(1);
    }
    prevPageRef.current = validCurrentPage;
  }, [validCurrentPage]);

  // Animate flip progress smoothly
  useFrame((_, delta) => {
    if (flippingDirection === 'forward') {
      setFlipProgress((prev) => {
        const next = prev + delta * 2.8;
        if (next >= 1) {
          setFlippingDirection(null);
          return 1;
        }
        return next;
      });
    } else if (flippingDirection === 'backward') {
      setFlipProgress((prev) => {
        const next = prev - delta * 2.8;
        if (next <= 0) {
          setFlippingDirection(null);
          return 0;
        }
        return next;
      });
    }
  });

  // Current stationary spread textures
  const leftPageUrl = pages[validCurrentPage * 2];
  const rightPageUrl = pages[validCurrentPage * 2 + 1];

  const leftTexture = useSafeTexture(leftPageUrl, `Página ${validCurrentPage * 2 + 1}`);
  const rightTexture = useSafeTexture(rightPageUrl, `Página ${validCurrentPage * 2 + 2}`);
  const coverTexture = useSafeTexture(coverTextureUrl, 'Capa Top Line Studio');

  // Textures for turning leaf
  const turningFrontUrl = flippingDirection === 'forward' 
    ? pages[(validCurrentPage - 1) * 2 + 1] 
    : pages[validCurrentPage * 2 + 1];

  const turningBackUrl = flippingDirection === 'forward'
    ? pages[validCurrentPage * 2]
    : pages[(validCurrentPage + 1) * 2];

  const turningFrontTexture = useSafeTexture(turningFrontUrl, 'Folheando');
  const turningBackTexture = useSafeTexture(turningBackUrl, 'Folheando');

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={14}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping={true}
        dampingFactor={0.08}
      />

      <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.15}>
        <group ref={groupRef} scale={[zoom, zoom, zoom]}>
          {/* Book Hardcover Base */}
          <BookCover
            width={width}
            height={height}
            materialType={materialType}
            isOpen={isOpen}
            coverTexture={coverTexture}
          />

          {/* If book is open, show spreads */}
          {isOpen && (
            <group position={[0, 0, 0.02]}>
              {/* Stationary Left Spread Page */}
              <PageMesh
                texture={leftTexture}
                width={width}
                height={height}
                side="left"
                materialType={materialType}
              />

              {/* Stationary Right Spread Page */}
              <PageMesh
                texture={rightTexture}
                width={width}
                height={height}
                side="right"
                materialType={materialType}
              />

              {/* Animated Flipping Leaf during page transitions */}
              {flippingDirection !== null && (
                <FlippingLeaf
                  frontTexture={turningFrontTexture}
                  backTexture={turningBackTexture}
                  width={width}
                  height={height}
                  progress={flipProgress}
                />
              )}
            </group>
          )}
        </group>
      </Float>
    </>
  );
}

export default function Album3D(props: Album3DProps) {
  const { pages = [], currentPage = 0, onPageChange } = props;
  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!onPageChange) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (currentPage < totalSpreads - 1) onPageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 0) onPageChange(currentPage - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalSpreads, onPageChange]);

  const leftPageUrl = pages[currentPage * 2];
  const rightPageUrl = pages[currentPage * 2 + 1];

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] relative select-none bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-black rounded-3xl overflow-hidden flex flex-col">
      {/* Top HUD Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl pointer-events-auto shadow-2xl">
          <Sparkles size={14} className="text-brand-gold animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/80">
            Top Line Studio 3D
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setViewMode(viewMode === '3d' ? 'flat' : '3d')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 text-white/80 hover:text-brand-gold hover:border-brand-gold/40 text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl"
            title="Alternar modo de visualização"
          >
            {viewMode === '3d' ? <BookOpen size={14} /> : <Eye size={14} />}
            <span>{viewMode === '3d' ? 'Visão Lâmina HD' : 'Visão 3D Espacial'}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === '3d' ? (
          <Canvas
            shadows
            camera={{ position: [0, 2, 8.5], fov: 42 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
              powerPreference: 'high-performance'
            }}
          >
            <ambientLight intensity={0.6} />
            <spotLight
              position={[8, 12, 10]}
              angle={0.45}
              penumbra={1}
              intensity={2.2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-8, -4, 6]} intensity={0.8} color="#D4AF37" />

            <BookScene {...props} />

            <ContactShadows
              position={[0, -2.8, 0]}
              opacity={0.6}
              scale={16}
              blur={2.5}
              far={4.5}
              color="#000000"
            />
            <Environment preset="city" />
          </Canvas>
        ) : (
          /* HD Flat Spread Mode */
          <div className="w-full h-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
            <div className="relative max-w-5xl w-full aspect-[2/1] bg-black rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.9)] border border-white/10 flex overflow-hidden">
              {/* Left Page */}
              <div className="w-1/2 h-full border-r border-white/5 relative bg-zinc-950 flex items-center justify-center p-2">
                {leftPageUrl ? (
                  <img src={leftPageUrl} alt="Lado Esquerdo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center p-6 text-gray-600 text-xs uppercase tracking-widest">
                    Página {currentPage * 2 + 1}
                  </div>
                )}
                <div className="absolute bottom-3 left-4 text-[9px] font-mono text-gray-500">
                  #{currentPage * 2 + 1}
                </div>
              </div>

              {/* Right Page */}
              <div className="w-1/2 h-full relative bg-zinc-950 flex items-center justify-center p-2">
                {rightPageUrl ? (
                  <img src={rightPageUrl} alt="Lado Direito" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center p-6 text-gray-600 text-xs uppercase tracking-widest">
                    Página {currentPage * 2 + 2}
                  </div>
                )}
                <div className="absolute bottom-3 right-4 text-[9px] font-mono text-gray-500">
                  #{currentPage * 2 + 2}
                </div>
              </div>

              {/* Subtle Book Crease Shadow */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/40 via-black/80 to-black/40 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-black/85 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
        <button
          onClick={() => onPageChange?.(Math.max(0, currentPage - 1))}
          disabled={currentPage <= 0}
          className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Página Anterior (Seta Esquerda)"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="px-3 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-white">
            Lâmina {currentPage + 1} de {totalSpreads}
          </div>
          <div className="text-[8px] text-gray-400 font-mono tracking-widest">
            Páginas {currentPage * 2 + 1} & {currentPage * 2 + 2}
          </div>
        </div>

        <button
          onClick={() => onPageChange?.(Math.min(totalSpreads - 1, currentPage + 1))}
          disabled={currentPage >= totalSpreads - 1}
          className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Próxima Página (Seta Direita)"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
