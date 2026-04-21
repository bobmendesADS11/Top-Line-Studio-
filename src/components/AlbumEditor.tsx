import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Grid, 
  Maximize, 
  Layers, 
  Palette, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Clock,
  ChevronLeft,
  Settings2,
  Box,
  Crop as CropIcon,
  X
} from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import Album3D from './Album3D';

interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  aspectRatio?: number;
}

interface PhotoCrop {
  px?: Area;
}

interface AlbumEditorProps {
  photos: Photo[];
  onSave?: (pages: string[]) => void;
  onBack?: () => void;
  hasPurchasedAlbum?: boolean;
  userTier?: 'PROSPECT' | 'LINK' | 'ALBUM';
}

type LayoutType = 'minimalist' | 'grid' | 'vgrid' | 'panorama' | 'spread';
type EffectType = 'none' | 'bw' | 'sepia' | 'vintage' | 'vibrant';
type AlbumSize = '20x30' | '30x30' | '30x40';
type MaterialType = 'standard' | 'premium' | 'acrylic' | 'leather' | 'velvet' | 'photo';

const PRICES = {
  photo: 34.90,
  size: {
    '20x30': 0,
    '30x30': 50,
    '30x40': 100
  },
  material: {
    'standard': 0,
    'premium': 150,
    'leather': 250,
    'acrylic': 400,
    'velvet': 300,
    'photo': 200
  }
};

const DEMO_PHOTOS: Photo[] = [
  { id: 'demo1', url: 'https://picsum.photos/seed/grad1/800/1200' },
  { id: 'demo2', url: 'https://picsum.photos/seed/grad2/800/1200' },
  { id: 'demo3', url: 'https://picsum.photos/seed/grad3/800/1200' },
  { id: 'demo4', url: 'https://picsum.photos/seed/grad4/800/1200' },
  { id: 'demo5', url: 'https://picsum.photos/seed/grad5/800/1200' },
  { id: 'demo6', url: 'https://picsum.photos/seed/grad6/800/1200' },
];

const DEFAULT_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-11606-large.mp4";

const STORAGE_KEY = 'noir_album_persistence';

const AlbumEditor: React.FC<AlbumEditorProps> = ({ photos, onSave, onBack, hasPurchasedAlbum = false, userTier = 'PROSPECT' }) => {
  const activePhotos = photos.length > 0 ? photos : DEMO_PHOTOS;
  const [globalLayout, setGlobalLayout] = useState<LayoutType>('minimalist');
  const [pageEffects, setPageEffects] = useState<EffectType[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [albumSize, setAlbumSize] = useState<AlbumSize>('30x30');
  const [materialType, setMaterialType] = useState<MaterialType>('standard');
  const [videoUrl, setVideoUrl] = useState<string>(DEFAULT_VIDEO);
  const [pages, setPages] = useState<string[]>([]);
  const [pageLayouts, setPageLayouts] = useState<LayoutType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Crop state
  const [photoCrops, setPhotoCrops] = useState<Record<string, PhotoCrop>>({});
  const [croppingPhoto, setCroppingPhoto] = useState<{ id: string, url: string, aspect: number, baseZoom: number } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [completedCrop, setCompletedCrop] = useState<Area | null>(null);
  
  const totalPrice = (activePhotos.length * PRICES.photo) + PRICES.size[albumSize] + PRICES.material[materialType];

  // Persistence Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Only apply if the photo count matches roughly to avoid state corruption
        // In a real app we would check photoid signatures
        if (data.globalLayout) setGlobalLayout(data.globalLayout);
        if (data.pageLayouts) setPageLayouts(data.pageLayouts);
        if (data.pageEffects) setPageEffects(data.pageEffects);
        if (data.coverPhotoId) setCoverPhotoId(data.coverPhotoId);
        if (data.albumSize) setAlbumSize(data.albumSize);
        if (data.materialType) setMaterialType(data.materialType);
        if (data.photoCrops) setPhotoCrops(data.photoCrops);
        if (data.videoUrl) setVideoUrl(data.videoUrl);
      }
    } catch (e) {
      console.error("Erro ao carregar rascunho:", e);
    }
    setIsFirstLoad(false);
  }, []);

  // Persistence Save
  useEffect(() => {
    if (isFirstLoad) return;
    
    const draft = {
      globalLayout,
      pageLayouts,
      pageEffects,
      coverPhotoId,
      albumSize,
      materialType,
      photoCrops,
      videoUrl
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [globalLayout, pageLayouts, pageEffects, coverPhotoId, albumSize, materialType, photoCrops, videoUrl, isFirstLoad]);

  // Initialize page layouts and effects when photos change (only if no draft)
  useEffect(() => {
    if (!isFirstLoad) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return; // Don't overwrite if we have a saved draft
    }
    
    const photosPerPage = globalLayout === 'grid' ? 4 : (globalLayout === 'vgrid' ? 2 : 1);
    const numPagesBase = Math.ceil(activePhotos.length / photosPerPage);
    const numPages = globalLayout === 'panorama' ? activePhotos.length * 2 : numPagesBase;
    
    setPageLayouts(new Array(numPages).fill(globalLayout));
    setPageEffects(new Array(numPages).fill('none'));
    if (!coverPhotoId && activePhotos.length > 0) {
      setCoverPhotoId(activePhotos[0].id);
    }
  }, [activePhotos.length, globalLayout, isFirstLoad]);

  // Update all layouts when global layout changes
  const handleGlobalLayoutChange = (newLayout: LayoutType) => {
    setGlobalLayout(newLayout);
    const photosPerPage = newLayout === 'grid' ? 4 : (newLayout === 'vgrid' ? 2 : 1);
    const numPagesBase = Math.ceil(activePhotos.length / photosPerPage);
    const numPages = newLayout === 'panorama' ? activePhotos.length * 2 : numPagesBase;
    
    setPageLayouts(new Array(numPages).fill(newLayout));
    setPageEffects(new Array(numPages).fill('none'));
  };

  const clearDraft = () => {
    if (confirm('Deseja realmente limpar todas as edições e começar do zero?')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handlePageLayoutChange = (index: number, newLayout: LayoutType) => {
    const newLayouts = [...pageLayouts];
    newLayouts[index] = newLayout;
    setPageLayouts(newLayouts);
  };

  const handlePageEffectChange = (index: number, newEffect: EffectType) => {
    const newEffects = [...pageEffects];
    newEffects[index] = newEffect;
    setPageEffects(newEffects);
  };

  // Generate pages whenever photos, layouts, or effects change
  useEffect(() => {
    if (activePhotos.length > 0 && pageLayouts.length > 0 && pageEffects.length > 0) {
      generateAllPages();
    }
  }, [activePhotos, pageLayouts, pageEffects, albumSize, photoCrops]);

  const applyEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, pageEffect: EffectType) => {
    if (pageEffect === 'none') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (pageEffect === 'bw') {
        const avg = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = data[i + 1] = data[i + 2] = avg;
      } else if (pageEffect === 'sepia') {
        data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
        data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
        data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
      } else if (pageEffect === 'vintage') {
        data[i] = r * 0.9;
        data[i + 1] = g * 0.8;
        data[i + 2] = b * 0.7;
      } else if (pageEffect === 'vibrant') {
        const max = Math.max(r, g, b);
        data[i] += (max - r) * 0.2;
        data[i + 1] += (max - g) * 0.2;
        data[i + 2] += (max - b) * 0.2;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawPage = async (pagePhotos: Photo[], layout: LayoutType, pageEffect: EffectType, side?: 'left' | 'right'): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Resolution based on size
    let width = 1200;
    let height = 1200;
    if (albumSize === '20x30') { width = 800; height = 1200; }
    if (albumSize === '30x40') { width = 1200; height = 1600; }
    
    canvas.width = width;
    canvas.height = height;

    // Background - Enhanced Luxury Material (Noir Silk)
    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Fine Silk Texture / Grain
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#222' : '#000';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Subtle edge highlight (Inner border/bevel feel)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Load images
    const loadedImages = await Promise.all(
      pagePhotos.map(p => new Promise<{ img: HTMLImageElement, id: string }>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ img, id: p.id });
        img.src = p.url;
      }))
    );

    const drawImageWithCrop = (imgObj: { img: HTMLImageElement, id: string }, x: number, y: number, w: number, h: number, panoramaSide?: 'left' | 'right') => {
      const { img, id } = imgObj;
      const cropData = photoCrops[id];
      
      // For panorama, the effective target is twice the width
      const effectiveW = panoramaSide ? w * 2 : w;
      const targetRatio = effectiveW / h;
      
      if (cropData?.px) {
        let { x: sx, y: sy, width: sw, height: sh } = cropData.px;
        
        if (sw > 0 && sh > 0) {
          const cropRatio = sw / sh;
          
          if (Math.abs(cropRatio - targetRatio) > 0.01) {
            if (cropRatio > targetRatio) {
              const oldSw = sw;
              sw = sh * targetRatio;
              sx += (oldSw - sw) / 2;
            } else {
              const oldSh = sh;
              sh = sw / targetRatio;
              sy += (oldSh - sh) * 0.1;
            }
          }
          
          if (panoramaSide === 'left') {
            ctx.drawImage(img, sx, sy, sw / 2, sh, x, y, w, h);
          } else if (panoramaSide === 'right') {
            ctx.drawImage(img, sx + sw / 2, sy, sw / 2, sh, x, y, w, h);
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
          }
          return;
        }
      }

      // Fallback
      const imgRatio = img.width / img.height;
      let sw, sh, sx, sy;
      
      const isFit = Math.abs(imgRatio - targetRatio) < 0.01;

      if (imgRatio > targetRatio) {
        sh = img.height;
        sw = sh * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = isFit ? 0 : (img.height - sh) * 0.15;
        if (sy < 0) sy = 0;
      }

      if (panoramaSide === 'left') {
        ctx.drawImage(img, sx, sy, sw / 2, sh, x, y, w, h);
      } else if (panoramaSide === 'right') {
        ctx.drawImage(img, sx + sw / 2, sy, sw / 2, sh, x, y, w, h);
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      }
    };

    if (layout === 'minimalist') {
      if (loadedImages[0]) {
        const imgObj = loadedImages[0];
        const { img } = imgObj;
        
        // Calculate fit dimensions within margins - Reduced for more impact
        const marginX = width * 0.05;
        const marginY = height * 0.05;
        const maxW = width - marginX * 2;
        const maxH = height - marginY * 2;
        
        const imgRatio = img.width / img.height;
        const areaRatio = maxW / maxH;
        
        let drawW, drawH;
        if (imgRatio > areaRatio) {
          drawW = maxW;
          drawH = drawW / imgRatio;
        } else {
          drawH = maxH;
          drawW = drawH * imgRatio;
        }
        
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;
        
        // Dynamic Paper Depth / Shadow behind the photo - Softer, centered shadow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 15;

        // Fine Art Frame (Passepartout Effect) - Thinner and more subtle
        ctx.fillStyle = '#111';
        const framePadding = width * 0.005;
        ctx.fillRect(drawX - framePadding, drawY - framePadding, drawW + framePadding * 2, drawH + framePadding * 2);
        
        drawImageWithCrop(imgObj, drawX, drawY, drawW, drawH);
        
        // Reset shadow for further drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
 else if (layout === 'grid') {
      const margin = width * 0.06;
      const gap = width * 0.04;
      const cols = 2;
      const rows = 2;
      const cellW = (width - margin * 2 - gap) / cols;
      const cellH = (height - margin * 2 - gap) / rows;

      loadedImages.forEach((imgObj, i) => {
        if (i >= 4) return;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * (cellH + gap);
        drawImageWithCrop(imgObj, x, y, cellW, cellH);
      });
    } else if (layout === 'spread') {
      if (loadedImages[0]) {
        drawImageWithCrop(loadedImages[0], 0, 0, width, height);
      }
    } else if (layout === 'panorama') {
      if (loadedImages[0]) {
        drawImageWithCrop(loadedImages[0], 0, 0, width, height, side);
      }
    } else if (layout === 'vgrid') {
      const margin = width * 0.05;
      const gap = width * 0.02;
      const cellW = width - margin * 2;
      const cellH = (height - margin * 2 - gap) / 2;

      loadedImages.forEach((imgObj, i) => {
        if (i >= 2) return;
        const y = margin + i * (cellH + gap);
        drawImageWithCrop(imgObj, margin, y, cellW, cellH);
      });
    }

    applyEffect(ctx, width, height, pageEffect);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const onCropSave = () => {
    if (croppingPhoto && completedCrop) {
      setPhotoCrops({
        ...photoCrops,
        [croppingPhoto.id]: { px: completedCrop }
      });
      setCroppingPhoto(null);
    }
  };

  const getPagePhotos = (pageIdx: number) => {
    let photoIdx = 0;
    for (let i = 0; i < pageIdx; i++) {
      const layout = pageLayouts[i];
      let ppp = 1;
      if (layout === 'grid') ppp = 4;
      if (layout === 'vgrid') ppp = 2;
      if (layout === 'panorama') {
        // Find if this is the second half of a panorama
        const isSecondHalf = i > 0 && pageLayouts[i-1] === 'panorama';
        if (isSecondHalf) {
          // If second half, we already consumed the photo in the first half logic in generateAllPages
          // but for getPagePhotos (used for UI previews), we need the index.
          // Actually, panorama logic is split.
          photoIdx += 0; 
        } else {
          photoIdx += 1;
        }
        // This is complex. Let's simplify: generateAllPages is the source of truth.
        // For UI, we'll just try to match.
      } else {
        photoIdx += ppp;
      }
    }
    const layout = pageLayouts[pageIdx];
    let ppp = 1;
    if (layout === 'grid') ppp = 4;
    if (layout === 'vgrid') ppp = 2;
    
    // For panorama, if it's the second page of a spread, we need the SAME photo as before
    if (layout === 'panorama' && pageIdx > 0 && pageLayouts[pageIdx-1] === 'panorama') {
      // Find the photo index shift
      let adjustedIdx = 0;
      for(let j=0; j<pageIdx; j++) {
        if (pageLayouts[j] === 'panorama') {
          if (j > 0 && pageLayouts[j-1] === 'panorama') continue;
          adjustedIdx += 1;
        } else {
          let pp = 1;
          if (pageLayouts[j] === 'grid') pp = 4;
          if (pageLayouts[j] === 'vgrid') pp = 2;
          adjustedIdx += pp;
        }
      }
      return activePhotos.slice(adjustedIdx - 1, adjustedIdx);
    }

    return activePhotos.slice(photoIdx, photoIdx + ppp);
  };

  const openCropModalForPagePhoto = (photo: Photo, layout: LayoutType) => {
    const { width, height } = getPageDimensions();
    let aspect = 1;
    
    // Create temporary image to get real aspect ratio if missing
    const img = new Image();
    img.src = photo.url;
    
    const getPhotoAspect = () => {
      if (photo.aspectRatio) return photo.aspectRatio;
      
      // Attempt to get from activePhotos if provided there
      const found = activePhotos.find(p => p.id === photo.id);
      if (found?.aspectRatio) return found.aspectRatio;

      if (img.width > 0) return img.width / img.height;
      // Fallback for demos or unloaded images
      if (photo.url.includes('seed')) return 800 / 1200;
      return 1;
    };

    const photoAspect = getPhotoAspect();

    // The aspect ratio MUST match how drawImageWithCrop will eventually render it
    if (layout === 'minimalist') {
      aspect = photoAspect;
    } else if (layout === 'grid') {
      const margin = width * 0.06;
      const gap = width * 0.04;
      const cellW = (width - margin * 2 - gap) / 2;
      const cellH = (height - margin * 2 - gap) / 2;
      aspect = cellW / cellH;
    } else if (layout === 'vgrid') {
      aspect = (width - width * 0.1) / ((height - height * 0.12) / 2);
    } else if (layout === 'spread') {
      aspect = width / height;
    } else if (layout === 'panorama') {
      aspect = (width * 2) / height;
    }
    
    // Calculate zoom level to FIT the whole photo in the crop area
    const zoomToFit = photoAspect > aspect ? aspect / photoAspect : photoAspect / aspect;
    
    setCroppingPhoto({ id: photo.id, url: photo.url, aspect, baseZoom: zoomToFit });
    
    setCrop({ x: 0, y: 0 }); 
    setZoom(zoomToFit); 
    setCompletedCrop(null);
  };

  const getPageDimensions = () => {
    let width = 1200;
    let height = 1200;
    if (albumSize === '20x30') { width = 800; height = 1200; }
    if (albumSize === '30x40') { width = 1200; height = 1600; }
    return { width, height };
  };

  const generateAllPages = async () => {
    setIsGenerating(true);
    const newPages: string[] = [];
    
    let photoIdx = 0;
    for (let i = 0; i < pageLayouts.length; i++) {
      const layout = pageLayouts[i];
      const pageEffect = pageEffects[i] || 'none';
      let photosPerPage = 1;
      
      if (layout === 'grid') photosPerPage = 4;
      if (layout === 'vgrid') photosPerPage = 2;
      
      if (layout === 'panorama') {
        const pagePhotos = activePhotos.slice(photoIdx, photoIdx + 1);
        if (pagePhotos.length === 0) break;

        // Generate left half
        const pageDataLeft = await drawPage(pagePhotos, 'panorama', pageEffect, 'left');
        newPages.push(pageDataLeft);

        // Check if next page is also panorama to avoid double consumption of layout slots
        // But simpler to just push another index if we have more layout slots
        if (i + 1 < pageLayouts.length) {
          const pageDataRight = await drawPage(pagePhotos, 'panorama', pageEffect, 'right');
          newPages.push(pageDataRight);
          i++; // Skip next layout
        }
        photoIdx += 1;
      } else {
        const pagePhotos = activePhotos.slice(photoIdx, photoIdx + photosPerPage);
        if (pagePhotos.length === 0) break;
        
        const pageData = await drawPage(pagePhotos, layout, pageEffect);
        newPages.push(pageData);
        photoIdx += photosPerPage;
      }
    }

    setPages(newPages);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-black overflow-hidden">
      {/* Crop Modal */}
      <AnimatePresence>
        {croppingPhoto && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-[95vw] h-[90vh] rounded-[40px] overflow-hidden flex flex-col lg:flex-row border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              {/* Photo Area */}
              <div className="flex-1 relative bg-black flex flex-col mb-[env(safe-area-inset-bottom)]">
                <div className="absolute top-8 left-8 z-20 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <CropIcon size={22} className="text-brand-gold" />
                      Visualização do Álbum
                    </h3>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <Cropper
                    image={croppingPhoto.url}
                    crop={crop}
                    zoom={zoom}
                    aspect={croppingPhoto.aspect}
                    onCropChange={setCrop}
                    onCropComplete={(_, px) => setCompletedCrop(px)}
                    onZoomChange={setZoom}
                    showGrid={true}
                    restrictPosition={false}
                    minZoom={croppingPhoto.baseZoom}
                    maxZoom={croppingPhoto.baseZoom * 5}
                    classes={{
                      containerClassName: "rounded-lg",
                      cropAreaClassName: "border-2 border-brand-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.95)]",
                      mediaClassName: "max-w-none"
                    }}
                  />
                </div>
              </div>

              {/* Controls Sidebar */}
              <div className="w-full lg:w-96 p-8 lg:p-12 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-gray-500">Ajustes</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Refine o enquadramento final</p>
                  </div>
                  <button 
                    onClick={() => setCroppingPhoto(null)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Nível de Zoom</span>
                        <p className="text-[9px] text-gray-500 italic">Arraste para aproximar a foto</p>
                      </div>
                      <span className="text-xl font-mono text-brand-gold">{Math.round((zoom / (croppingPhoto?.baseZoom || 1)) * 100)}%</span>
                    </div>
                    <div className="relative group">
                      <input
                        type="range"
                        value={zoom}
                        min={croppingPhoto.baseZoom}
                        max={croppingPhoto.baseZoom * 5}
                        step={croppingPhoto.baseZoom / 100}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-brand-gold hover:accent-white transition-all overflow-hidden"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                      <span>100% (Cheio)</span>
                      <span>300%</span>
                      <span>500% (Máx)</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <h5 className="text-[9px] uppercase tracking-widest font-bold text-brand-gold flex items-center gap-2">
                      <Sparkles size={14} /> Dicas do Especialista
                    </h5>
                    <ul className="space-y-3">
                      {[
                        'Mantenha as feições centralizadas na grade.',
                        'Evite cortar mãos ou partes vitais do corpo.',
                        'O zoom ajuda a remover distrações do fundo.'
                      ].map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-[10px] text-gray-400 leading-relaxed">
                          <span className="text-brand-gold font-bold">{idx + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto flex flex-col gap-4">
                  <button 
                    onClick={onCropSave}
                    className="w-full py-5 rounded-2xl bg-brand-gold text-black font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <Check size={18} />
                    Confirmar Enquadramento
                  </button>
                  <button 
                    onClick={() => setCroppingPhoto(null)}
                    className="w-full py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors border border-white/10 hover:border-white/20"
                  >
                    Descartar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 bg-zinc-900 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold"
          >
            <ChevronLeft size={14} /> Voltar
          </button>
          
          <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest border ${
            userTier === 'ALBUM' 
              ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
              : userTier === 'LINK'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400'
          }`}>
            {userTier === 'ALBUM' ? 'Edition' : userTier === 'LINK' ? 'Link Edition' : 'Modo Demonstração'}
          </div>
        </div>

        {userTier !== 'ALBUM' && (
          <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl">
            <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles size={12} /> {userTier === 'PROSPECT' ? 'Modo de Demonstração' : 'Prévia Premium'}
            </p>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              {userTier === 'PROSPECT' 
                ? 'Estamos usando fotos de exemplo para você conhecer a qualidade. Adquira o Link Edition para usar suas próprias fotos!'
                : 'Você está visualizando suas fotos no modelo físico. Adquira a Edition para finalizar e receber seu álbum em casa.'}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Box size={14} /> Tamanho do Álbum
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['20x30', '30x30', '30x40'] as AlbumSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setAlbumSize(size)}
                className={`py-2 rounded-lg border text-[9px] font-bold tracking-widest transition-all ${
                  albumSize === size 
                    ? 'bg-brand-gold border-brand-gold text-black' 
                    : 'bg-black/40 border-white/10 text-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Box size={14} /> Material da Capa
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(['standard', 'premium', 'leather', 'acrylic', 'velvet', 'photo'] as MaterialType[]).map((type) => (
              <button
                key={type}
                onClick={() => setMaterialType(type)}
                className={`py-2 rounded-lg text-[8px] font-bold uppercase border transition-all ${
                  materialType === type ? 'bg-brand-gold border-brand-gold text-black' : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                {type === 'standard' ? 'Padrão' : 
                 type === 'premium' ? 'Premium' : 
                 type === 'leather' ? 'Couro' : 
                 type === 'acrylic' ? 'Acrílico' : 
                 type === 'velvet' ? 'Veludo' : 'Fotográfica'}
              </button>
            ))}
          </div>
        </div>

        {!hasPurchasedAlbum && (
          <div>
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
              <Sparkles size={14} /> Vídeo de Capa (Opcional)
            </h3>
            <input 
              type="text" 
              placeholder="URL do vídeo (MP4)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-brand-gold transition-all"
            />
            <p className="text-[8px] text-gray-500 mt-2 uppercase tracking-widest">Adicione um vídeo para a primeira página do seu álbum premium.</p>
          </div>
        )}

        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Layout size={14} /> Estilo Global
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'minimalist', icon: Maximize, label: 'Minimalista' },
              { id: 'grid', icon: Grid, label: 'Grade (4)' },
              { id: 'vgrid', icon: Layout, label: 'Vertical (2)' },
              { id: 'panorama', icon: Maximize, label: 'Panorâmico' },
              { id: 'spread', icon: ImageIcon, label: 'Sangrado' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleGlobalLayoutChange(item.id as LayoutType)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  globalLayout === item.id 
                    ? 'bg-brand-gold border-brand-gold text-black' 
                    : 'bg-black/40 border-white/10 text-gray-400 hover:border-brand-gold/50'
                }`}
              >
                <item.icon size={18} />
                <span className="text-[9px] uppercase font-bold tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Palette size={14} /> {hasPurchasedAlbum ? 'Edition Ativo' : 'Link Edition - Prévia'}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{photos.length} Fotos (R$ {PRICES.photo.toFixed(2)}/un)</span>
              <span>{hasPurchasedAlbum ? 'Incluído' : `R$ ${(photos.length * PRICES.photo).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{pages.length} Páginas Diagramadas</span>
              <span className="text-brand-gold/60">Grátis</span>
            </div>
            {PRICES.size[albumSize] > 0 && (
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Adicional Tamanho {albumSize}</span>
                <span>{hasPurchasedAlbum ? 'Incluído' : `R$ ${PRICES.size[albumSize].toFixed(2)}`}</span>
              </div>
            )}
            {PRICES.material[materialType] > 0 && (
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Adicional Material {materialType}</span>
                <span>{hasPurchasedAlbum ? 'Incluído' : `R$ ${PRICES.material[materialType].toFixed(2)}`}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold text-white">
              <span className="uppercase tracking-widest">{hasPurchasedAlbum ? 'Status do Álbum' : 'Valor do Álbum'}</span>
              <span className="text-brand-gold">
                {hasPurchasedAlbum ? 'PAGO' : `R$ ${totalPrice.toFixed(2)}`}
              </span>
            </div>
            
            {!hasPurchasedAlbum && (
              <div className="mt-2 p-3 bg-brand-gold/10 border border-brand-gold/30 rounded-xl">
                <p className="text-[9px] text-brand-gold uppercase tracking-wider font-bold mb-2">
                  ✨ Upgrade Disponível
                </p>
                <p className="text-[8px] text-gray-400 leading-relaxed mb-3">
                  Transforme seu link digital em um álbum físico **Edition** com diagramação profissional.
                </p>
                <button className="w-full bg-brand-gold text-black py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                  Adquirir Álbum Físico
                </button>
              </div>
            )}
          </div>
        </div>

        {materialType === 'photo' && (
          <div>
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Foto da Capa
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {activePhotos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setCoverPhotoId(photo.id)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${
                    coverPhotoId === photo.id ? 'border-brand-gold scale-110' : 'border-white/10 opacity-50'
                  }`}
                >
                  <img src={photo.url} alt="Cover option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Palette size={14} /> Efeito Global (Aplicar a Todos)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'none', label: 'Original' },
              { id: 'bw', label: 'P&B' },
              { id: 'sepia', label: 'Sépia' },
              { id: 'vintage', label: 'Vintage' },
              { id: 'vibrant', label: 'Vibrante' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setPageEffects(pageEffects.map(() => item.id as EffectType));
                }}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:border-brand-gold/50 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
          <button
            onClick={clearDraft}
            className="w-full bg-white/5 text-red-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all border border-white/5"
          >
            <RotateCcw size={14} />
            Limpar Todas Edições
          </button>

          <div className="flex items-center justify-center gap-2 text-[8px] text-gray-500 uppercase tracking-widest font-bold pb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
            Edições Salvas Automaticamente
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full bg-white/5 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10"
          >
            {showPreview ? <ImageIcon size={16} /> : <Sparkles size={16} />}
            {showPreview ? 'Ver Diagramação' : 'Visualizar em 3D'}
          </button>
          
          <button
            onClick={() => onSave?.(pages)}
            disabled={isGenerating}
            className="w-full bg-brand-gold text-black py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(212,175,55,0.4)] animate-pulse"
          >
            <Check size={16} />
            {hasPurchasedAlbum ? 'Finalizar Diagramação' : 'Confirmar e Comprar Álbum'}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative bg-[#050505] overflow-hidden">
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <Album3D 
                pages={pages} 
                currentPage={currentPage} 
                isOpen={true} 
                zoom={1} 
                videoUrl={videoUrl || undefined}
                materialType={materialType}
                coverTextureUrl={activePhotos.find(p => p.id === coverPhotoId)?.url || activePhotos[0]?.url}
              />
              
              {/* 3D Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl z-10">
                <button 
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors text-brand-gold"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">
                  Página {currentPage + 1} / {Math.ceil(pages.length / 2)}
                </div>
                <button 
                  onClick={() => setCurrentPage(Math.min(Math.floor(pages.length / 2), currentPage + 1))}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors text-brand-gold"
                >
                  <ArrowRight size={20} />
                </button>
                
                <div className="w-[1px] h-8 bg-white/10 mx-2" />
                
                <button 
                  onClick={() => onSave?.(pages)}
                  className="bg-brand-gold text-black px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
                >
                  <Check size={16} />
                  Confirmar Pagamento
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="2d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full p-8 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <Sparkles className="text-brand-gold" />
                    Diagramação Sugerida
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                    <Clock size={12} />
                    Gerado automaticamente
                  </div>
                </div>

                {isGenerating ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full"
                    />
                    <p className="text-xs uppercase tracking-widest text-gray-500">Otimizando diagramação...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-12">
                    {pages.map((page, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative"
                      >
                        <div className="flex flex-col lg:flex-row gap-12 bg-zinc-900/20 border border-white/5 p-12 rounded-[60px] hover:border-brand-gold/20 transition-all">
                          <div className={`flex-1 studio-bg rounded-3xl overflow-hidden flex items-center justify-center p-8 lg:p-12 relative`}>
                            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
                            
                            <div 
                              className="relative album-page-depth bg-black rounded-lg overflow-hidden transition-all duration-500 group-hover:scale-[1.01] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]"
                              style={{ 
                                width: '100%',
                                maxWidth: albumSize === '30x30' ? '500px' : albumSize === '20x30' ? '333px' : '500px',
                                aspectRatio: albumSize === '30x30' ? '1/1' : albumSize === '20x30' ? '2/3' : '3/4'
                              }}
                            >
                              <img src={page} alt={`Página ${i+1}`} className="w-full h-full object-contain" />
                              <div className="absolute inset-y-0 right-0 w-[4px] bg-gradient-to-l from-white/5 to-transparent border-r border-white/20" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                            </div>

                            {/* Lighting and Reflection on 'Floor' */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white/20 blur-[1px]" />
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[110%] h-40 bg-gradient-to-b from-white/5 to-transparent blur-3xl opacity-50 -z-10" />

                            <div className="absolute top-4 left-4 bg-brand-gold/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border border-brand-gold/20 text-brand-gold z-10">
                              Página {i + 1}
                            </div>
                          </div>
                          
                          <div className="w-full lg:w-64 space-y-8">
                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Layout size={14} className="text-brand-gold" /> Layout da Página
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'minimalist', label: 'Minimal' },
                                  { id: 'grid', label: 'Grade' },
                                  { id: 'vgrid', label: 'Vertical' },
                                  { id: 'panorama', label: 'Panorâmico' },
                                  { id: 'spread', label: 'Sangrado' }
                                ].map(l => (
                                  <button
                                    key={l.id}
                                    onClick={() => handlePageLayoutChange(i, l.id as LayoutType)}
                                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                                      pageLayouts[i] === l.id 
                                        ? 'bg-brand-gold border-brand-gold text-black' 
                                        : 'bg-black/40 border-white/10 text-white hover:border-brand-gold/50'
                                    }`}
                                  >
                                    {l.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Palette size={14} className="text-brand-gold" /> Efeito da Página
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'none', label: 'Original' },
                                  { id: 'bw', label: 'P&B' },
                                  { id: 'sepia', label: 'Sépia' },
                                  { id: 'vintage', label: 'Vintage' },
                                  { id: 'vibrant', label: 'Vibrante' }
                                ].map(e => (
                                  <button
                                    key={e.id}
                                    onClick={() => handlePageEffectChange(i, e.id as EffectType)}
                                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                                      pageEffects[i] === e.id 
                                        ? 'bg-brand-gold border-brand-gold text-black' 
                                        : 'bg-black/40 border-white/10 text-white hover:border-brand-gold/50'
                                    }`}
                                  >
                                    {e.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <CropIcon size={14} className="text-brand-gold" /> Ajustar Enquadramento
                              </h4>
                              <div className="space-y-2">
                                {getPagePhotos(i).map((photo, pIdx) => (
                                  <button 
                                    key={photo.id}
                                    onClick={() => openCropModalForPagePhoto(photo, pageLayouts[i])}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 hover:border-brand-gold/50 transition-all group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black">
                                        <img src={photo.thumbnail || photo.url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                      </div>
                                      <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 group-hover:text-white">Ajustar Foto {pIdx + 1}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-brand-gold/10 transition-colors">
                                      <CropIcon size={14} className="text-brand-gold" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Palette size={14} className="text-brand-gold" /> Estilo Sugerido
                              </h4>
                              <p className="text-[9px] text-gray-400 leading-relaxed italic">
                                "Este layout foi otimizado para destacar a composição desta página específica."
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlbumEditor;
