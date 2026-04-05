import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Check, Search, Filter, Loader2, Heart } from 'lucide-react';
import { createClient } from '../utils/supabase/client';
const supabase = createClient();

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

interface GalleryProps {
  onSelect: (photos: Photo[]) => void;
}

export default function Gallery({ onSelect }: GalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PHOTOS_PER_PAGE = 24;

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setPhotos(data.map(p => ({
          id: p.id,
          url: p.url,
          thumbnail: p.thumbnail_url
        })));
      } else {
        // Fallback para mock se o banco estiver vazio
        const MOCK_PHOTOS: Photo[] = Array.from({ length: 50 }, (_, i) => ({
          id: `photo-${i}`,
          url: `https://picsum.photos/seed/grad-${i}/800/1200`,
          thumbnail: `https://picsum.photos/seed/grad-${i}/200/300`,
        }));
        setPhotos(MOCK_PHOTOS);
      }
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePhoto = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newFavorites = new Set(favoriteIds);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavoriteIds(newFavorites);
  };

  const handleContinue = () => {
    const selected = photos.filter(p => selectedIds.has(p.id));
    onSelect(selected);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black">
        <Loader2 className="w-12 h-12 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-32 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="topline-black text-2xl">Top Line <span className="gold-gradient italic lowercase tracking-normal">Black</span></h2>
              <span className="bg-brand-gold/20 text-brand-gold text-[10px] px-2 py-1 rounded-full font-bold border border-brand-gold/30">20 ANOS</span>
            </div>
            <p className="text-gray-500 text-sm">Selecione as fotos que farão parte do seu álbum exclusivo</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar fotos..."
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-hidden focus:border-brand-gold transition-colors"
              />
            </div>
            <button className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map((photo) => (
            <motion.div 
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => togglePhoto(photo.id)}
              className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group border-2 transition-colors ${
                selectedIds.has(photo.id) ? 'border-brand-gold' : 'border-transparent'
              }`}
            >
              <img 
                src={photo.thumbnail} 
                alt="Foto de formatura" 
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute inset-0 bg-brand-navy/40 transition-opacity ${
                selectedIds.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
              
              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                selectedIds.has(photo.id) ? 'bg-brand-gold scale-100' : 'bg-white/20 scale-0 group-hover:scale-100'
              }`}>
                <Check className="w-4 h-4 text-brand-navy" />
              </div>

              <button 
                onClick={(e) => toggleFavorite(e, photo.id)}
                className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                  favoriteIds.has(photo.id) ? 'bg-red-500 text-white scale-110' : 'bg-black/20 text-white/70 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${favoriteIds.has(photo.id) ? 'fill-current' : ''}`} />
              </button>
            </motion.div>
          ))}
        </div>

        {photos.length > PHOTOS_PER_PAGE && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-3 rounded-full border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-navy transition-all"
            >
              Ver mais
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-full flex items-center gap-8 z-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-brand-navy" />
              </div>
              <div>
                <p className="text-sm font-bold">{selectedIds.size} Fotos</p>
                <p className="text-xs text-gray-400">Selecionadas</p>
              </div>
            </div>
            <button 
              onClick={handleContinue}
              className="gold-button py-2 px-6"
            >
              Montar Álbum
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
