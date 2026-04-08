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
  Box
} from 'lucide-react';
import Album3D from './Album3D';

interface Photo {
  id: string;
  url: string;
  aspectRatio?: number;
}

interface AlbumEditorProps {
  photos: Photo[];
  onSave?: (pages: string[]) => void;
  onBack?: () => void;
  hasPurchasedAlbum?: boolean;
  userTier?: 'PROSPECT' | 'LINK' | 'ALBUM';
}

type LayoutType = 'minimalist' | 'grid' | 'collage' | 'editorial' | 'spread';
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

const AlbumEditor: React.FC<AlbumEditorProps> = ({ photos, onSave, onBack, hasPurchasedAlbum = false, userTier = 'PROSPECT' }) => {
  const activePhotos = photos.length > 0 ? photos : DEMO_PHOTOS;
  const [globalLayout, setGlobalLayout] = useState<LayoutType>('minimalist');
  const [effect, setEffect] = useState<EffectType>('none');
  const [albumSize, setAlbumSize] = useState<AlbumSize>('30x30');
  const [materialType, setMaterialType] = useState<MaterialType>('standard');
  const [videoUrl, setVideoUrl] = useState<string>(DEFAULT_VIDEO);
  const [pages, setPages] = useState<string[]>([]);
  const [pageLayouts, setPageLayouts] = useState<LayoutType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const totalPrice = (activePhotos.length * PRICES.photo) + PRICES.size[albumSize] + PRICES.material[materialType];
  
  // Initialize page layouts when photos change
  useEffect(() => {
    const photosPerPage = 1; // Default
    const numPages = Math.ceil(activePhotos.length / photosPerPage);
    setPageLayouts(new Array(numPages).fill(globalLayout));
  }, [activePhotos.length]);

  // Update all layouts when global layout changes
  const handleGlobalLayoutChange = (newLayout: LayoutType) => {
    setGlobalLayout(newLayout);
    setPageLayouts(pageLayouts.map(() => newLayout));
  };

  const handlePageLayoutChange = (index: number, newLayout: LayoutType) => {
    const newLayouts = [...pageLayouts];
    newLayouts[index] = newLayout;
    setPageLayouts(newLayouts);
  };

  // Generate pages whenever photos, layouts, or effect changes
  useEffect(() => {
    if (activePhotos.length > 0 && pageLayouts.length > 0) {
      generateAllPages();
    }
  }, [activePhotos, pageLayouts, effect, albumSize]);

  const applyEffect = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (effect === 'none') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (effect === 'bw') {
        const avg = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = data[i + 1] = data[i + 2] = avg;
      } else if (effect === 'sepia') {
        data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
        data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
        data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
      } else if (effect === 'vintage') {
        data[i] = r * 0.9;
        data[i + 1] = g * 0.8;
        data[i + 2] = b * 0.7;
      } else if (effect === 'vibrant') {
        const max = Math.max(r, g, b);
        data[i] += (max - r) * 0.2;
        data[i + 1] += (max - g) * 0.2;
        data[i + 2] += (max - b) * 0.2;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawPage = async (pagePhotos: Photo[], layout: LayoutType): Promise<string> => {
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

    // Background - use a slightly off-black for luxury feel
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Load images
    const loadedImages = await Promise.all(
      pagePhotos.map(p => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.src = p.url;
      }))
    );

    if (layout === 'minimalist') {
      if (loadedImages[0]) {
        const img = loadedImages[0];
        const margin = width * 0.12;
        const drawW = width - margin * 2;
        const drawH = (img.height / img.width) * drawW;
        const y = (height - drawH) / 2;
        
        // Shadow for the photo
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 30;
        ctx.drawImage(img, margin, y, drawW, drawH);
      }
    } else if (layout === 'grid') {
      const margin = width * 0.06;
      const gap = width * 0.04;
      const cols = 2;
      const rows = 2;
      const cellW = (width - margin * 2 - gap) / cols;
      const cellH = (height - margin * 2 - gap) / rows;

      loadedImages.forEach((img, i) => {
        if (i >= 4) return;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * (cellH + gap);
        
        const imgRatio = img.width / img.height;
        const cellRatio = cellW / cellH;
        let sw, sh, sx, sy;
        if (imgRatio > cellRatio) {
          sh = img.height;
          sw = sh * cellRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / cellRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);
      });
    } else if (layout === 'spread') {
      if (loadedImages[0]) {
        const img = loadedImages[0];
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let sw, sh, sx, sy;
        if (imgRatio > canvasRatio) {
          sh = img.height;
          sw = sh * canvasRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / canvasRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      }
    } else if (layout === 'editorial') {
      if (loadedImages[0]) {
        const img = loadedImages[0];
        ctx.drawImage(img, 0, 0, width, height * 0.7);
        
        // Gold line
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.1, height * 0.75);
        ctx.lineTo(width * 0.9, height * 0.75);
        ctx.stroke();

        ctx.fillStyle = '#D4AF37';
        ctx.font = `bold ${width * 0.05}px serif`;
        ctx.fillText('TOP LINE', width * 0.1, height * 0.82);
        ctx.fillStyle = '#fff';
        ctx.font = `italic ${width * 0.03}px serif`;
        ctx.fillText('Edition', width * 0.1, height * 0.87);
        
        ctx.fillStyle = '#666';
        ctx.font = `${width * 0.02}px sans-serif`;
        ctx.fillText('DIAGRAMAÇÃO EXCLUSIVA • 2026', width * 0.1, height * 0.92);
      }
    } else if (layout === 'collage') {
      loadedImages.forEach((img, i) => {
        if (i >= 2) return;
        ctx.save();
        const w = width * 0.6;
        const h = (img.height / img.width) * w;
        const x = i === 0 ? width * 0.05 : width - w - width * 0.05;
        const y = i === 0 ? height * 0.15 : height - h - height * 0.15;
        
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate((i === 0 ? -3 : 3) * Math.PI / 180);
        
        // White border for collage look
        ctx.fillStyle = '#fff';
        ctx.fillRect(-w/2 - 10, -h/2 - 10, w + 20, h + 20);
        
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 20;
        ctx.drawImage(img, -w/2, -h/2, w, h);
        ctx.restore();
      });
    }

    applyEffect(ctx, width, height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const generateAllPages = async () => {
    setIsGenerating(true);
    const newPages: string[] = [];
    
    let photoIdx = 0;
    for (let i = 0; i < pageLayouts.length; i++) {
      const layout = pageLayouts[i];
      let photosPerPage = 1;
      if (layout === 'grid') photosPerPage = 4;
      if (layout === 'collage') photosPerPage = 2;
      
      const pagePhotos = activePhotos.slice(photoIdx, photoIdx + photosPerPage);
      if (pagePhotos.length === 0) break;
      
      const pageData = await drawPage(pagePhotos, layout);
      newPages.push(pageData);
      photoIdx += photosPerPage;
    }

    setPages(newPages);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-black overflow-hidden">
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
              { id: 'spread', icon: ImageIcon, label: 'Sangrado' },
              { id: 'collage', icon: Layers, label: 'Artístico' },
              { id: 'editorial', icon: Type, label: 'Revista' }
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

        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Palette size={14} /> Efeitos de Imagem
          </h3>
          <div className="space-y-2">
            {[
              { id: 'none', label: 'Original' },
              { id: 'bw', label: 'Preto e Branco' },
              { id: 'sepia', label: 'Sépia Clássico' },
              { id: 'vintage', label: 'Vintage' },
              { id: 'vibrant', label: 'Vibrante' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setEffect(item.id as EffectType)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  effect === item.id 
                    ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' 
                    : 'bg-black/40 border-white/10 text-gray-400 hover:border-brand-gold/50'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                {effect === item.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
          <button
            onClick={() => {
              handleGlobalLayoutChange('minimalist');
              setEffect('none');
              setAlbumSize('30x30');
            }}
            className="w-full bg-white/5 text-gray-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5"
          >
            <RotateCcw size={14} />
            Resetar Estilo
          </button>

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
                coverTextureUrl={photos[0]?.url}
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
                        <div className="flex flex-col lg:flex-row gap-8 bg-zinc-900/40 border border-white/5 p-8 rounded-[40px] hover:border-brand-gold/30 transition-all">
                          <div className="flex-1 aspect-[1.414/1] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative">
                            <img src={page} alt={`Página ${i+1}`} className="w-full h-full object-contain" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-brand-gold">
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
                                  { id: 'spread', label: 'Sangrado' },
                                  { id: 'collage', label: 'Artístico' },
                                  { id: 'editorial', label: 'Revista' }
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
