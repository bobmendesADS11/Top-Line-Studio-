import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Save, Share2, Download, 
  Layout, Layers, Sparkles, Loader2, Maximize2, 
  Minimize2, RotateCcw, Sliders, Palette, Type, 
  Trash2, Plus, Wand2, Sun, Contrast, Moon, CheckCircle2
} from 'lucide-react';
import Album3D from './Album3D';
import confetti from 'canvas-confetti';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

interface PageConfig {
  layout: 'single' | 'double' | 'collage';
  background: string;
  filter: string;
  brightness: number;
  contrast: number;
}

interface EditorProps {
  selectedPhotos: Photo[];
  onBack: () => void;
}

export default function Editor({ selectedPhotos, onBack }: EditorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'filters' | 'text' | 'bg'>('layout');
  const [zoom, setZoom] = useState(1);
  const [isPreview, setIsPreview] = useState(false);
  
  // State for page customizations
  const totalPages = Math.ceil(selectedPhotos.length / 2);
  const [pageConfigs, setPageConfigs] = useState<Record<number, PageConfig>>(
    Object.fromEntries(
      Array.from({ length: totalPages }, (_, i) => [
        i, 
        { layout: 'double', background: '#1a1a1a', filter: 'none', brightness: 100, contrast: 100 }
      ])
    )
  );

  const currentConfig = pageConfigs[currentPage] || { 
    layout: 'double', background: '#1a1a1a', filter: 'none', brightness: 100, contrast: 100 
  };

  const updateConfig = (updates: Partial<PageConfig>) => {
    setPageConfigs(prev => ({
      ...prev,
      [currentPage]: { ...prev[currentPage], ...updates }
    }));
  };

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get current album or create one if it doesn't exist
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let albumId = album?.id;

      if (!albumId) {
        const { data: newAlbum, error: createError } = await supabase
          .from('albums')
          .insert({
            user_id: user.id,
            name: "Meu Álbum de Formatura",
            total_pages: totalPages,
            status: 'editing'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        albumId = newAlbum.id;
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?albumId=${albumId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFFFFF']
      });

      alert('Link de compartilhamento copiado para a área de transferência!');
    } catch (err: any) {
      console.error('Erro ao compartilhar:', err);
      alert('Erro ao gerar link: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Update album status to finished
      const { error: albumError } = await supabase
        .from('albums')
        .update({ status: 'finished' })
        .eq('user_id', user.id)
        .eq('status', 'editing');

      if (albumError) throw albumError;

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#001F3F', '#FFFFFF']
      });

      alert('Álbum Finalizado com Sucesso! 🎓\n\nUma confirmação foi enviada para o seu WhatsApp e para a equipe Top Line. Em breve entraremos em contato para a produção física.');
      onBack();
    } catch (err: any) {
      console.error('Erro ao finalizar:', err);
      alert('Erro ao finalizar álbum: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass px-6 py-3 flex items-center justify-between z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div>
            <h1 className="topline-black text-sm tracking-[0.3em]">Top Line <span className="gold-gradient italic lowercase tracking-normal text-lg">Black</span></h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">20 Anos de Experiência</p>
              <span className="w-1 h-1 rounded-full bg-brand-gold/40" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Projeto: Formatura 2026</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 mr-4">
            <button 
              onClick={() => setIsPreview(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isPreview ? 'bg-brand-gold text-brand-navy' : 'text-gray-400 hover:text-white'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isPreview ? 'bg-brand-gold text-brand-navy' : 'text-gray-400 hover:text-white'}`}
            >
              Preview
            </button>
          </div>
          
          <button 
            onClick={handleShare}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>

          <button 
            onClick={handleFinalize}
            disabled={loading}
            className="gold-button py-2 px-6 text-sm flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Finalizando...' : 'Finalizar Álbum'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {isPreview ? (
          <div className="flex-1 bg-[#050505] relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass px-4 py-2 rounded-full border border-brand-gold/30">
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Visualização do Convidado</p>
            </div>
            <Album3D 
              pages={selectedPhotos.map(p => p.url)} 
              currentPage={currentPage} 
              zoom={zoom}
              isOpen={true}
            />
            {/* Simple controls for preview */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 glass px-8 py-4 rounded-full border border-white/10">
              <button 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 disabled:opacity-20 hover:text-brand-gold transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <span className="font-serif text-sm tracking-widest uppercase font-bold">
                Página {currentPage + 1} de {totalPages}
              </span>
              <button 
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 disabled:opacity-20 hover:text-brand-gold transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Assets */}
        <aside className="w-72 bg-brand-black border-r border-white/5 flex flex-col z-40">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Suas Fotos</p>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {selectedPhotos.map((photo) => (
                <motion.div 
                  key={photo.id}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-square rounded-xl overflow-hidden border border-white/10 cursor-grab active:cursor-grabbing group relative"
                >
                  <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 relative bg-[#080808] flex flex-col">
          <div className="flex-1 relative">
            <Album3D 
              pages={selectedPhotos.map(p => p.url)} 
              currentPage={currentPage} 
              zoom={zoom}
            />
            
            {/* Contextual Floating Tools */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 glass p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              <button 
                onClick={handleShare}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-brand-gold hover:text-white flex items-center gap-2 px-4" 
                title="Compartilhar"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Compartilhar</span>
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white" title="Girar">
                <RotateCcw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={() => setZoom(zoom === 1 ? 1.8 : 1)}
                className={`p-2.5 rounded-xl transition-all ${zoom > 1 ? 'bg-brand-gold text-brand-navy' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`} 
                title={zoom > 1 ? "Zoom Out" : "Zoom In"}
              >
                {zoom > 1 ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white" title="Remover">
                <Trash2 className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button className="p-2.5 bg-brand-gold/10 text-brand-gold rounded-xl transition-colors" title="Auto Layout">
                <Wand2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="p-8 flex items-center justify-center gap-8 z-40">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-3 glass rounded-full disabled:opacity-20 hover:text-brand-gold transition-all hover:scale-110"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all ${
                      i === currentPage ? 'w-8 bg-brand-gold' : 'w-2 bg-white/10'
                    }`} 
                  />
                ))}
              </div>
              <span className="font-serif text-lg tracking-widest uppercase text-xs font-bold text-gray-500">
                Página <span className="text-white">{currentPage + 1}</span> de {totalPages}
              </span>
            </div>

            <button 
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-3 glass rounded-full disabled:opacity-20 hover:text-brand-gold transition-all hover:scale-110"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </main>

        {/* Right Sidebar - Tools */}
        <aside className="w-80 bg-brand-black border-l border-white/5 flex flex-col z-40">
          <div className="flex border-b border-white/5">
            {[
              { id: 'layout', icon: <Layout className="w-4 h-4" /> },
              { id: 'filters', icon: <Sliders className="w-4 h-4" /> },
              { id: 'bg', icon: <Palette className="w-4 h-4" /> },
              { id: 'text', icon: <Type className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 flex justify-center transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'layout' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Layout da Página</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['single', 'double', 'collage'].map((l) => (
                      <button 
                        key={l}
                        onClick={() => updateConfig({ layout: l as any })}
                        className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                          currentConfig.layout === l ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        <Layout className="w-6 h-6" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">{l}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'filters' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Ajustes</p>
                      <button className="text-[10px] text-brand-gold uppercase font-bold">Reset</button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                          <span className="flex items-center gap-2"><Sun className="w-3 h-3" /> Brilho</span>
                          <span>{currentConfig.brightness}%</span>
                        </div>
                        <input 
                          type="range" min="50" max="150" 
                          value={currentConfig.brightness}
                          onChange={(e) => updateConfig({ brightness: parseInt(e.target.value) })}
                          className="w-full accent-brand-gold h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                          <span className="flex items-center gap-2"><Contrast className="w-3 h-3" /> Contraste</span>
                          <span>{currentConfig.contrast}%</span>
                        </div>
                        <input 
                          type="range" min="50" max="150" 
                          value={currentConfig.contrast}
                          onChange={(e) => updateConfig({ contrast: parseInt(e.target.value) })}
                          className="w-full accent-brand-gold h-1 bg-white/10 rounded-full appearance-none cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Filtros Artísticos</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['None', 'Mono', 'Sepia', 'Vivid', 'Warm', 'Cool'].map((f) => (
                        <button 
                          key={f}
                          onClick={() => updateConfig({ filter: f.toLowerCase() })}
                          className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                            currentConfig.filter === f.toLowerCase() ? 'bg-brand-gold text-brand-navy border-brand-gold' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'bg' && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Cor de Fundo</p>
                  <div className="grid grid-cols-5 gap-2">
                    {['#000000', '#1a1a1a', '#2a2a2a', '#FFFFFF', '#f5f5f5', '#D4AF37', '#001F3F', '#4A0E0E'].map((c) => (
                      <button 
                        key={c}
                        onClick={() => updateConfig({ background: c })}
                        className={`aspect-square rounded-full border-2 transition-all ${
                          currentConfig.background === c ? 'border-brand-gold scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 border-t border-white/5">
            <button className="w-full py-4 glass rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold" /> Sugestão de Layout IA
            </button>
          </div>
        </aside>
      </>
    )}
    </div>
  </div>
  );
}
