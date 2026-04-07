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
  Clock
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
}

type LayoutType = 'minimalist' | 'grid' | 'collage' | 'editorial';
type EffectType = 'none' | 'bw' | 'sepia' | 'vintage' | 'vibrant';

const AlbumEditor: React.FC<AlbumEditorProps> = ({ photos, onSave, onBack }) => {
  const [layoutType, setLayoutType] = useState<LayoutType>('minimalist');
  const [effect, setEffect] = useState<EffectType>('none');
  const [pages, setPages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate pages whenever photos, layout, or effect changes
  useEffect(() => {
    if (photos.length > 0) {
      generateAllPages();
    }
  }, [photos, layoutType, effect]);

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
        // Simple saturation boost
        const max = Math.max(r, g, b);
        data[i] += (max - r) * 0.2;
        data[i + 1] += (max - g) * 0.2;
        data[i + 2] += (max - b) * 0.2;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const drawPage = async (pagePhotos: Photo[]): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // High resolution for quality (A4-ish ratio)
    const width = 1200;
    const height = 1800;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Load all images for this page
    const loadedImages = await Promise.all(
      pagePhotos.map(p => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.src = p.url;
      }))
    );

    // Diagramming logic
    if (layoutType === 'minimalist') {
      // One big photo with margins
      if (loadedImages[0]) {
        const img = loadedImages[0];
        const margin = 100;
        const drawW = width - margin * 2;
        const drawH = (img.height / img.width) * drawW;
        const y = (height - drawH) / 2;
        ctx.drawImage(img, margin, y, drawW, drawH);
      }
    } else if (layoutType === 'grid') {
      // 2 or 4 photos in a grid
      const margin = 60;
      const gap = 40;
      const cols = pagePhotos.length > 2 ? 2 : 1;
      const rows = Math.ceil(pagePhotos.length / cols);
      const cellW = (width - margin * 2 - (cols - 1) * gap) / cols;
      const cellH = (height - margin * 2 - (rows - 1) * gap) / rows;

      loadedImages.forEach((img, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * (cellH + gap);
        
        // Object-fit: cover logic
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
    } else if (layoutType === 'editorial') {
      // One main photo + text or small accent
      if (loadedImages[0]) {
        ctx.drawImage(loadedImages[0], 0, 0, width, height * 0.7);
        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 40px serif';
        ctx.fillText('TOP LINE BLACK EDITION', 100, height * 0.8);
        ctx.fillStyle = '#666';
        ctx.font = '20px sans-serif';
        ctx.fillText('MEMÓRIAS ETERNAS • 2026', 100, height * 0.85);
      }
    } else if (layoutType === 'collage') {
      // Overlapping or dynamic placement
      loadedImages.forEach((img, i) => {
        ctx.save();
        const w = width * 0.6;
        const h = (img.height / img.width) * w;
        const x = i === 0 ? 50 : width - w - 50;
        const y = i === 0 ? 100 : height - h - 100;
        ctx.translate(x + w/2, y + h/2);
        ctx.rotate((i === 0 ? -5 : 5) * Math.PI / 180);
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 30;
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
    
    // Group photos into pages based on layout
    const photosPerPage = layoutType === 'grid' ? 4 : (layoutType === 'collage' ? 2 : 1);
    const groups: Photo[][] = [];
    for (let i = 0; i < photos.length; i += photosPerPage) {
      groups.push(photos.slice(i, i + photosPerPage));
    }

    for (const group of groups) {
      const pageData = await drawPage(group);
      newPages.push(pageData);
    }

    setPages(newPages);
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-black overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 bg-zinc-900 border-r border-white/5 p-6 flex flex-col gap-8 overflow-y-auto">
        <div>
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
            <Layout size={14} /> Diagramação Automática
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'minimalist', icon: Maximize, label: 'Minimalista' },
              { id: 'grid', icon: Grid, label: 'Grade' },
              { id: 'editorial', icon: Type, label: 'Editorial' },
              { id: 'collage', icon: Layers, label: 'Colagem' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setLayoutType(item.id as LayoutType)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  layoutType === item.id 
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
              setLayoutType('minimalist');
              setEffect('none');
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
            className="w-full bg-brand-gold text-black py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold/90 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            <Download size={16} />
            Finalizar Álbum
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
              <Album3D pages={pages} currentPage={currentPage} isOpen={true} zoom={1} />
              
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pages.map((page, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative"
                      >
                        <div className="aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5 transition-transform group-hover:scale-[1.02]">
                          <img src={page} alt={`Página ${i+1}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/10">
                          Página {i + 1}
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
