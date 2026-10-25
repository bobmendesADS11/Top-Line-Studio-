import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Eye, 
  Sparkles, 
  Rotate3d, 
  Maximize2, 
  BookMarked,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export interface Album3DProps {
  pages: string[];
  currentPage: number;
  zoom?: number;
  isOpen?: boolean;
  videoUrl?: string;
  albumSize?: string;
  materialType?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
  purchaseType?: 'LINK' | 'FULL';
  onPageChange?: (page: number) => void;
  onCheckout?: () => void;
}

// ----------------------------------------------------------------------
// High-Resolution Fallback Fine-Art Paper Canvas Generator
// ----------------------------------------------------------------------
function createLuxuryPageTexture(pageNumber: number, title?: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Luxury dark silk/fine-art gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#161617');
    grad.addColorStop(0.5, '#111112');
    grad.addColorStop(1, '#0a0a0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle paper grain
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(rx, ry, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Double Gold Hairline Border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, 924, 924);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(66, 66, 892, 892);

    // Decorative Corner Accents
    const cornerSize = 40;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 3;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(50, 50 + cornerSize);
    ctx.lineTo(50, 50);
    ctx.lineTo(50 + cornerSize, 50);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(1024 - 50 - cornerSize, 50);
    ctx.lineTo(1024 - 50, 50);
    ctx.lineTo(1024 - 50, 50 + cornerSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(50, 1024 - 50 - cornerSize);
    ctx.lineTo(50, 1024 - 50);
    ctx.lineTo(50 + cornerSize, 1024 - 50);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(1024 - 50 - cornerSize, 1024 - 50);
    ctx.lineTo(1024 - 50, 1024 - 50);
    ctx.lineTo(1024 - 50, 1024 - 50 - cornerSize);
    ctx.stroke();

    // Crest Watermark
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.font = 'bold 34px serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOP LINE STUDIO', 512, 480);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '18px sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(title || 'LÂMINA EXCLUSIVA', 512, 530);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.font = 'italic 16px serif';
    ctx.fillText('Registro Oficial de Formatura', 512, 570);

    // Page indicator at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px monospace';
    ctx.fillText(`— ${pageNumber} —`, 512, 940);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// ----------------------------------------------------------------------
// Texture Loader with in-memory caching to prevent black flicker
// ----------------------------------------------------------------------
const textureCache = new Map<string, THREE.Texture>();

export function preloadPageTextures(urls: string[]) {
  if (typeof window === 'undefined') return;
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  urls.forEach((url) => {
    if (!url || textureCache.has(url)) return;
    loader.load(
      url,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 16;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        loaded.generateMipmaps = true;
        loaded.needsUpdate = true;
        textureCache.set(url, loaded);
      },
      undefined,
      () => {}
    );
  });
}

function useBookTexture(url?: string, pageNumber = 1, fallbackTitle?: string): THREE.Texture {
  const cached = url ? textureCache.get(url) : undefined;
  const [texture, setTexture] = useState<THREE.Texture>(() => cached || createLuxuryPageTexture(pageNumber, fallbackTitle));

  const prevUrlRef = useRef(url);
  if (prevUrlRef.current !== url) {
    prevUrlRef.current = url;
    if (url && textureCache.has(url)) {
      const match = textureCache.get(url)!;
      if (texture !== match) {
        setTexture(match);
      }
    }
  }

  useEffect(() => {
    if (!url) {
      setTexture(createLuxuryPageTexture(pageNumber, fallbackTitle));
      return;
    }

    if (textureCache.has(url)) {
      setTexture(textureCache.get(url)!);
      return;
    }

    let isMounted = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      url,
      (loaded) => {
        if (!isMounted) return;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 16;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        loaded.generateMipmaps = true;
        loaded.needsUpdate = true;
        textureCache.set(url, loaded);
        setTexture(loaded);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.warn('Failed to load page texture:', url, err);
        const fallback = createLuxuryPageTexture(pageNumber, fallbackTitle);
        setTexture(fallback);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [url, pageNumber, fallbackTitle]);

  return cached || texture;
}

// ----------------------------------------------------------------------
// Dynamic Turning Leaf Component (Realistic Curved Page Flip)
// ----------------------------------------------------------------------
function TurningLeaf({
  frontTexture,
  backTexture,
  width,
  height,
  progress, // 0 = flat on right, 1 = flat on left
}: {
  frontTexture: THREE.Texture;
  backTexture: THREE.Texture;
  width: number;
  height: number;
  progress: number;
}) {
  // Rotation angle around spine (Y axis at x=0): 0 rad = right, -Math.PI = left
  const angle = -progress * Math.PI;

  // Realistic page lift in mid-air (0 at start and landing, peak in mid-air)
  const lift = Math.sin(progress * Math.PI) * 0.16;

  // Front face geometry with spine anchored at x=0
  const frontGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, 32, 2);
    geom.translate(width / 2, 0, 0);
    return geom;
  }, [width, height]);

  // Back face geometry with spine anchored at x=0 and inverted horizontal UVs
  const backGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(width, height, 32, 2);
    geom.translate(width / 2, 0, 0);
    const uvs = geom.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      uvs.setX(i, 1 - uvs.getX(i));
    }
    uvs.needsUpdate = true;
    return geom;
  }, [width, height]);

  // Dynamic vertex displacement for true physical page curvature along X
  useEffect(() => {
    const archAmount = Math.sin(progress * Math.PI) * 0.22;
    
    // Deform front geometry: inner edge at u=0 is strictly 0 (never detaches from spine)
    const fPos = frontGeometry.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const vx = fPos.getX(i);
      const u = Math.max(0, Math.min(1, vx / width));
      const bend = Math.sin(u * Math.PI);
      fPos.setZ(i, bend * archAmount);
    }
    fPos.needsUpdate = true;
    frontGeometry.computeVertexNormals();

    // Deform back geometry with matching curvature
    const bPos = backGeometry.attributes.position;
    for (let i = 0; i < bPos.count; i++) {
      const vx = bPos.getX(i);
      const u = Math.max(0, Math.min(1, vx / width));
      const bend = Math.sin(u * Math.PI);
      bPos.setZ(i, bend * archAmount);
    }
    bPos.needsUpdate = true;
    backGeometry.computeVertexNormals();
  }, [frontGeometry, backGeometry, progress, width]);

  return (
    <group position={[0, 0, 0.005 + lift]} rotation={[0, angle, 0]}>
      {/* Front Face (visible when on right, facing user) */}
      <mesh
        geometry={frontGeometry}
        position={[0, 0, 0.001]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={frontTexture}
          roughness={0.28}
          metalness={0.02}
          side={THREE.FrontSide}
          toneMapped={true}
        />
      </mesh>

      {/* Back Face (visible when on left, facing user) */}
      <mesh
        geometry={backGeometry}
        position={[0, 0, -0.001]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={backTexture}
          roughness={0.28}
          metalness={0.02}
          side={THREE.BackSide}
          toneMapped={true}
        />
      </mesh>

      {/* Gilded Golden Edge at outer margin (follows leaf edge) */}
      <mesh position={[width, 0, 0]}>
        <boxGeometry args={[0.008, height, 0.004]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------
// 3D Photobook Assembly
// ----------------------------------------------------------------------
function PhotobookModel({
  pages,
  currentPage,
  isOpen = true,
  materialType = 'standard',
  albumSize = '30x30',
  coverTextureUrl,
  onTurnPage
}: {
  pages: string[];
  currentPage: number;
  isOpen: boolean;
  materialType: string;
  albumSize: string;
  coverTextureUrl?: string;
  onTurnPage: (direction: 'next' | 'prev') => void;
}) {
  // Page dimensions
  const { width, height } = useMemo(() => {
    if (albumSize === '20x30') return { width: 3.2, height: 4.8 };
    if (albumSize === '30x40') return { width: 3.8, height: 5.0 };
    return { width: 4.2, height: 4.2 }; // 30x30 square
  }, [albumSize]);

  // Spread calculations
  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const validTargetSpread = Math.min(Math.max(0, currentPage), totalSpreads - 1);

  // Active stationary spread
  const [activeSpread, setActiveSpread] = useState(validTargetSpread);

  // Smooth Leaf Flipping State
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
  const [flipProgress, setFlipProgress] = useState(0);

  useEffect(() => {
    if (validTargetSpread !== activeSpread) {
      if (validTargetSpread > activeSpread) {
        setFlipDirection('forward');
        setFlipProgress(0);
        setIsFlipping(true);
      } else {
        setFlipDirection('backward');
        setFlipProgress(1);
        setIsFlipping(true);
      }
    }
  }, [validTargetSpread, activeSpread]);

  useFrame((_, delta) => {
    if (!isFlipping) return;

    if (flipDirection === 'forward') {
      setFlipProgress((prev) => {
        const speed = 2.4 + Math.sin(prev * Math.PI) * 1.4;
        const next = prev + delta * speed;
        if (next >= 1) {
          setIsFlipping(false);
          setActiveSpread(validTargetSpread);
          return 1;
        }
        return next;
      });
    } else {
      setFlipProgress((prev) => {
        const speed = 2.4 + Math.sin(prev * Math.PI) * 1.4;
        const next = prev - delta * speed;
        if (next <= 0) {
          setIsFlipping(false);
          setActiveSpread(validTargetSpread);
          return 0;
        }
        return next;
      });
    }
  });

  // Current stationary spread textures (physically synced during flip)
  const stationaryLeftUrl = isFlipping
    ? (flipDirection === 'forward' ? pages[activeSpread * 2] : pages[validTargetSpread * 2])
    : pages[activeSpread * 2];

  const stationaryRightUrl = isFlipping
    ? (flipDirection === 'forward' ? pages[validTargetSpread * 2 + 1] : pages[activeSpread * 2 + 1])
    : pages[activeSpread * 2 + 1];

  const leftPageNum = isFlipping
    ? (flipDirection === 'forward' ? activeSpread * 2 + 1 : validTargetSpread * 2 + 1)
    : activeSpread * 2 + 1;

  const rightPageNum = isFlipping
    ? (flipDirection === 'forward' ? validTargetSpread * 2 + 2 : activeSpread * 2 + 2)
    : activeSpread * 2 + 2;

  const leftTexture = useBookTexture(stationaryLeftUrl, leftPageNum, 'Página Esquerda');
  const rightTexture = useBookTexture(stationaryRightUrl, rightPageNum, 'Página Direita');
  const coverTexture = useBookTexture(coverTextureUrl, 1, 'Capa Top Line Studio');

  // Textures for flipping leaf
  const turningFrontUrl = isFlipping
    ? (flipDirection === 'forward' ? pages[activeSpread * 2 + 1] : pages[validTargetSpread * 2 + 1])
    : undefined;

  const turningBackUrl = isFlipping
    ? (flipDirection === 'forward' ? pages[validTargetSpread * 2] : pages[activeSpread * 2])
    : undefined;

  const turningFrontNum = isFlipping
    ? (flipDirection === 'forward' ? activeSpread * 2 + 2 : validTargetSpread * 2 + 2)
    : 0;

  const turningBackNum = isFlipping
    ? (flipDirection === 'forward' ? validTargetSpread * 2 + 1 : activeSpread * 2 + 1)
    : 0;

  const turningFrontTexture = useBookTexture(turningFrontUrl, turningFrontNum, 'Folheando');
  const turningBackTexture = useBookTexture(turningBackUrl, turningBackNum, 'Folheando');

  // Cover finish material
  const coverMaterial = useMemo(() => {
    switch (materialType) {
      case 'leather':
        return new THREE.MeshStandardMaterial({
          color: '#1a130f',
          roughness: 0.65,
          metalness: 0.15
        });
      case 'acrylic':
        return new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          transmission: 0.9,
          roughness: 0.05,
          thickness: 0.6,
          ior: 1.5
        });
      case 'velvet':
        return new THREE.MeshStandardMaterial({
          color: '#120824',
          roughness: 0.95,
          metalness: 0.05
        });
      default:
        return new THREE.MeshStandardMaterial({
          color: '#141416',
          roughness: 0.45,
          metalness: 0.12
        });
    }
  }, [materialType]);

  const coverThickness = 0.06;
  const pageStackThickness = 0.035;

  // Animated cover folding when closing book
  const frontCoverGroupRef = useRef<THREE.Group>(null);
  const targetCoverAngle = isOpen ? -Math.PI : 0;
  const currentCoverAngle = useRef(isOpen ? -Math.PI : 0);

  useFrame((_, delta) => {
    currentCoverAngle.current = THREE.MathUtils.damp(currentCoverAngle.current, targetCoverAngle, 5, delta);
    if (frontCoverGroupRef.current) {
      frontCoverGroupRef.current.rotation.y = currentCoverAngle.current;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ---------------------------------------------------- */}
      {/* HARDCOVER BASE & BINDING (Underneath Spreads)         */}
      {/* ---------------------------------------------------- */}
      <group position={[0, 0, -coverThickness / 2 - pageStackThickness]}>
        {/* Left Base Cover Plate */}
        <mesh position={[-width / 2 - 0.02, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[width + 0.06, height + 0.1, coverThickness]} />
          <primitive object={coverMaterial} attach="material" />
        </mesh>

        {/* Right Base Cover Plate */}
        <mesh position={[width / 2 + 0.02, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[width + 0.06, height + 0.1, coverThickness]} />
          <primitive object={coverMaterial} attach="material" />
        </mesh>

        {/* Central Spine Binding Hinge */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.2, height + 0.1, coverThickness * 1.3]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Gold Headbands at Top and Bottom of Spine */}
        <mesh position={[0, (height + 0.1) / 2 + 0.005, coverThickness * 0.3]}>
          <boxGeometry args={[0.22, 0.02, 0.03]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, -(height + 0.1) / 2 - 0.005, coverThickness * 0.3]}>
          <boxGeometry args={[0.22, 0.02, 0.03]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* ---------------------------------------------------- */}
      {/* GILDED PAGE STACKS (Block of pages under the spread) */}
      {/* ---------------------------------------------------- */}
      <group position={[0, 0, -pageStackThickness / 2]}>
        {/* Left Stack */}
        <mesh position={[-width / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, pageStackThickness]} />
          <meshStandardMaterial color="#faf6ed" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Left Outer Gilded Edge */}
        <mesh position={[-width, 0, 0]}>
          <boxGeometry args={[0.015, height, pageStackThickness]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Right Stack */}
        <mesh position={[width / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, pageStackThickness]} />
          <meshStandardMaterial color="#faf6ed" roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Right Outer Gilded Edge */}
        <mesh position={[width, 0, 0]}>
          <boxGeometry args={[0.015, height, pageStackThickness]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* ---------------------------------------------------- */}
      {/* OPEN SPREAD (Active left & right pages)               */}
      {/* ---------------------------------------------------- */}
      {isOpen && (
        <group position={[0, 0, 0.002]}>
          {/* Stationary Left Spread Page */}
          <mesh
            position={[-width / 2, 0, 0]}
            receiveShadow
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onTurnPage('prev');
            }}
          >
            <planeGeometry args={[width, height, 16, 16]} />
            <meshStandardMaterial
              map={leftTexture}
              roughness={0.28}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Stationary Right Spread Page */}
          <mesh
            position={[width / 2, 0, 0]}
            receiveShadow
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onTurnPage('next');
            }}
          >
            <planeGeometry args={[width, height, 16, 16]} />
            <meshStandardMaterial
              map={rightTexture}
              roughness={0.28}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Realistic Center Spine Crease Shadow (180° Flat Lay) */}
          <mesh position={[0, 0, 0.004]}>
            <planeGeometry args={[0.12, height]} />
            <meshBasicMaterial
              color="#000000"
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>

          {/* Subtle Gutter Highlight Ribs */}
          <mesh position={[-0.03, 0, 0.005]}>
            <planeGeometry args={[0.008, height]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
          </mesh>
          <mesh position={[0.03, 0, 0.005]}>
            <planeGeometry args={[0.008, height]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
          </mesh>

          {/* Animated Turning Leaf during transitions */}
          {isFlipping && (
            <TurningLeaf
              frontTexture={turningFrontTexture}
              backTexture={turningBackTexture}
              width={width}
              height={height}
              progress={flipProgress}
            />
          )}
        </group>
      )}

      {/* ---------------------------------------------------- */}
      {/* FRONT COVER (Only visible when book is CLOSED)       */}
      {/* ---------------------------------------------------- */}
      {!isOpen && (
        <group position={[0, 0, 0.02]}>
          {/* Closed Front Cover sitting directly on top */}
          <mesh position={[width / 2 + 0.02, 0, coverThickness / 2]} castShadow receiveShadow>
            <boxGeometry args={[width + 0.06, height + 0.1, coverThickness]} />
            <primitive object={coverMaterial} attach="material" />
          </mesh>

          {/* Luxury Cover Photo / Embossed Plate */}
          <mesh position={[width / 2 + 0.02, 0, coverThickness + 0.002]}>
            <planeGeometry args={[width * 0.85, height * 0.85]} />
            <meshStandardMaterial
              map={coverTexture}
              color={coverTexture ? '#ffffff' : '#D4AF37'}
              metalness={coverTexture ? 0.05 : 0.85}
              roughness={0.2}
            />
          </mesh>

          {/* Gold Embossed Badge Stamp */}
          <mesh position={[width / 2 + 0.02, -height * 0.35, coverThickness + 0.004]}>
            <planeGeometry args={[width * 0.5, 0.4]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// Main Album3D Component
// ----------------------------------------------------------------------
export default function Album3D(props: Album3DProps) {
  const {
    pages = [],
    currentPage = 0,
    isOpen: initialIsOpen = true,
    albumSize = '30x30',
    materialType = 'standard',
    coverTextureUrl,
    purchaseType = 'FULL',
    onPageChange,
    onCheckout
  } = props;

  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const validCurrentPage = Math.min(Math.max(0, currentPage), totalSpreads - 1);

  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  // Preload all album page textures for instant 60fps transitions
  useEffect(() => {
    if (pages && pages.length > 0) {
      preloadPageTextures(pages);
    }
  }, [pages]);

  // Turn page handler
  const handleTurnPage = useCallback((dir: 'next' | 'prev') => {
    if (!onPageChange) return;
    if (dir === 'next') {
      if (validCurrentPage < totalSpreads - 1) onPageChange(validCurrentPage + 1);
    } else {
      if (validCurrentPage > 0) onPageChange(validCurrentPage - 1);
    }
  }, [validCurrentPage, totalSpreads, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleTurnPage('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handleTurnPage('prev');
      } else if (e.key.toLowerCase() === 'c') {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnPage]);

  // Reset 3D camera
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const leftPageUrl = pages[validCurrentPage * 2];
  const rightPageUrl = pages[validCurrentPage * 2 + 1];

  return (
    <div className="w-full h-full min-h-[550px] md:min-h-[620px] relative select-none bg-gradient-to-b from-[#0d0d0f] via-[#08080a] to-[#030303] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
      
      {/* ---------------------------------------------------- */}
      {/* TOP FLOATING HUD                                      */}
      {/* ---------------------------------------------------- */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Brand Badge */}
        <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl pointer-events-auto shadow-2xl">
          <Sparkles size={14} className="text-brand-gold animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white">
            Top Line Studio 3D
          </span>
          <span className="text-[9px] text-brand-gold/80 font-mono px-2 py-0.5 rounded-full bg-brand-gold/10 border border-brand-gold/20">
            {albumSize}
          </span>
        </div>

        {/* View Controls Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Open/Close Book Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl border text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl ${
              !isOpen 
                ? 'bg-brand-gold text-black border-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-black/75 text-white/80 border-white/10 hover:text-brand-gold hover:border-brand-gold/40'
            }`}
            title="Alternar entre Livro Aberto (180°) e Capa Fechada"
          >
            <BookMarked size={13} />
            <span>{isOpen ? 'Ver Capa' : 'Abrir Álbum'}</span>
          </button>

          {/* Auto-Rotate 360° */}
          {viewMode === '3d' && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl border text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl ${
                autoRotate 
                  ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' 
                  : 'bg-black/75 text-white/80 border-white/10 hover:text-brand-gold hover:border-brand-gold/40'
              }`}
              title="Girar Álbum em 360 Graus"
            >
              <Rotate3d size={13} className={autoRotate ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{autoRotate ? 'Parar Giro' : 'Girar 360°'}</span>
            </button>
          )}

          {/* Reset Camera */}
          {viewMode === '3d' && (
            <button
              onClick={handleResetCamera}
              className="p-2 rounded-xl bg-black/75 backdrop-blur-xl border border-white/10 text-white/80 hover:text-brand-gold hover:border-brand-gold/40 text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl"
              title="Centralizar Câmera"
            >
              <Maximize2 size={13} />
            </button>
          )}

          {/* 3D vs HD Flat Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? 'flat' : '3d')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/75 backdrop-blur-xl border border-white/10 text-white/80 hover:text-brand-gold hover:border-brand-gold/40 text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl"
            title="Alternar entre Visão 3D e Visão Lâmina HD"
          >
            {viewMode === '3d' ? <BookOpen size={13} /> : <Eye size={13} />}
            <span>{viewMode === '3d' ? 'Visão Lâmina HD' : 'Visão 3D Espacial'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3D OR FLAT SPREAD CANVAS                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        {viewMode === '3d' ? (
          <Canvas
            shadows
            camera={{ position: [0, 2.5, 9.2], fov: 40 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
              powerPreference: 'high-performance'
            }}
          >
            {/* Studio Lighting Rig */}
            <ambientLight intensity={0.8} />
            
            {/* Key Light from top-right */}
            <directionalLight
              position={[6, 10, 8]}
              intensity={1.8}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-bias={-0.0001}
            />

            {/* Soft Warm Fill Light from left */}
            <directionalLight
              position={[-6, 5, 5]}
              intensity={0.9}
              color="#fff8ed"
            />

            {/* Warm Gold Rim Light on spine */}
            <pointLight position={[0, -2, 4]} intensity={1.2} color="#D4AF37" distance={10} />

            {/* 3D Photobook Assembly */}
            <PhotobookModel
              pages={pages}
              currentPage={validCurrentPage}
              isOpen={isOpen}
              albumSize={albumSize}
              materialType={materialType}
              coverTextureUrl={coverTextureUrl}
              onTurnPage={handleTurnPage}
            />

            {/* Realistic Contact Shadow on Studio Table */}
            <ContactShadows
              position={[0, -2.5, 0]}
              opacity={0.7}
              scale={18}
              blur={2.8}
              far={5}
              color="#000000"
            />

            <OrbitControls
              ref={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={1.2}
              enablePan={false}
              minDistance={3.5}
              maxDistance={15}
              minPolarAngle={Math.PI / 8}
              maxPolarAngle={Math.PI / 2.05}
              enableDamping={true}
              dampingFactor={0.06}
            />

            <Environment preset="city" />
          </Canvas>
        ) : (
          /* ---------------------------------------------------- */
          /* 2D VISÃO LÂMINA HD (Flat Crystal-Clear Spread)       */
          /* ---------------------------------------------------- */
          <div className="w-full h-full flex items-center justify-center p-6 md:p-12 overflow-hidden bg-black/95">
            <div className="relative max-w-5xl w-full aspect-[2/1] bg-zinc-950 rounded-2xl shadow-[0_20px_100px_rgba(0,0,0,0.95)] border border-white/10 flex overflow-hidden">
              {/* Left Page HD */}
              <div 
                className="w-1/2 h-full border-r border-white/10 relative bg-[#0e0e10] flex items-center justify-center p-3 cursor-pointer group"
                onClick={() => handleTurnPage('prev')}
                title="Clique para voltar para lâmina anterior"
              >
                {leftPageUrl ? (
                  <img
                    src={leftPageUrl}
                    alt={`Página ${validCurrentPage * 2 + 1}`}
                    className="max-w-full max-h-full object-contain rounded shadow-lg group-hover:scale-[1.01] transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500 text-xs uppercase tracking-widest">
                    Página {validCurrentPage * 2 + 1}
                  </div>
                )}
                <div className="absolute bottom-3 left-4 text-[9px] font-mono text-gray-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  #{validCurrentPage * 2 + 1}
                </div>
              </div>

              {/* Right Page HD */}
              <div 
                className="w-1/2 h-full relative bg-[#0e0e10] flex items-center justify-center p-3 cursor-pointer group"
                onClick={() => handleTurnPage('next')}
                title="Clique para avançar para próxima lâmina"
              >
                {rightPageUrl ? (
                  <img
                    src={rightPageUrl}
                    alt={`Página ${validCurrentPage * 2 + 2}`}
                    className="max-w-full max-h-full object-contain rounded shadow-lg group-hover:scale-[1.01] transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500 text-xs uppercase tracking-widest">
                    Página {validCurrentPage * 2 + 2}
                  </div>
                )}
                <div className="absolute bottom-3 right-4 text-[9px] font-mono text-gray-400 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  #{validCurrentPage * 2 + 2}
                </div>
              </div>

              {/* Center Crease Shadow */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 bg-gradient-to-r from-black/50 via-black/85 to-black/50 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* UNIFIED BOTTOM HUD NAVIGATOR                          */}
      {/* ---------------------------------------------------- */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95vw]">
        
        {/* Main Floating Spread Navigator Bar */}
        <div className="flex items-center gap-2 bg-black/90 backdrop-blur-2xl border border-white/10 px-3 py-1.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          {/* Previous Page Button */}
          <button
            onClick={() => handleTurnPage('prev')}
            disabled={validCurrentPage <= 0}
            className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-25 disabled:hover:bg-transparent transition-all"
            title="Lâmina Anterior (Seta Esquerda)"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Current Spread Info */}
          <div className="px-3 text-center min-w-[170px]">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-white flex items-center justify-center gap-1.5">
              <span>Lâmina {validCurrentPage + 1} de {totalSpreads}</span>
            </div>
            <div className="text-[8px] text-brand-gold/80 font-mono tracking-widest">
              Páginas {validCurrentPage * 2 + 1} & {validCurrentPage * 2 + 2}
            </div>
          </div>

          {/* Next Page Button */}
          <button
            onClick={() => handleTurnPage('next')}
            disabled={validCurrentPage >= totalSpreads - 1}
            className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-25 disabled:hover:bg-transparent transition-all"
            title="Próxima Lâmina (Seta Direita)"
          >
            <ChevronRight size={20} />
          </button>

          {/* WhatsApp / Checkout Action if supplied */}
          {onCheckout && (
            <>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button
                onClick={onCheckout}
                className="bg-brand-gold text-black px-4 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-1.5"
              >
                <MessageCircle size={13} />
                <span>{purchaseType === 'LINK' ? 'Contratar Link' : 'Comprar Álbum'}</span>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Dots Bar for Quick Direct Jump */}
        {totalSpreads > 1 && totalSpreads <= 25 && (
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
            {Array.from({ length: totalSpreads }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onPageChange?.(idx)}
                className={`transition-all rounded-full ${
                  idx === validCurrentPage
                    ? 'w-6 h-2 bg-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/50'
                }`}
                title={`Ir para Lâmina ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Helpful Hint Overlay (Subtle) */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-1.5 text-[8px] text-gray-500 font-mono tracking-wider pointer-events-none">
        <HelpCircle size={11} className="text-brand-gold/60" />
        <span>Gire com o mouse • Clique nas páginas para folhear • Teclas ◄ e ►</span>
      </div>
    </div>
  );
}
