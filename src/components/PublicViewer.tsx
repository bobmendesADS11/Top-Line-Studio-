import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, PresentationControls, Float } from '@react-three/drei';
import { motion } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Share2, 
  Heart, MessageCircle, ExternalLink, 
  Loader2, AlertCircle, Maximize2, Minimize2, Sparkles, GraduationCap
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import Album3D from './Album3D';

const supabase = createClient();

interface PublicViewerProps {
  albumId: string;
  onBack?: () => void;
}

export default function PublicViewer({ albumId, onBack }: PublicViewerProps) {
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAlbumData();
    // Auto-open after a short delay
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [albumId]);

  const fetchAlbumData = async () => {
    try {
      setLoading(true);
      // Fetch album with profile info
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select(`
          *,
          profiles:user_id (phone, course, class_year)
        `)
        .eq('id', albumId)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);

      // Fetch photos for this album
      // In a real app, we'd fetch from album_items. For now, we'll fetch photos owned by the same user
      // or use a mock if none found to show something.
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('url')
        .eq('user_id', albumData.user_id)
        .limit(20);

      if (photosError) throw photosError;
      
      const urls = photosData?.map(p => p.url) || [];
      setPhotos(urls.length > 0 ? urls : [
        'https://picsum.photos/seed/grad1/800/1200',
        'https://picsum.photos/seed/grad2/800/1200',
        'https://picsum.photos/seed/grad3/800/1200',
        'https://picsum.photos/seed/grad4/800/1200'
      ]);

    } catch (err: any) {
      console.error('Erro ao carregar álbum público:', err);
      setError('Não foi possível encontrar este álbum. Verifique o link e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
        <p className="font-serif text-xl animate-pulse">Abrindo Álbum Premium...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-serif mb-4">Ops! Álbum não encontrado</h2>
        <p className="text-gray-400 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="gold-button px-8 py-3"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(photos.length / 2);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden text-white">
      {/* Public Header */}
      <header className="glass px-6 py-4 flex items-center justify-between z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-lg font-serif tracking-tight">{album?.name || 'Álbum de Formatura'}</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">
                {album?.profiles?.course || 'Formando'}
              </p>
              <span className="w-1 h-1 rounded-full bg-brand-gold/40" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Turma {album?.profiles?.class_year || 'Top Line'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest">
            <Heart className="w-4 h-4 text-red-500" /> 128 Curtidas
          </button>
          <button className="gold-button px-6 py-2 text-xs font-bold">
            Criar Meu Álbum
          </button>
        </div>
      </header>

      {/* 3D Viewport */}
      <main className="flex-1 relative flex flex-col">
        <div className="flex-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <Album3D pages={photos} currentPage={currentPage} zoom={zoom} isOpen={isOpen} />
          
          {!isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            >
              <div className="glass px-6 py-3 rounded-full flex items-center gap-3 animate-bounce">
                <Sparkles className="w-5 h-5 text-brand-gold" />
                <span className="text-xs font-bold uppercase tracking-widest">Toque para Abrir</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Interaction Bar */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 glass px-8 py-4 rounded-full border border-white/10 shadow-2xl">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 disabled:opacity-20 hover:text-brand-gold transition-all hover:scale-110"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all ${
                      i === currentPage ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/20'
                    }`} 
                  />
                ))}
              </div>
              <span className="font-serif text-sm tracking-widest uppercase font-bold">
                Página <span className="text-brand-gold">{currentPage + 1}</span> de {totalPages}
              </span>
            </div>

            <button 
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 disabled:opacity-20 hover:text-brand-gold transition-all hover:scale-110"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <button 
              onClick={() => setZoom(zoom === 1 ? 1.8 : 1)}
              className={`p-3 rounded-full transition-all ${zoom > 1 ? 'bg-brand-gold text-brand-navy' : 'hover:text-brand-gold'}`}
            >
              {zoom > 1 ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4"
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all text-xs text-gray-400">
              <MessageCircle className="w-4 h-4" /> Deixar um Comentário
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all text-xs text-gray-400">
              <ExternalLink className="w-4 h-4" /> Ver no Site Oficial
            </button>
          </motion.div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="p-6 text-center text-gray-600 text-[10px] uppercase tracking-[0.2em]">
        Top Line Formaturas — Floripa • Sonhe, Acredite, Realize
      </footer>
    </div>
  );
}
