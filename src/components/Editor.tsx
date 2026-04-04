import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Save, Share2, Download, Layout, Layers, Sparkles, Loader2 } from 'lucide-react';
import Album3D from './Album3D';
import confetti from 'canvas-confetti';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

interface EditorProps {
  selectedPhotos: Photo[];
  onBack: () => void;
}

export default function Editor({ selectedPhotos, onBack }: EditorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.ceil(selectedPhotos.length / 2);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Criar o álbum
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          name: "Meu Álbum de Formatura",
          total_pages: Math.ceil(selectedPhotos.length / 2)
        })
        .select()
        .single();

      if (albumError) throw albumError;

      // 2. Criar páginas e itens (Simplificado para o exemplo)
      const pagesToInsert = Array.from({ length: album.total_pages }, (_, i) => ({
        album_id: album.id,
        page_number: i + 1
      }));

      const { data: pages, error: pagesError } = await supabase
        .from('album_pages')
        .insert(pagesToInsert)
        .select();

      if (pagesError) throw pagesError;

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#001F3F', '#FFFFFF']
      });
      
      alert('Álbum salvo com sucesso no Supabase!');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar no banco: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Header */}
      <header className="glass px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-serif">Editor 3D</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-brand-gold uppercase tracking-widest">Top Line Studio</p>
              <span className="text-[10px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded-sm font-bold">20 ANOS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm">
            <Layout className="w-4 h-4" /> Layout
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm">
            <Layers className="w-4 h-4" /> Camadas
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button 
            onClick={handleSave}
            disabled={loading}
            className="gold-button py-2 px-6 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar - Photo Pool */}
        <aside className="w-full md:w-64 bg-brand-black border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Fotos Selecionadas</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 md:grid-cols-2 gap-2">
            {selectedPhotos.map((photo) => (
              <div 
                key={photo.id}
                className="aspect-square rounded-lg overflow-hidden border border-white/10 cursor-move hover:border-brand-gold transition-colors"
              >
                <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </aside>

        {/* 3D Viewport */}
        <div className="flex-1 relative bg-[#050505]">
          <Album3D 
            pages={selectedPhotos.map(p => p.url)} 
            currentPage={currentPage} 
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 glass px-6 py-3 rounded-full">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 disabled:opacity-30 hover:text-brand-gold transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <span className="font-serif text-lg">
              Página <span className="text-brand-gold">{currentPage + 1}</span> de {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 disabled:opacity-30 hover:text-brand-gold transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="absolute top-8 right-8 flex flex-col gap-2">
            <button className="p-3 glass rounded-full hover:bg-white/20 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-3 glass rounded-full hover:bg-white/20 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
