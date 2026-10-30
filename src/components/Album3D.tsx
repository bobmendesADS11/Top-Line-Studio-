import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Lightformer, Html, useProgress } from '@react-three/drei';
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
  HelpCircle,
  Ruler,
  LoaderCircle,
} from 'lucide-react';

export interface Album3DProps {
  pages: string[];
  currentPage: number;
  zoom?: number;
  isOpen?: boolean;
  videoUrl?: string;
  /** Tamanho em cm no formato "LARGURAxALTURA" (ex.: "30x30", "20x30", "30x40") */
  albumSize?: string;
  materialType?: string;
  customMaterialProps?: any;
  coverTextureUrl?: string;
  /** Número de lâminas contratadas (define a espessura do álbum). Padrão: lâminas visíveis. */
  sheetCount?: number;
  purchaseType?: 'LINK' | 'FULL';
  onPageChange?: (page: number) => void;
  onCheckout?: () => void;
}

// ----------------------------------------------------------------------
// Escala física: 1 cm = 0.15 unidades 3D. Todos os tamanhos ficam na mesma
// escala, então um 20x30 aparece menor que um 30x30, como na vida real.
// ----------------------------------------------------------------------
const CM = 0.15;
// Perfil "revista": páginas finas e capa fina. Espessura cresce com o pacote de lâminas,
// mas fica sempre baixa (20 lâminas ≈ 0,4 cm; 80 lâminas ≈ 1,6 cm).
const SHEET_THICKNESS_CM = 0.02; // ~0,2 mm por lâmina
const MAX_BLOCK_CM = 1.6; // espessura máxima do miolo
const BOARD_CM = 0.12; // capa fina ~1,2 mm
const OVERHANG_CM = 0.1; // capa praticamente rente às páginas
// Leve dobra em V quando aberto (cada metade sobe ~5° a partir da lombada), como revista
const FOLD_ANGLE = 0.09;
const SPINE_GAP = 0.004; // dobra de revista: praticamente sem folga no centro

export function parseAlbumSize(size?: string) {
  const m = /^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)$/i.exec(size || '');
  const wCm = m ? parseFloat(m[1].replace(',', '.')) : 30;
  const hCm = m ? parseFloat(m[2].replace(',', '.')) : 30;
  return { wCm, hCm, width: wCm * CM, height: hCm * CM };
}

const isTypingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
};

// ----------------------------------------------------------------------
// Texturas
// ----------------------------------------------------------------------
const baseTextureCache = new Map<string, Promise<THREE.Texture>>();
const fittedTextureCache = new Map<string, THREE.Texture>();
const generatedTextureCache = new Map<string, THREE.Texture>();
const sharedLoader = new THREE.TextureLoader();
sharedLoader.setCrossOrigin('anonymous');

function loadBaseTexture(url: string): Promise<THREE.Texture> {
  let p = baseTextureCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      sharedLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          resolve(tex);
        },
        undefined,
        (err) => {
          baseTextureCache.delete(url);
          reject(err);
        },
      );
    });
    baseTextureCache.set(url, p);
  }
  return p;
}

export function preloadPageTextures(urls: string[]) {
  if (typeof window === 'undefined') return;
  urls.forEach((url) => {
    if (url) loadBaseTexture(url).catch(() => {});
  });
}

/** Recorta a foto no centro para preencher a página sem esticar (igual à impressão). */
function getFittedTexture(base: THREE.Texture, url: string, pageAspect: number): THREE.Texture {
  const key = `${url}|${pageAspect.toFixed(4)}`;
  const cached = fittedTextureCache.get(key);
  if (cached) return cached;
  const img = base.image as { width: number; height: number };
  const imgAspect = img && img.height ? img.width / img.height : pageAspect;
  const tex = base.clone();
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  if (imgAspect > pageAspect) {
    tex.repeat.x = pageAspect / imgAspect;
    tex.offset.x = (1 - tex.repeat.x) / 2;
  } else if (imgAspect < pageAspect) {
    tex.repeat.y = imgAspect / pageAspect;
    tex.offset.y = (1 - tex.repeat.y) / 2;
  }
  tex.needsUpdate = true;
  fittedTextureCache.set(key, tex);
  return tex;
}

function makeCanvasTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
  const cached = generatedTextureCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  generatedTextureCache.set(key, tex);
  return tex;
}

/** Página vazia (quando ainda não há foto) — papel fine-art com o selo Top Line. */
function blankPageTexture(pageNumber: number, aspect: number) {
  const w = 1024;
  const h = Math.round(1024 / aspect);
  return makeCanvasTexture(`blank|${pageNumber}|${aspect.toFixed(3)}`, w, h, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f7f3ea');
    grad.addColorStop(1, '#ece6d8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(176, 141, 46, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    ctx.fillStyle = 'rgba(150, 118, 34, 0.75)';
    ctx.textAlign = 'center';
    ctx.font = '600 34px Georgia, serif';
    ctx.fillText('TOP LINE STUDIO', w / 2, h / 2 - 6);
    ctx.fillStyle = 'rgba(80, 70, 50, 0.45)';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Página ${pageNumber}`, w / 2, h / 2 + 34);
  });
}

function usePageTexture(url: string | undefined, pageNumber: number, aspect: number): THREE.Texture {
  const fallback = blankPageTexture(pageNumber, aspect);
  const immediate = url ? fittedTextureCache.get(`${url}|${aspect.toFixed(4)}`) : undefined;
  const [tex, setTex] = useState<THREE.Texture>(immediate || fallback);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!url) {
      setTex(fallback);
      return;
    }
    let alive = true;
    loadBaseTexture(url)
      .then((base) => {
        if (!alive) return;
        setTex(getFittedTexture(base, url, aspect));
        invalidate();
      })
      .catch(() => alive && setTex(fallback));
    return () => {
      alive = false;
    };
  }, [url, aspect, fallback, invalidate]);

  return immediate || tex;
}

// Texturas procedurais dos acabamentos (geradas uma vez)
function grainTexture(kind: 'leather' | 'linen' | 'velvet') {
  return makeCanvasTexture(`grain|${kind}`, 512, 512, (ctx) => {
    const img = ctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        let v: number;
        if (kind === 'linen') {
          v = 128 + 50 * Math.sin(x * 1.9) * Math.sin(y * 0.15) + 50 * Math.sin(y * 1.9) * Math.sin(x * 0.15) + (Math.random() - 0.5) * 40;
        } else if (kind === 'leather') {
          v = 128 + (Math.random() - 0.5) * 120;
        } else {
          v = 128 + (Math.random() - 0.5) * 60;
        }
        const i = (y * 512 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (kind === 'leather') {
      ctx.filter = 'blur(1.2px)';
      ctx.drawImage(ctx.canvas, 0, 0);
    }
  }, false);
}

function gutterShadowTexture() {
  return makeCanvasTexture('gutter', 256, 4, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.4, 'rgba(0,0,0,0.05)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.22)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 4);
  });
}

function coverShadeTexture() {
  return makeCanvasTexture('cover-shade', 4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
}

function goldStampTexture() {
  const year = new Date().getFullYear();
  return makeCanvasTexture(`stamp|${year}`, 1024, 256, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '600 92px Georgia, "Times New Roman", serif';
    ctx.fillText('TOP LINE', 512, 110);
    ctx.font = '36px Georgia, serif';
    ctx.fillText(`S T U D I O   ·   F O R M A T U R A   ${year}`, 512, 185);
    ctx.fillRect(312, 214, 400, 3);
  });
}

// ----------------------------------------------------------------------
// Materiais de capa
// ----------------------------------------------------------------------
function useCoverMaterial(materialType: string) {
  return useMemo(() => {
    switch (materialType) {
      case 'leather': {
        const bump = grainTexture('leather');
        bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
        bump.repeat.set(3, 3);
        return new THREE.MeshPhysicalMaterial({ color: '#3a2417', roughness: 0.55, bumpMap: bump, bumpScale: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.5 });
      }
      case 'velvet': {
        const bump = grainTexture('velvet');
        bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
        bump.repeat.set(4, 4);
        return new THREE.MeshPhysicalMaterial({ color: '#1d1030', roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#8a6bc4'), bumpMap: bump, bumpScale: 0.15 });
      }
      case 'premium': {
        const bump = grainTexture('linen');
        bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
        bump.repeat.set(5, 5);
        return new THREE.MeshPhysicalMaterial({ color: '#1e1a16', roughness: 0.9, bumpMap: bump, bumpScale: 0.35, sheen: 0.12, sheenColor: new THREE.Color('#bfae8c') });
      }
      case 'acrylic':
        return new THREE.MeshPhysicalMaterial({ color: '#f4f4f5', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
      case 'photo':
        return new THREE.MeshPhysicalMaterial({ color: '#e7e5e4', roughness: 0.4, clearcoat: 0.4 });
      default:
        return new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.6, metalness: 0.05 });
    }
  }, [materialType]);
}

const GOLD = { color: '#d4af37', metalness: 0.95, roughness: 0.22 } as const;

// ----------------------------------------------------------------------
// Folha virando (curvatura física, sem re-render do React a cada frame)
// ----------------------------------------------------------------------
type FlipState = { active: boolean; dir: 1 | -1; p: number; from: number; to: number };

function TurningLeaf({
  frontTexture,
  backTexture,
  width,
  height,
  zStart,
  zEnd,
  flipRef,
  foldRef,
}: {
  frontTexture: THREE.Texture;
  backTexture: THREE.Texture;
  width: number;
  height: number;
  zStart: number;
  zEnd: number;
  flipRef: React.MutableRefObject<FlipState>;
  foldRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const geometries = useMemo(() => {
    const make = (flipUv: boolean) => {
      const g = new THREE.PlaneGeometry(width, height, 40, 1);
      g.translate(width / 2, 0, 0);
      if (flipUv) {
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      }
      return g;
    };
    return { front: make(false), back: make(true) };
  }, [width, height]);

  useEffect(() => () => {
    geometries.front.dispose();
    geometries.back.dispose();
  }, [geometries]);

  useFrame(() => {
    const p = flipRef.current.p;
    const g = groupRef.current;
    if (!g) return;
    const arch = Math.sin(p * Math.PI) * 0.18 * width;
    for (const geom of [geometries.front, geometries.back]) {
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = Math.max(0, Math.min(1, pos.getX(i) / width));
        // a folha fica presa na lombada e se curva no meio, como papel de verdade
        pos.setZ(i, Math.sin(u * Math.PI * 0.9) * arch * (1 - u * 0.35));
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
    }
    const fold = foldRef.current;
    g.rotation.y = -(fold + p * (Math.PI - 2 * fold));
    g.position.z = THREE.MathUtils.lerp(zStart, zEnd, p) + Math.sin(p * Math.PI) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometries.front} position={[0, 0, 0.0015]}>
        <meshStandardMaterial map={frontTexture} roughness={0.5} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geometries.back} position={[0, 0, -0.0015]}>
        <meshStandardMaterial map={backTexture} roughness={0.5} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------
// Modelo do álbum
// ----------------------------------------------------------------------
function PhotobookModel({
  pages,
  targetSpread,
  totalSpreads,
  sheetCount,
  isOpen,
  materialType,
  albumSize,
  coverTextureUrl,
  showMeasures,
  onTurnPage,
}: {
  pages: string[];
  targetSpread: number;
  totalSpreads: number;
  sheetCount: number;
  isOpen: boolean;
  materialType: string;
  albumSize: string;
  coverTextureUrl?: string;
  showMeasures: boolean;
  onTurnPage: (direction: 'next' | 'prev') => void;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const { width, height, wCm, hCm } = parseAlbumSize(albumSize);
  const aspect = width / height;
  const board = BOARD_CM * CM;
  const over = OVERHANG_CM * CM;
  const totalStack = Math.max(0.01, Math.min(MAX_BLOCK_CM, sheetCount * SHEET_THICKNESS_CM) * CM);

  // ---- Estado de folhear (refs para animar sem re-render a cada frame)
  const [displayed, setDisplayed] = useState(targetSpread);
  const [flipping, setFlipping] = useState<null | { dir: 1 | -1; from: number; to: number }>(null);
  const flipRef = useRef<FlipState>({ active: false, dir: 1, p: 0, from: targetSpread, to: targetSpread });

  useEffect(() => {
    if (flipping || targetSpread === displayed) return;
    const dir: 1 | -1 = targetSpread > displayed ? 1 : -1;
    flipRef.current = { active: true, dir, p: dir === 1 ? 0 : 1, from: displayed, to: targetSpread };
    setFlipping({ dir, from: displayed, to: targetSpread });
    invalidate();
  }, [targetSpread, displayed, flipping, invalidate]);

  // ---- Abrir / fechar capa
  const closedness = useRef(isOpen ? 0 : 1);
  const hingeRef = useRef<THREE.Group>(null);
  const bookRef = useRef<THREE.Group>(null);
  const openContentRef = useRef<THREE.Group>(null);
  const rightFoldRef = useRef<THREE.Group>(null);
  const leftFoldRef = useRef<THREE.Group>(null);
  const rightPageRef = useRef<THREE.Mesh>(null);
  const foldRef = useRef(isOpen ? FOLD_ANGLE : 0);
  useEffect(() => invalidate(), [isOpen, invalidate]);

  // Espessura de cada lado depende de onde estamos no álbum
  const progressSpread = flipping ? flipping.to : displayed;
  const leftFrac = totalSpreads > 1 ? progressSpread / (totalSpreads - 1) : 0.5;
  const minSide = totalStack * 0.04;
  // Os dois lados ficam na mesma altura: sem "degrau" no meio, a foto panorâmica
  // atravessa a dobra lisa, como numa revista aberta.
  void leftFrac; void minSide;
  const stackL = totalStack / 2;
  const stackR = totalStack / 2;
  const HL = board + stackL;
  const HR = board + stackR;
  const pivotZ = (HL + HR) / 2;

  useFrame((_, delta) => {
    let animating = false;
    // folha
    const f = flipRef.current;
    if (f.active) {
      const speed = 1.6 + Math.sin(f.p * Math.PI) * 1.2;
      f.p += f.dir * delta * speed;
      if ((f.dir === 1 && f.p >= 1) || (f.dir === -1 && f.p <= 0)) {
        f.p = f.dir === 1 ? 1 : 0;
        f.active = false;
        setDisplayed(f.to);
        setFlipping(null);
      }
      animating = true;
    }
    // capa
    const target = isOpen ? 0 : 1;
    const next = THREE.MathUtils.damp(closedness.current, target, 4.5, delta);
    closedness.current = Math.abs(next - target) < 0.001 ? target : next;
    if (closedness.current !== target) animating = true;
    const c = closedness.current;
    if (hingeRef.current) hingeRef.current.rotation.y = c * Math.PI;
    if (bookRef.current) bookRef.current.position.x = -(width / 2) * c;
    if (openContentRef.current) openContentRef.current.visible = c < 0.98;
    if (rightPageRef.current) rightPageRef.current.visible = c < 0.98;
    // dobra some quando o álbum fecha
    foldRef.current = FOLD_ANGLE * (1 - c);
    if (rightFoldRef.current) rightFoldRef.current.rotation.y = -foldRef.current;
    if (leftFoldRef.current) leftFoldRef.current.rotation.y = foldRef.current;
    if (animating) invalidate();
  });

  // ---- Texturas das páginas
  const fromS = flipping ? flipping.from : displayed;
  const toS = flipping ? flipping.to : displayed;
  const leftIdx = flipping ? (flipping.dir === 1 ? fromS * 2 : toS * 2) : displayed * 2;
  const rightIdx = flipping ? (flipping.dir === 1 ? toS * 2 + 1 : fromS * 2 + 1) : displayed * 2 + 1;
  const leafFrontIdx = flipping ? (flipping.dir === 1 ? fromS * 2 + 1 : toS * 2 + 1) : 0;
  const leafBackIdx = flipping ? (flipping.dir === 1 ? toS * 2 : fromS * 2) : 0;

  const leftTex = usePageTexture(pages[leftIdx], leftIdx + 1, aspect);
  const rightTex = usePageTexture(pages[rightIdx], rightIdx + 1, aspect);
  const leafFrontTex = usePageTexture(flipping ? pages[leafFrontIdx] : undefined, leafFrontIdx + 1, aspect);
  const leafBackTex = usePageTexture(flipping ? pages[leafBackIdx] : undefined, leafBackIdx + 1, aspect);

  const coverW = width + over;
  const coverH = height + over * 2;
  // A foto cobre a capa inteira em todos os acabamentos; o material aparece nas bordas,
  // na lombada e no verso (acrílico ganha brilho de vidro, os demais acabamento acetinado)
  const coverPhotoAspect = coverW / coverH;
  const coverPhotoTex = usePageTexture(coverTextureUrl, 1, coverPhotoAspect);

  const coverMaterial = useCoverMaterial(materialType);
  const pageEdgeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1ece1', roughness: 0.9 }), []);
  const gutterTex = gutterShadowTexture();
  const stampTex = goldStampTexture();

  const handlePageClick = (dir: 'next' | 'prev') => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // foi um arraste para girar, não um clique
    onTurnPage(dir);
  };

  return (
    // Livro deitado sobre a mesa (plano XY local -> plano do chão)
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <group ref={bookRef}>
        {/* ---------- METADE DIREITA (fixa) ---------- */}
        <group ref={rightFoldRef}>
          <mesh position={[coverW / 2 + SPINE_GAP / 2, 0, board / 2]} material={coverMaterial} castShadow receiveShadow>
            <boxGeometry args={[coverW, coverH, board]} />
          </mesh>
          <mesh position={[width / 2 + SPINE_GAP / 2, 0, board + stackR / 2]} material={pageEdgeMaterial}>
            <boxGeometry args={[width, height, stackR]} />
          </mesh>
          <mesh ref={rightPageRef} position={[width / 2 + SPINE_GAP / 2, 0, HR + 0.001]} onClick={handlePageClick('next')}>
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial map={rightTex} roughness={0.5} />
          </mesh>
        </group>

        <group ref={openContentRef}>
          {/* sombra suave da dobra central */}
          <mesh position={[0, 0, Math.max(HL, HR) + 0.003]} renderOrder={2}>
            <planeGeometry args={[width * 0.06, height]} />
            <meshBasicMaterial map={gutterTex} transparent depthWrite={false} />
          </mesh>
          {flipping && (
            <TurningLeaf
              frontTexture={leafFrontTex}
              backTexture={leafBackTex}
              width={width}
              height={height}
              zStart={HR + 0.004}
              zEnd={HL + 0.004}
              flipRef={flipRef}
              foldRef={foldRef}
            />
          )}
        </group>

        {/* Lombada: tira no centro quando aberto */}
        <mesh position={[0, 0, board * 0.4]} material={coverMaterial}>
          <boxGeometry args={[SPINE_GAP + 0.02, coverH, board * 0.8]} />
        </mesh>

        {/* ---------- METADE ESQUERDA (dobra para virar a capa) ---------- */}
        <group position={[0, 0, pivotZ]}>
          <group ref={hingeRef}>
            <group position={[0, 0, -pivotZ]}>
             <group ref={leftFoldRef}>
              <mesh position={[-coverW / 2 - SPINE_GAP / 2, 0, board / 2]} material={coverMaterial} castShadow receiveShadow>
                <boxGeometry args={[coverW, coverH, board]} />
              </mesh>
              <mesh position={[-width / 2 - SPINE_GAP / 2, 0, board + stackL / 2]} material={pageEdgeMaterial}>
                <boxGeometry args={[width, height, stackL]} />
              </mesh>
              <mesh position={[-width / 2 - SPINE_GAP / 2, 0, HL + 0.001]} onClick={handlePageClick('prev')}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial map={leftTex} roughness={0.5} />
              </mesh>

              {/* Arte da capa (face de baixo da metade esquerda = frente quando fechado) */}
              <group position={[-coverW / 2 - SPINE_GAP / 2, 0, -0.004]} rotation={[0, Math.PI, 0]}>
                <mesh>
                  <planeGeometry args={[coverW, coverH]} />
                  <meshPhysicalMaterial
                    map={coverPhotoTex}
                    roughness={materialType === 'acrylic' ? 0.05 : materialType === 'photo' ? 0.3 : 0.45}
                    clearcoat={materialType === 'acrylic' ? 1 : materialType === 'photo' ? 0.4 : 0.1}
                    clearcoatRoughness={0.05}
                  />
                </mesh>
                {/* faixa escura suave embaixo para o selo dourado ficar legível sobre a foto */}
                <mesh position={[0, -coverH * 0.34, 0.003]}>
                  <planeGeometry args={[coverW, coverH * 0.32]} />
                  <meshBasicMaterial map={coverShadeTexture()} transparent depthWrite={false} />
                </mesh>
                <mesh position={[0, -coverH * 0.37, 0.006]}>
                  <planeGeometry args={[width * 0.6, width * 0.15]} />
                  <meshStandardMaterial color="#e2bf55" metalness={0.7} roughness={0.3} emissive="#6b5214" emissiveIntensity={0.6} alphaMap={stampTex} transparent depthWrite={false} />
                </mesh>
              </group>
             </group>
            </group>
          </group>
        </group>
      </group>

      {/* Cotas (medidas reais) */}
      {showMeasures && isOpen && (
        <group position={[0, 0, Math.max(HL, HR) + 0.02]}>
          <MeasureLine from={[-coverW - SPINE_GAP / 2, -coverH / 2 - 0.35, 0]} to={[coverW + SPINE_GAP / 2, -coverH / 2 - 0.35, 0]} label={`Aberto: ${wCm * 2} × ${hCm} cm`} />
          <MeasureLine from={[coverW + SPINE_GAP / 2 + 0.35, -height / 2, 0]} to={[coverW + SPINE_GAP / 2 + 0.35, height / 2, 0]} label={`${hCm} cm`} />
          <MeasureLine from={[SPINE_GAP / 2, coverH / 2 + 0.35, 0]} to={[width + SPINE_GAP / 2, coverH / 2 + 0.35, 0]} label={`${wCm} cm`} />
        </group>
      )}
    </group>
  );
}

function MeasureLine({ from, to, label }: { from: [number, number, number]; to: [number, number, number]; label: string }) {
  const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]), [from, to]);
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (
    <group>
      <lineSegments geometry={geom}>
        <lineBasicMaterial color="#d4af37" />
      </lineSegments>
      {[from, to].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#d4af37" />
        </mesh>
      ))}
      <Html position={mid} center zIndexRange={[20, 0]}>
        <div className="whitespace-nowrap rounded-full border border-brand-gold/40 bg-black/85 px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand-gold shadow-lg">
          {label}
        </div>
      </Html>
    </group>
  );
}

// ----------------------------------------------------------------------
// Câmera: enquadra o álbum aberto na tela (inclusive no celular)
// ----------------------------------------------------------------------
function CameraRig({ albumSize, isOpen }: { albumSize: string; isOpen: boolean }) {
  const { camera, size, controls, invalidate } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const screenAspect = size.width / Math.max(1, size.height);
    const cur = parseAlbumSize(albumSize);
    // Em telas largas usa a referência do maior álbum (30x40), assim os tamanhos
    // mantêm a proporção real entre si. No celular, enquadra o tamanho escolhido.
    const ref = screenAspect >= 1 ? parseAlbumSize('30x40') : cur;
    const spreadW = (isOpen ? ref.width * 2 : ref.width) + 0.5 + (OVERHANG_CM * CM * 2);
    const depth = ref.height + 0.5;
    const elev = THREE.MathUtils.degToRad(66);
    const vfov = THREE.MathUtils.degToRad(cam.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * screenAspect);
    const projectedDepth = depth * Math.sin(elev) + 0.3;
    // espaço extra para as barras de controle (em cima e embaixo)
    const margin = screenAspect >= 1 ? 1.32 : 1.08;
    const dist = Math.max((spreadW / 2) / Math.tan(hfov / 2), (projectedDepth / 2) / Math.tan(vfov / 2) * 1.15) * margin;
    cam.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
    cam.near = Math.max(0.1, dist * 0.05);
    cam.far = dist * 6;
    cam.updateProjectionMatrix();
    const ctl = controls as any;
    if (ctl) {
      ctl.target.set(0, 0, 0.15);
      ctl.minDistance = dist * 0.45;
      ctl.maxDistance = dist * 1.8;
      ctl.update();
      ctl.saveState?.();
    } else {
      cam.lookAt(0, 0, 0.15);
    }
    invalidate();
  }, [camera, size.width, size.height, controls, albumSize, isOpen, invalidate]);
  return null;
}

function LoadingBadge() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-x-0 top-20 z-30 flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-[10px] uppercase tracking-widest text-gray-300">
        <LoaderCircle size={14} className="animate-spin text-brand-gold" />
        Carregando fotos {Math.round(progress)}%
      </div>
    </div>
  );
}

const MATERIAL_LABEL: Record<string, string> = {
  standard: 'Padrão',
  premium: 'Linho Premium',
  leather: 'Couro',
  acrylic: 'Acrílico',
  velvet: 'Veludo',
  photo: 'Fotográfica',
};

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------------
export default function Album3D(props: Album3DProps) {
  const {
    pages = [],
    currentPage = 0,
    isOpen: initialIsOpen = true,
    albumSize = '30x30',
    materialType = 'standard',
    coverTextureUrl,
    sheetCount,
    purchaseType = 'FULL',
    onPageChange,
    onCheckout,
  } = props;

  const totalSpreads = Math.max(1, Math.ceil(pages.length / 2));
  const validCurrentPage = Math.min(Math.max(0, currentPage), totalSpreads - 1);
  const sheets = Math.max(sheetCount || 0, totalSpreads);
  const { wCm, hCm, width, height } = parseAlbumSize(albumSize);

  const webglOk = useMemo(() => (typeof window === 'undefined' ? true : hasWebGL()), []);
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>(webglOk ? '3d' : 'flat');
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showMeasures, setShowMeasures] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => setIsOpen(initialIsOpen), [initialIsOpen]);

  useEffect(() => {
    if (pages.length > 0) preloadPageTextures(pages);
  }, [pages]);

  const handleTurnPage = useCallback(
    (dir: 'next' | 'prev') => {
      if (!onPageChange) return;
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (dir === 'next' && validCurrentPage < totalSpreads - 1) onPageChange(validCurrentPage + 1);
      if (dir === 'prev' && validCurrentPage > 0) onPageChange(validCurrentPage - 1);
    },
    [validCurrentPage, totalSpreads, onPageChange, isOpen],
  );

  // Teclado (ignora quando a pessoa está digitando em algum campo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') handleTurnPage('next');
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') handleTurnPage('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurnPage]);

  const handleResetCamera = () => {
    setAutoRotate(false);
    controlsRef.current?.reset();
  };

  const leftPageUrl = pages[validCurrentPage * 2];
  const rightPageUrl = pages[validCurrentPage * 2 + 1];
  const toolBtn =
    'flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl border text-[9px] uppercase tracking-widest font-bold transition-all shadow-xl';
  const toolIdle = 'bg-black/75 text-white/80 border-white/10 hover:text-brand-gold hover:border-brand-gold/40';
  const toolActive = 'bg-brand-gold/20 border-brand-gold text-brand-gold';

  return (
    <div className="w-full h-full min-h-[460px] md:min-h-[620px] relative select-none bg-[radial-gradient(ellipse_at_50%_35%,#1c1c20_0%,#0a0a0c_55%,#030303_100%)] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
      {/* ---------- HUD superior ---------- */}
      <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-2xl pointer-events-auto shadow-2xl">
          <Sparkles size={14} className="text-brand-gold" />
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.25em] font-bold text-white">Top Line Studio 3D</span>
          <span className="text-[9px] text-brand-gold font-mono px-2 py-0.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 whitespace-nowrap">
            {wCm} × {hCm} cm
          </span>
          <span className="hidden md:inline text-[9px] text-gray-400 uppercase tracking-widest whitespace-nowrap">
            {MATERIAL_LABEL[materialType] || 'Padrão'} · {sheets} lâminas
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${toolBtn} ${!isOpen ? 'bg-brand-gold text-black border-brand-gold' : toolIdle}`}
            title={isOpen ? 'Fechar e ver a capa' : 'Abrir o álbum'}
            aria-label={isOpen ? 'Ver capa' : 'Abrir álbum'}
          >
            <BookMarked size={13} />
            <span className="hidden sm:inline">{isOpen ? 'Ver Capa' : 'Abrir Álbum'}</span>
          </button>

          {viewMode === '3d' && (
            <>
              <button
                onClick={() => setShowMeasures(!showMeasures)}
                className={`${toolBtn} ${showMeasures ? toolActive : toolIdle}`}
                title="Mostrar medidas reais do álbum"
                aria-label="Medidas"
                aria-pressed={showMeasures}
              >
                <Ruler size={13} />
                <span className="hidden sm:inline">Medidas</span>
              </button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`${toolBtn} ${autoRotate ? toolActive : toolIdle}`}
                title="Girar o álbum automaticamente"
                aria-label="Girar"
                aria-pressed={autoRotate}
              >
                <Rotate3d size={13} />
                <span className="hidden lg:inline">{autoRotate ? 'Parar' : 'Girar'}</span>
              </button>
              <button onClick={handleResetCamera} className={`${toolBtn} ${toolIdle} !px-2`} title="Centralizar câmera" aria-label="Centralizar câmera">
                <Maximize2 size={13} />
              </button>
            </>
          )}

          {webglOk && (
            <button
              onClick={() => { if (viewMode === '3d') setIsOpen(true); setViewMode(viewMode === '3d' ? 'flat' : '3d'); }}
              className={`${toolBtn} ${toolIdle}`}
              title="Alternar entre visão 3D e lâmina em alta definição"
              aria-label={viewMode === '3d' ? 'Visão lâmina HD' : 'Visão 3D'}
            >
              {viewMode === '3d' ? <BookOpen size={13} /> : <Eye size={13} />}
              <span className="hidden sm:inline">{viewMode === '3d' ? 'Lâmina HD' : 'Visão 3D'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------- Área do álbum ---------- */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing touch-none">
        {viewMode === '3d' ? (
          <>
            <Canvas
              frameloop={autoRotate ? 'always' : 'demand'}
              dpr={[1, 2]}
              camera={{ position: [0, 8, 6], fov: 32 }}
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance' }}
              fallback={<div className="p-10 text-center text-sm text-gray-400">Seu navegador não suporta 3D. Use a visão “Lâmina HD”.</div>}
            >
              <ambientLight intensity={0.35} />
              <directionalLight position={[3, 9, 5]} intensity={1.6} color="#fffaf0" />
              <directionalLight position={[-6, 4, -3]} intensity={0.35} color="#e8eeff" />
              {/* luz suave por baixo: ao girar o álbum, a parte de trás não fica preta */}
              <directionalLight position={[0, -8, 3]} intensity={0.7} color="#fff6e6" />

              <PhotobookModel
                pages={pages}
                targetSpread={validCurrentPage}
                totalSpreads={totalSpreads}
                sheetCount={sheets}
                isOpen={isOpen}
                albumSize={albumSize}
                materialType={materialType}
                coverTextureUrl={coverTextureUrl}
                showMeasures={showMeasures}
                onTurnPage={handleTurnPage}
              />

              <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={Math.max(width, height) * 4} blur={2.4} far={1.2} resolution={512} color="#000000" />

              <OrbitControls
                ref={controlsRef}
                makeDefault
                autoRotate={autoRotate}
                autoRotateSpeed={0.8}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                // giro livre: 360° em volta e também por baixo (ver a capa de trás)
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
              />
              <CameraRig albumSize={albumSize} isOpen={isOpen} />

              {/* Iluminação de estúdio gerada localmente (sem baixar arquivos externos) */}
              <Environment resolution={256} frames={1}>
                <Lightformer intensity={2.2} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
                <Lightformer intensity={0.9} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#fff3dd" />
                <Lightformer intensity={0.7} position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#dfe8ff" />
                <Lightformer intensity={0.4} form="ring" position={[0, 3, -6]} scale={3} color="#d4af37" />
              </Environment>
            </Canvas>
            <LoadingBadge />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 pt-20 pb-28 md:p-12 overflow-hidden bg-black/95">
            <div
              className="relative w-full max-h-full bg-zinc-950 rounded-xl shadow-[0_20px_100px_rgba(0,0,0,0.95)] border border-white/10 flex overflow-hidden"
              style={{ aspectRatio: `${(width * 2) / height}`, maxWidth: `min(100%, calc((100vh - 220px) * ${(width * 2) / height}))` }}
            >
              {[leftPageUrl, rightPageUrl].map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-1/2 h-full relative bg-[#f3efe6] cursor-pointer group ${i === 0 ? 'border-r border-black/20' : ''}`}
                  onClick={() => handleTurnPage(i === 0 ? 'prev' : 'next')}
                  title={i === 0 ? 'Lâmina anterior' : 'Próxima lâmina'}
                >
                  {url ? (
                    <img src={url} alt={`Página ${validCurrentPage * 2 + 1 + i}`} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-black/40">
                      Página {validCurrentPage * 2 + 1 + i}
                    </div>
                  )}
                  <span className={`absolute bottom-2 ${i === 0 ? 'left-3' : 'right-3'} text-[9px] font-mono text-white bg-black/60 px-2 py-0.5 rounded`}>
                    {validCurrentPage * 2 + 1 + i}
                  </span>
                </button>
              ))}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.15),transparent)] pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* ---------- Navegação inferior ---------- */}
      <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-max max-w-[calc(100%-1.5rem)]">
        <div className="flex items-center gap-1 md:gap-2 bg-black/90 backdrop-blur-2xl border border-white/10 px-2 md:px-3 py-1.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => handleTurnPage('prev')}
            disabled={isOpen && validCurrentPage <= 0}
            className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-25 disabled:hover:bg-transparent transition-all"
            title="Lâmina anterior (seta ←)"
            aria-label="Lâmina anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="px-1 md:px-3 text-center min-w-[110px] md:min-w-[160px]">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white whitespace-nowrap">
              {isOpen ? `Lâmina ${validCurrentPage + 1} de ${totalSpreads}` : 'Capa'}
            </div>
            <div className="text-[9px] text-brand-gold/80 font-mono tracking-widest whitespace-nowrap">
              {isOpen ? `Páginas ${validCurrentPage * 2 + 1} e ${validCurrentPage * 2 + 2}` : 'Toque para abrir'}
            </div>
          </div>

          <button
            onClick={() => handleTurnPage('next')}
            disabled={isOpen && validCurrentPage >= totalSpreads - 1}
            className="p-2.5 rounded-xl hover:bg-white/10 text-brand-gold disabled:opacity-25 disabled:hover:bg-transparent transition-all"
            title="Próxima lâmina (seta →)"
            aria-label="Próxima lâmina"
          >
            <ChevronRight size={20} />
          </button>

          {onCheckout && (
            <>
              <div className="w-[1px] h-6 bg-white/10 mx-0.5 md:mx-1" />
              <button
                onClick={onCheckout}
                className="bg-brand-gold text-black px-3 md:px-4 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-1.5 whitespace-nowrap"
              >
                <MessageCircle size={13} />
                <span>{purchaseType === 'LINK' ? 'Contratar' : 'Comprar'}</span>
                <span className="hidden md:inline">{purchaseType === 'LINK' ? 'Link' : 'Álbum'}</span>
              </button>
            </>
          )}
        </div>

        {isOpen && totalSpreads > 1 && totalSpreads <= 30 && (
          <div className="flex flex-wrap justify-center items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 max-w-full">
            {Array.from({ length: totalSpreads }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => onPageChange?.(idx)}
                className={`transition-all rounded-full ${idx === validCurrentPage ? 'w-6 h-2 bg-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'w-2 h-2 bg-white/25 hover:bg-white/50'}`}
                title={`Ir para a lâmina ${idx + 1}`}
                aria-label={`Ir para a lâmina ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-20 hidden lg:flex items-center gap-1.5 text-[9px] text-gray-500 tracking-wider pointer-events-none">
        <HelpCircle size={11} className="text-brand-gold/60" />
        <span>Arraste para girar 360° · Role para aproximar · Clique na página para folhear · Teclas ← →</span>
      </div>
    </div>
  );
}
