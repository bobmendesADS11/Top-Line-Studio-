import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Check, Search, Filter, Loader2, Heart, X, Upload, Trash2, Maximize2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

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
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PHOTOS_PER_PAGE = 24;

  useEffect(() => {
    if (!auth.currentUser) return;

    const photosRef = collection(db, 'users', auth.currentUser.uid, 'photos');
    const q = query(photosRef, orderBy('createdAt', 'desc'), limit(PHOTOS_PER_PAGE * page));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map(doc => ({
        id: doc.id,
        url: doc.data().url,
        thumbnail: doc.data().url // Using same for now
      }));
      setPhotos(fetchedPhotos);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching photos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [page]);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !auth.currentUser) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      for (const file of files) {
        // Convert file to Base64 for demo persistence in Firestore (1MB limit)
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Check if dataUrl is too large for Firestore (approx 1MB limit)
        if (dataUrl.length > 900000) {
          console.warn(`A imagem ${file.name} é muito grande.`);
          continue;
        }

        await addDoc(collection(db, 'users', auth.currentUser.uid, 'photos'), {
          url: dataUrl,
          name: file.name,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    setShowFinalizeModal(true);
  };

  const handleFinalize = async (pkg: 'link' | 'black') => {
    if (!auth.currentUser) return;
    
    try {
      const selected = photos.filter(p => selectedIds.has(p.id));
      // Create an order or update user profile
      await addDoc(collection(db, 'orders'), {
        studentUid: auth.currentUser.uid,
        studentEmail: auth.currentUser.email,
        package: pkg,
        photoIds: Array.from(selectedIds),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      onSelect(selected);
    } catch (error) {
      console.error("Error finalizing selection:", error);
    }
  };

  const handleDeletePhoto = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (!auth.currentUser || deletingId) return;
    
    setDeletingId(photoId);

    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'photos', photoId));
      
      const newSelected = new Set(selectedIds);
      newSelected.delete(photoId);
      setSelectedIds(newSelected);
      
      const newFavorites = new Set(favoriteIds);
      newFavorites.delete(photoId);
      setFavoriteIds(newFavorites);
    } catch (error) {
      console.error("Error deleting photo:", error);
    } finally {
      setDeletingId(null);
    }
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
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-brand-gold text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <Upload size={16} />
              {isUploading ? 'Enviando...' : 'Subir Fotos'}
            </button>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleUpload}
            />
            
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
              onDoubleClick={() => setPreviewPhoto(photo)}
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
                onClick={(e) => handleDeletePhoto(e, photo.id)}
                disabled={deletingId === photo.id}
                className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-10 ${
                  deletingId === photo.id ? 'bg-gray-500 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                }`}
              >
                {deletingId === photo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewPhoto(photo);
                }}
                className="absolute top-2 left-10 p-1.5 bg-white/10 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 z-10"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

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

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
          >
            <button 
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-0 right-0 p-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>
            <img 
              src={previewPhoto.url} 
              alt="" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-8 flex items-center gap-6">
              <button 
                onClick={() => {
                  togglePhoto(previewPhoto.id);
                  setPreviewPhoto(null);
                }}
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  selectedIds.has(previewPhoto.id) ? 'bg-white text-black' : 'bg-brand-gold text-black'
                }`}
              >
                {selectedIds.has(previewPhoto.id) ? 'Remover da Seleção' : 'Selecionar para o Álbum'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Finalize Selection Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Finalizar Seleção</h3>
              <button onClick={() => setShowFinalizeModal(false)} className="p-2 hover:bg-white/5 rounded-full">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-400 mb-8">Você selecionou <span className="text-white font-bold">{selectedIds.size} fotos</span>. Como deseja prosseguir?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => handleFinalize('link')}
                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} />
                </div>
                <h4 className="text-lg font-bold mb-2">Somente Fotos</h4>
                <p className="text-xs text-gray-500 mb-4">Receba o link com todas as suas fotos em alta resolução.</p>
                <p className="text-xl font-bold text-blue-400">Link Edition</p>
              </button>

              <button 
                onClick={() => handleFinalize('black')}
                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold mb-6 group-hover:scale-110 transition-transform">
                  <Check size={24} />
                </div>
                <h4 className="text-lg font-bold mb-2">Álbum + Fotos</h4>
                <p className="text-xs text-gray-500 mb-4">Receba seu álbum físico premium e o link com as fotos.</p>
                <p className="text-xl font-bold text-brand-gold">Black Edition</p>
              </button>
            </div>

            <div className="mt-8 p-6 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-brand-gold/20 rounded-lg text-brand-gold">
                <Check size={16} />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Ao finalizar, nossa equipe receberá sua seleção e entrará em contato para os próximos passos da produção.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
