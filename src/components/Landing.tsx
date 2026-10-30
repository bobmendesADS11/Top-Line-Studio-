import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, ArrowRight, Users, Calendar, Award, MapPin, CheckCircle2, Play, ChevronDown, BookOpen, MousePointer2, Image as ImageIcon, LogIn, Menu, X, Instagram, Facebook, Phone } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep Obsidian Radial Vignette - Pure luxury black with subtle center illumination */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(22,20,18,0.45)_0%,rgba(8,8,8,0.95)_75%,rgba(4,4,4,1)_100%)]" />
      
      {/* Refined, Elegant Atmospheric Smoke / Mist (Subtle & Soft) */}
      <motion.div 
        animate={{ 
          opacity: [0.12, 0.22, 0.12],
          scale: [1, 1.04, 1],
          x: [0, 15, 0]
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.05)_0%,rgba(180,140,40,0.015)_50%,transparent_75%)] blur-[80px]"
      />
      
      {/* Delicate Edge Mist (Far softer than before to prevent side haze) */}
      <div className="absolute -top-20 -right-20 w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.025)_0%,transparent_70%)] blur-[100px]" />
      <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.02)_0%,transparent_70%)] blur-[100px]" />

      {/* Flowing Curved Wave of Particles (Delicate gold dust) */}
      {[...Array(24)].map((_, i) => {
        const size = Math.random() * 2.5 + 1;
        const delay = i * 0.35;
        const duration = 16 + Math.random() * 6;
        
        return (
          <motion.div
            key={`wave-particle-${i}`}
            initial={{ 
              opacity: 0,
              x: "-10%",
              y: (45 + Math.sin(i * 0.5) * 10) + "%",
            }}
            animate={{ 
              opacity: [0, 0.6, 0.6, 0],
              x: "110%",
              y: (45 + Math.sin((i + 15) * 0.5) * 15) + "%",
            }}
            transition={{ 
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "linear"
            }}
            className="absolute rounded-full bg-brand-gold shadow-[0_0_6px_rgba(212,175,55,0.3)]"
            style={{ width: size, height: size }}
          />
        );
      })}

      {/* Subtle Background Stardust */}
      {[...Array(10)].map((_, i) => {
        const size = Math.random() * 3 + 1.5;
        const opacity = Math.random() * 0.1 + 0.03;
        
        return (
          <motion.div
            key={`bokeh-${i}`}
            initial={{ 
              opacity: 0,
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%"
            }}
            animate={{ 
              opacity: [0, opacity, 0],
              y: [null, (Math.random() * -25 - 10) + "px"]
            }}
            transition={{ 
              duration: Math.random() * 8 + 8, 
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
            className="absolute rounded-full bg-brand-gold/30 blur-[1.5px]"
            style={{ width: size, height: size }}
          />
        );
      })}

      {/* Subtle Twinkling Sparkles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ 
            opacity: 0,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: 0
          }}
          animate={{ 
            opacity: [0, 0.4, 0],
            scale: [0, 1, 0],
          }}
          transition={{ 
            duration: Math.random() * 4 + 4, 
            repeat: Infinity,
            delay: Math.random() * 8,
          }}
          className="absolute"
        >
          <Sparkles className="text-brand-gold/25 w-2.5 h-2.5" />
        </motion.div>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <div className="relative w-10 h-10 overflow-hidden rounded-lg bg-zinc-900 border border-brand-gold/30 shadow-lg group-hover:border-brand-gold transition-colors">
        <motion.div 
          animate={{ y: [0, -120, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex flex-col gap-1 p-1"
        >
            {[1, 2, 3, 4, 5, 6].map((i) => (
            <img loading="lazy" decoding="async" 
              key={i}
              src={`https://picsum.photos/seed/grad_logo_${i}/100/100`} 
              className="w-full aspect-square object-cover rounded-md opacity-30 group-hover:opacity-60 transition-opacity"
              referrerPolicy="no-referrer"
            />
          ))}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="text-brand-gold w-5 h-5 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
        </div>
      </div>
      <div className="flex items-center gap-3 relative group">
        {/* Brand: TOP LINE STUDIO & FORMATURAS */}
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-baseline gap-1.5">
            <div className="flex gap-1 font-serif text-[11px] text-white uppercase tracking-[0.2em]">
              <span>Top</span>
              <span>Line</span>
            </div>
            <span className="font-script text-base gold-gradient leading-none inline-block pr-1.5 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
              Studio
            </span>
          </div>
          <span className="text-[6px] text-white/50 uppercase tracking-[0.4em] mt-1.5 pl-0.5">Formaturas</span>
        </div>

        {/* 20 Anos Badge - Vertical Stack */}
        <div className="flex flex-col items-center justify-center pl-2.5 border-l border-white/10 -mt-0.5">
          <GraduationCap className="text-brand-gold w-3 h-3 mb-[-3px] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <span className="font-script text-base gold-gradient leading-tight inline-block px-1.5 py-0.5 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
            20
          </span>
          <span className="font-script text-[8px] gold-gradient -mt-1.5 inline-block px-1">
            anos
          </span>
        </div>
      </div>
    </div>
  );
}

function AlbumShowcase({ currentStep, onStepChange }: { currentStep: number, onStepChange: (step: number) => void }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([1, 2, 3, 5]);
  const [albumSpread, setAlbumSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const albumSpreads = [
    {
      title: "Lâmina Master · Colação Solene",
      category: "Rito Tradicional",
      pageLeft: "Pág. 12",
      pageRight: "Pág. 13",
      leftImg: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      rightImg1: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
      rightImg2: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      rightTag1: "Discurso & Juramento",
      rightTag2: "Entrega do Diploma"
    },
    {
      title: "Lâmina Master · O Grande Baile",
      category: "Noite de Gala",
      pageLeft: "Pág. 24",
      pageRight: "Pág. 25",
      leftImg: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
      rightImg1: "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=800&q=80",
      rightImg2: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
      rightTag1: "Valsa dos Formandos",
      rightTag2: "Brinde com a Turma"
    },
    {
      title: "Lâmina Master · Família & Conquista",
      category: "Legado Eterno",
      pageLeft: "Pág. 36",
      pageRight: "Pág. 37",
      leftImg: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&w=1200&q=80",
      rightImg1: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      rightImg2: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
      rightTag1: "Abraço de Vitória",
      rightTag2: "Chuva de Ouro"
    }
  ];

  const handleNextSpread = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setAlbumSpread(prev => (prev + 1) % albumSpreads.length);
      setIsFlipping(false);
    }, 250);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setLayoutSeed(prev => prev + 1);
      setIsGenerating(false);
    }, 2000);
  };

  const togglePhoto = (id: number) => {
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        onStepChange((currentStep + 1) % 3);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered, currentStep, onStepChange]);

  const steps = [
    {
      title: "Escolha suas Fotos",
      icon: MousePointer2,
      content: (
        <div className="flex flex-col justify-between h-full p-8 min-h-[580px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">
                {selectedPhotos.length} fotos selecionadas
              </span>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest text-white/60">Sincronizado</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1 items-stretch">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => togglePhoto(i)}
                className={`aspect-square rounded-xl border overflow-hidden relative group cursor-pointer transition-all duration-300 ${selectedPhotos.includes(i) ? 'border-brand-gold ring-2 ring-brand-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-white/10 grayscale hover:grayscale-0'}`}
              >
                <img loading="lazy" decoding="async" 
                  src={`https://picsum.photos/seed/graduation_cap_${i}/400/400`} 
                  alt="Graduation" 
                  className={`w-full h-full object-cover transition-all duration-500 ${selectedPhotos.includes(i) ? 'scale-105 opacity-100' : 'opacity-50 group-hover:opacity-100'}`}
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${selectedPhotos.includes(i) ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${selectedPhotos.includes(i) ? 'bg-brand-gold text-black scale-100' : 'bg-white/20 text-white scale-90'}`}>
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => onStepChange(1)}
              className="px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all duration-300 active:scale-95 shadow-lg"
            >
              Próximo Passo
            </button>
          </div>
        </div>
      )
    },
    {
      title: "Design Inteligente",
      icon: Sparkles,
      content: (
        <div className="flex flex-col justify-between h-full p-8 min-h-[580px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.25em] text-brand-gold font-bold flex items-center gap-2">
                <Sparkles size={13} className="text-brand-gold" />
                Inteligência Artificial Top Line
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: isGenerating ? ['-100%', '100%'] : ['-100%', '100%'] }}
                    transition={{ duration: isGenerating ? 0.8 : 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-1/2 bg-brand-gold rounded-full"
                  />
                </div>
                <span className="text-[9px] text-white/50 tracking-wider">
                  {isGenerating ? 'Analisando proporções e narrativa...' : 'Otimizando layout e harmonia visual'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Workspace Canvas */}
          <div className="relative flex-1 rounded-2xl bg-zinc-900/90 border border-brand-gold/30 shadow-2xl overflow-hidden p-5 flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-transparent pointer-events-none" />

            {/* Scan line effect */}
            <motion.div 
              animate={{ top: isGenerating ? ['-10%', '110%'] : ['-10%', '110%'] }}
              transition={{ duration: isGenerating ? 1.5 : 4, repeat: Infinity, ease: "linear" }}
              className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent z-20 blur-sm ${isGenerating ? 'opacity-100' : 'opacity-40'}`}
            />

            <div className="grid grid-cols-12 gap-3.5 flex-1 relative z-10">
              {/* Main hero spread */}
              <motion.div 
                key={`main-${layoutSeed}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="col-span-7 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden relative shadow-2xl group/card"
              >
                <img loading="lazy" decoding="async" 
                  src={`https://picsum.photos/seed/photo_album_design_${layoutSeed}/800/600`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[9px] font-serif uppercase tracking-[0.18em] text-white/90">Lâmina Master · Retrato</span>
                  <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-semibold">Diagramado</span>
                </div>

                {!isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-3 right-3"
                  >
                    <Sparkles className="text-brand-gold w-4 h-4" />
                  </motion.div>
                )}
              </motion.div>

              {/* Side preview spreads */}
              <div className="col-span-5 flex flex-col gap-3">
                <motion.div 
                  key={`side1-${layoutSeed}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="flex-1 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden relative shadow-md group/side"
                >
                  <img loading="lazy" decoding="async" 
                    src={`https://picsum.photos/seed/page_layout_${layoutSeed}/500/350`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/side:scale-105" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover/side:bg-transparent transition-colors" />
                  <span className="absolute bottom-2 left-2.5 text-[8px] tracking-wider text-white/80 font-mono">Pág. 08 · Colação</span>
                </motion.div>

                <motion.div 
                  key={`side2-${layoutSeed}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex-1 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden relative shadow-md group/side"
                >
                  <img loading="lazy" decoding="async" 
                    src={`https://picsum.photos/seed/photo_editing_${layoutSeed}/500/350`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/side:scale-105" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover/side:bg-transparent transition-colors" />
                  <span className="absolute bottom-2 left-2.5 text-[8px] tracking-wider text-white/80 font-mono">Pág. 09 · Baile Gala</span>
                </motion.div>
              </div>
            </div>

            {/* Canvas bottom controls */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`px-5 py-2 rounded-full border border-brand-gold/50 bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-brand-gold hover:text-black active:scale-95 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? 'Gerando Layout...' : 'Gerar Novo Layout'}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[8px] uppercase tracking-wider text-white/40">Formandos:</span>
                <div className="flex -space-x-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-zinc-900 bg-zinc-800 overflow-hidden">
                      <img loading="lazy" decoding="async" src={`https://picsum.photos/seed/person${i}/50/50`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-5 h-5 rounded-full border border-zinc-900 bg-brand-gold flex items-center justify-center text-[7px] font-bold text-black">
                    +12
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => onStepChange(2)}
              className="px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all duration-300 active:scale-95 shadow-lg"
            >
              Próximo Passo
            </button>
          </div>
        </div>
      )
    },
    {
      title: "Visualização 3D",
      icon: BookOpen,
      content: (
        <div className="flex flex-col justify-between h-full p-8 min-h-[580px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.25em] text-brand-gold font-bold flex items-center gap-2">
                <BookOpen size={13} className="text-brand-gold" />
                Visualização 3D Realista
              </span>
              <span className="text-[9px] text-white/50 tracking-wider mt-1">
                Abertura panorâmica 180° e acabamento com laminação premium
              </span>
            </div>
          </div>

          {/* Main 3D Showroom Canvas */}
          <div className="relative flex-1 rounded-2xl bg-zinc-900/90 border border-brand-gold/30 shadow-2xl overflow-hidden p-5 flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-transparent pointer-events-none" />

            {/* Showroom Spotlight Cone from above */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-4/5 h-44 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.22)_0%,rgba(212,175,55,0.03)_60%,transparent_80%)] blur-2xl pointer-events-none" />

            {/* Top Canvas Bar inside the frame */}
            <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-serif uppercase tracking-[0.18em] text-white/90 flex items-center gap-1.5">
                  <BookOpen size={11} className="text-brand-gold" />
                  {albumSpreads[albumSpread].title}
                </span>
                <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-semibold">
                  {albumSpreads[albumSpread].category}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono tracking-wider text-brand-gold/80 bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/20">
                  {albumSpreads[albumSpread].pageLeft} · {albumSpreads[albumSpread].pageRight}
                </span>
              </div>
            </div>

            {/* 3D Stage with commanding Album Presence */}
            <div className="flex-1 flex items-center justify-center relative w-full my-auto py-2">
              <div className="relative w-full max-w-xl lg:max-w-2xl aspect-[1.9/1] flex perspective-2000 items-center justify-center">
                {/* Contact Shadow & Pedestal Glow */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[92%] h-7 bg-black/90 blur-xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[75%] h-3.5 bg-brand-gold/25 blur-md rounded-full pointer-events-none" />

                <motion.div 
                  key={albumSpread}
                  initial={{ rotateY: -18, rotateX: 6, scale: 0.96 }}
                  animate={{ 
                    rotateY: [-18, -4, -18],
                    rotateX: [6, 2, 6],
                    scale: 1,
                  }}
                  transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-full h-full flex preserve-3d shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-lg"
                >
                  {/* Heavy Hardcover Frame (Spine & Backing with gold border) */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-lg -z-10 border border-brand-gold/45 shadow-[0_0_25px_rgba(212,175,55,0.2)]" />

                  {/* Gilded Page Edges (Borda Dourada / Gold Foil) */}
                  <div className="absolute -bottom-0.5 left-2 right-2 h-1 bg-gradient-to-r from-brand-gold/50 via-brand-gold to-brand-gold/50 shadow-[0_2px_8px_rgba(212,175,55,0.6)]" />

                  {/* Left Page (Full Panoramic / Bleed Masterpiece) */}
                  <div className="flex-1 bg-[#141414] rounded-l-md relative overflow-hidden shadow-[inset_-20px_0_35px_rgba(0,0,0,0.7)] origin-right border-y border-l border-white/10 group/page">
                    <img loading="lazy" decoding="async" 
                      src={albumSpreads[albumSpread].leftImg} 
                      alt="Lâmina Panorâmica"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/page:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {/* Layflat curvature shading */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/80 to-transparent" />
                    
                    {/* Gold watermark badge */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-brand-gold/30">
                      <GraduationCap size={10} className="text-brand-gold" />
                      <span className="text-[7px] font-serif tracking-[0.2em] text-brand-gold uppercase">Top Line Studio</span>
                    </div>

                    {/* Lamination sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-50" />
                  </div>

                  {/* Central Layflat Spine Gutter (180° seamless) */}
                  <div className="w-1.5 bg-[#0a0a0a] relative z-20 shadow-[0_0_16px_rgba(0,0,0,1)] border-x border-white/10 flex flex-col justify-between py-2">
                    <div className="w-full h-2 bg-brand-gold/60 rounded-full" />
                    <div className="w-full h-2 bg-brand-gold/60 rounded-full" />
                  </div>

                  {/* Right Page (Double Photo Composition) */}
                  <div className="flex-1 bg-[#141414] rounded-r-md relative overflow-hidden shadow-[inset_20px_0_35px_rgba(0,0,0,0.7)] p-2.5 sm:p-3.5 flex flex-col gap-2.5 border-y border-r border-white/10 group/page">
                    {/* Top photo */}
                    <div className="flex-1 rounded-sm overflow-hidden relative shadow-md group/sub">
                      <img loading="lazy" decoding="async" 
                        src={albumSpreads[albumSpread].rightImg1} 
                        alt="Momento 1"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/sub:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <span className="absolute bottom-1 left-1.5 text-[7px] font-mono tracking-wider text-white/90">
                        {albumSpreads[albumSpread].rightTag1}
                      </span>
                    </div>

                    {/* Bottom photo */}
                    <div className="flex-1 rounded-sm overflow-hidden relative shadow-md group/sub">
                      <img loading="lazy" decoding="async" 
                        src={albumSpreads[albumSpread].rightImg2} 
                        alt="Momento 2"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/sub:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <span className="absolute bottom-1 left-1.5 text-[7px] font-mono tracking-wider text-white/90">
                        {albumSpreads[albumSpread].rightTag2}
                      </span>
                    </div>

                    {/* Inner gutter shadow */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />

                    {/* Lamination sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/10 to-transparent pointer-events-none opacity-50" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Canvas bottom controls (matching Step 2) */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <button 
                onClick={handleNextSpread}
                disabled={isFlipping}
                className={`px-5 py-2 rounded-full border border-brand-gold/50 bg-brand-gold/10 text-brand-gold text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-brand-gold hover:text-black active:scale-95 flex items-center gap-2 ${isFlipping ? 'opacity-50' : ''}`}
              >
                <Sparkles size={11} />
                {isFlipping ? 'Virando Lâmina...' : 'Folhear Lâmina 3D'}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[8px] uppercase tracking-wider text-white/40 hidden sm:inline">Acabamento:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                    Silk 800g
                  </span>
                  <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold border border-brand-gold/30 font-semibold">
                    Borda Dourada
                  </span>
                  <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 hidden sm:inline">
                    Layflat 180°
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="group relative px-10 py-3.5 rounded-full bg-brand-gold text-black text-[10px] font-black uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_35px_rgba(212,175,55,0.4)]"
            >
              <div className="absolute inset-0 bg-white translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 group-hover:text-black flex items-center gap-2">
                <Sparkles size={13} className="text-black" />
                Criar meu Álbum Agora
              </span>
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div 
      className="mt-20 flex flex-col lg:flex-row bg-zinc-950 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Side: Info */}
      <div className="lg:w-[400px] p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-zinc-900/30 flex flex-col justify-between">
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className={`flex gap-5 cursor-pointer p-3 rounded-2xl transition-all duration-500 ${currentStep === i ? 'bg-white/5 opacity-100 translate-x-1.5 border border-brand-gold/25' : 'opacity-35 hover:opacity-70 hover:bg-white/[0.02] border border-transparent'}`}
              onClick={() => onStepChange(i)}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${currentStep === i ? 'bg-brand-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white'}`}>
                <s.icon size={22} />
              </div>
              <div>
                <h4 className="text-lg font-serif mb-1 text-white">{s.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {i === 0 && "Selecione as fotos que marcaram sua trajetória de forma simples e intuitiva."}
                  {i === 1 && "Nossa tecnologia organiza suas memórias com o requinte que você merece."}
                  {i === 2 && "Visualize seu álbum digitalmente em um ambiente 3D antes mesmo de ser impresso."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side: Interactive Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex flex-col min-h-[580px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full flex flex-col justify-between"
          >
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        {/* Decorative badge */}
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 pointer-events-none backdrop-blur-sm z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-brand-gold">Preview Interativo</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const albumRef = useRef<HTMLElement>(null);
  const [albumStep, setAlbumStep] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAlbum = () => {
    albumRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#080808] text-white selection:bg-brand-gold/30">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-in-out ${isScrolled ? 'bg-black/90 backdrop-blur-2xl border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-8 border-b border-white/0'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-brand-gold transition-colors">Home</button>
            <button onClick={scrollToAbout} className="hover:text-brand-gold transition-colors">A Empresa</button>
            
            <div 
              onClick={scrollToAlbum}
              className="px-4 py-2 rounded-full border border-brand-gold/40 bg-black/60 backdrop-blur-sm text-brand-gold text-[8px] font-bold uppercase tracking-[0.3em] shadow-[0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-brand-gold hover:text-black transition-all"
            >
              3D
            </div>

            <button onClick={scrollToServices} className="hover:text-brand-gold transition-colors">Serviços</button>
            <button onClick={scrollToContact} className="hover:text-brand-gold transition-colors">Contato</button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="bg-brand-gold text-black px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white transition-all hover:scale-105 shadow-[0_4px_16px_rgba(212,175,55,0.2)] active:scale-95"
            >
              Acessar Studio
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-zinc-950 border-b border-white/5 overflow-hidden"
            >
              <div className="p-8 flex flex-col gap-6 text-[10px] uppercase tracking-[0.3em] font-bold text-center">
                <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMobileMenuOpen(false); }}>Home</button>
              <button onClick={() => { scrollToAbout(); setIsMobileMenuOpen(false); }}>A Empresa</button>
              <button onClick={() => { scrollToServices(); setIsMobileMenuOpen(false); }}>Serviços</button>
              <button onClick={() => { scrollToContact(); setIsMobileMenuOpen(false); }}>Contato</button>
              <div className="h-[1px] bg-white/5 my-2" />
              <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="bg-brand-gold text-black py-5 rounded-full text-xs font-black uppercase tracking-widest">
                Acessar Studio
              </button>
              <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-brand-gold/80 text-[10px] uppercase tracking-[0.2em] mt-2">
                Área do Aluno
              </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-32">
        <ParticleBackground />
        
        {/* Delicate Ambient Lighting (Soft, perfectly centered, no side yellow fog) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-gold/[0.035] blur-[130px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-6 mb-12">
              <Sparkles className="w-4 h-4 text-brand-gold opacity-50" />
              <div className="relative px-8 py-3 rounded-full border border-brand-gold/40 bg-black/60 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.7)] group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="flex items-center gap-4">
                  <span className="text-brand-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.4em]">20 Anos de Excelência</span>
                  <div className="w-[1px] h-4 bg-brand-gold/30" />
                  <span className="font-script text-2xl text-white/90">Sonhe, acredite, realize!</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-brand-gold opacity-50" />
            </div>
            
            <div className="flex flex-col items-center mb-10">
              <div className="flex flex-col items-center mb-4">
                <h1 className="font-serif text-4xl md:text-7xl text-white tracking-[0.02em] uppercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  Top Line
                </h1>
                <span className="text-white/50 text-[8px] md:text-xs uppercase tracking-[1.2em] font-light mt-3 ml-[1.2em]">
                  Formaturas
                </span>
              </div>
              
              <div className="relative w-full max-w-xl py-3 md:py-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/5 to-transparent border-y border-brand-gold/10 backdrop-blur-[1px]" />
                <div className="relative z-10 flex items-center justify-center gap-8">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
                  <span className="gold-gradient text-5xl md:text-7xl font-script drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] py-4">
                    Studio
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-brand-gold/30 to-transparent" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
              className="mb-16 relative"
            >
              <span className="relative z-10 font-script text-6xl md:text-8xl gold-gradient drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)] block hover:scale-105 transition-transform cursor-default py-2">
                Sonhe, acredite, realize!
              </span>
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-gold/30" />
                <span className="text-[8px] uppercase tracking-[0.8em] text-white/40 font-light">Eternizando Conquistas</span>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-gold/30" />
              </div>
            </motion.div>
            
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto font-light tracking-wide leading-relaxed mb-16">
              A experiência definitiva em formaturas premium. 
              Transformamos sonhos em memórias eternas com exclusividade e sofisticação.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <button 
                onClick={() => navigate('/login')}
                className="bg-brand-gold text-black px-12 py-5 rounded-full text-lg font-black uppercase tracking-[0.1em] hover:bg-white transition-all hover:scale-105 shadow-[0_4px_25px_rgba(212,175,55,0.25)] active:scale-95 group flex items-center gap-3"
              >
                Acessar Studio
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={scrollToAlbum}
                className="px-12 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-bold tracking-[0.3em] uppercase text-white/80 backdrop-blur-sm hover:text-white flex items-center gap-3 group shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              >
                Monte seu Álbum
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70 cursor-pointer group z-20"
          onClick={() => albumRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-brand-gold group-hover:text-white transition-colors">Álbum 3D</p>
          <ChevronDown className="w-6 h-6 text-brand-gold" />
        </motion.div>
      </section>

      {/* Trailer do Studio */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <p className="text-brand-gold text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-3">Conheça o Studio</p>
            <h2 className="text-3xl md:text-5xl font-serif text-white">Seu álbum, do jeito que você sonhou</h2>
          </div>
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-brand-gold/30 shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_60px_rgba(212,175,55,0.12)] bg-zinc-950">
            <video
              src="/trailer.mp4"
              poster="/trailer-poster.jpg"
              className="w-full aspect-video object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
            />
          </div>
          <div className="flex justify-center mt-8 md:mt-10">
            <button onClick={() => navigate('/login')} className="gold-button px-8 py-4 !text-[11px] !font-bold uppercase tracking-widest">
              Montar meu álbum agora
            </button>
          </div>
        </div>
      </section>

      {/* A Empresa Section */}
      <section ref={aboutRef} className="py-20 md:py-32 px-6 relative overflow-hidden bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-brand-gold/10 border border-white/10">
              <img loading="lazy" decoding="async" 
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=75" 
                alt="Formatura Top Line" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-gold/10 blur-3xl rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-8 flex items-center gap-4">
              A Empresa
              <div className="h-[1px] flex-1 bg-brand-gold/30" />
            </h2>
            <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
              <p>
                Concluir um curso de graduação é o sonho da maioria das pessoas. Por isso, para fazer desta conquista um momento único inesquecível, a <span className="text-white font-medium">Top Line Formaturas</span> oferece a você os melhores serviços.
              </p>
              <p>
                Desde os momentos ao lado de sua turma que antecedem o grande dia, até todos os detalhes que envolvem a organização deste tão esperado evento. Credibilidade e comprometimento são os nossos princípios básicos.
              </p>
              <p>
                Este rito de passagem deixa muitas lembranças como as amizades cultivadas durante os anos de estudos e os incentivos familiares. <span className="text-brand-gold font-medium italic">Você é único, por isso você é TOP.</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 md:mt-32">
          {[
            { icon: Award, value: "20", label: "Anos de Experiência" },
            { icon: Calendar, value: "2.500", label: "Eventos Realizados" },
            { icon: Users, value: "75.000", label: "Alunos Formados" },
            { icon: MapPin, value: "54", label: "Cidades Atendidas" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center group hover:border-brand-gold/30 transition-colors"
            >
              <stat.icon className="w-8 h-8 text-brand-gold mx-auto mb-6 group-hover:scale-110 transition-transform" />
              <div className="text-4xl font-serif text-white mb-2">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Como Funciona Section */}
      <section ref={albumRef} className="py-20 md:py-32 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">Como Funciona</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
              Sua jornada do clique à memória eterna em apenas 3 passos simples.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Seleção Exclusiva",
                desc: "Escolha suas melhores fotos através do nosso Studio inteligente.",
                step: "01"
              },
              {
                title: "Design Personalizado",
                desc: "Nossos designers criam um layout único que conta a sua história.",
                step: "02"
              },
              {
                title: "Visualização 3D",
                desc: "Sinta a emoção de folhear seu álbum digitalmente antes da impressão.",
                step: "03"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                onClick={() => {
                  setAlbumStep(i);
                  albumRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="relative p-10 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-brand-gold/20 transition-all group cursor-pointer"
              >
                <div className="text-6xl font-serif text-brand-gold/10 absolute top-6 right-10 group-hover:text-brand-gold/20 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-brand-gold text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Saiba mais <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Album Showcase */}
          <AlbumShowcase currentStep={albumStep} onStepChange={setAlbumStep} />
        </div>
      </section>

      {/* Nossos Serviços Section */}
      <section ref={servicesRef} className="py-20 md:py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-serif mb-6">Nossos Serviços</h2>
              <p className="text-gray-400 text-xl font-light max-w-xl">
                Uma empresa completa para transformar seus sonhos em realidade através de alta qualidade.
              </p>
            </div>
            <div className="h-[1px] flex-1 bg-brand-gold/20 hidden md:block mx-12 mb-6" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Colação de Grau", "Baile de Gala", "Culto Ecumênico", 
              "Jantar de Formatura", "Festa de Integração", "Pré-Eventos"
            ].map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center hover:bg-brand-gold/5 hover:border-brand-gold/30 transition-all"
              >
                <GraduationCap className="w-8 h-8 text-brand-gold mb-4" />
                <span className="text-sm font-bold uppercase tracking-wider text-gray-300">{service}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-3xl bg-gradient-to-br from-brand-gold/10 to-transparent border border-brand-gold/20">
            <h3 className="text-2xl font-serif mb-10 text-center">O que mais podemos te oferecer?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                "Assessoria Financeira", "Assessoria Jurídica", "Assessoria Organizacional", "Assessoria Prime",
                "Connect Top", "Espaços Sociais", "Festas de Integração", "Know How"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-400 group">
                  <CheckCircle2 className="w-5 h-5 text-brand-gold/50 group-hover:text-brand-gold transition-colors" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instituições Parceiras Section */}
      <section className="py-20 md:py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Instituições Parceiras</h2>
            <p className="text-gray-400 font-light">Confiança das maiores universidades do país.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-12 items-center">
            {/* Placeholder logos with university names */}
            {[
              "UFSC", "UNIVALI", "Positivo", "Uniguaçu", "UniBrasil", "Univille",
              "UniSociesc", "UFPR", "UTP", "PUCPR", "Unicuritiba", "Unisul"
            ].map((uni, i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <span className="text-lg md:text-2xl font-serif font-bold text-white/60 hover:text-brand-gold transition-colors">{uni}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Fotos Section — fotos reais de eventos Top Line */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-[#0d0c08] overflow-hidden">
        {/* faixa dourada no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 md:h-3 bg-gradient-to-r from-[#9c7a1e] via-brand-gold to-[#9c7a1e] -skew-y-[0.6deg] origin-left shadow-[0_4px_20px_rgba(212,175,55,0.35)]" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(212,175,55,0.12),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-center text-2xl md:text-4xl font-bold uppercase tracking-wide text-white mb-10 md:mb-14 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Galeria de Fotos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              'Decoração de formatura de Medicina',
              'Palco da colação de Medicina',
              'Show de luzes da formatura de Medicina',
              'Formandos de Medicina na colação',
              'Show no baile de formatura',
              'Decoração do salão com lustres',
              'Formandos comemorando no baile',
              'Mesas decoradas do jantar de formatura',
              'Animação no baile de formatura',
              'Brasão e bandeiras da colação de Direito',
              'Palco da formatura de Direito',
              'Altar decorado da cerimônia',
            ].map((alt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIndex(i)}
                className="group aspect-[3/2] rounded-lg overflow-hidden border-2 border-white bg-black shadow-[0_10px_25px_rgba(0,0,0,0.7)] focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label={`Ampliar foto: ${alt}`}
              >
                <img
                  src={`/galeria/foto-${String(i + 1).padStart(2, '0')}.jpg`}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover text-transparent group-hover:scale-105 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Foto ampliada */}
        <AnimatePresence>
          {galleryIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setGalleryIndex(null)}
            >
              <img
                src={`/galeria/foto-${String(galleryIndex + 1).padStart(2, '0')}.jpg`}
                alt=""
                className="w-[min(92vw,960px)] max-h-[85vh] object-contain rounded-xl border-2 border-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button className="absolute top-5 right-5 text-white/80 hover:text-white text-sm uppercase tracking-widest" onClick={() => setGalleryIndex(null)}>Fechar ✕</button>
              <button className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white text-2xl" onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 11) % 12); }} aria-label="Foto anterior">‹</button>
              <button className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white text-2xl" onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % 12); }} aria-label="Próxima foto">›</button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer / Contact */}
      <footer ref={contactRef} className="py-24 px-6 border-t border-white/10 bg-black relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
            <div className="flex flex-col items-center md:items-start gap-8">
              <Logo />
              <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase leading-relaxed text-center md:text-left max-w-xs">
                Eternizando momentos com a sofisticação e exclusividade da Top Line Studio.
              </p>
            </div>
          
          <div className="flex flex-col items-center md:items-start gap-8">
            <h4 className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.4em]">Navegação</h4>
            <div className="flex flex-col items-center md:items-start gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-brand-gold transition-colors">Home</button>
              <button onClick={scrollToAbout} className="hover:text-brand-gold transition-colors">Empresa</button>
              <button onClick={scrollToServices} className="hover:text-brand-gold transition-colors">Serviços</button>
              <button onClick={scrollToContact} className="hover:text-brand-gold transition-colors">Contato</button>
              <button onClick={() => navigate('/login')} className="text-brand-gold hover:text-white transition-colors">Área do Aluno</button>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start gap-8">
            <h4 className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.4em]">Contato</h4>
            <div className="flex flex-col items-center md:items-start gap-6 text-gray-400">
              <div className="flex items-start gap-4 group">
                <MapPin size={16} className="text-brand-gold shrink-0 mt-1" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Florianópolis</span>
                  <span className="text-[10px] leading-relaxed tracking-wider">Av. Eng. Max de Souza, 1135 - sala 801<br/>Coqueiros, Florianópolis - SC</span>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <Phone size={16} className="text-brand-gold shrink-0" />
                <a href="tel:4830280949" className="text-[10px] font-bold tracking-widest hover:text-white transition-colors">(48) 3028-0949</a>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-brand-gold hover:border-brand-gold transition-all cursor-pointer">
                  <Instagram size={18} />
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-brand-gold hover:border-brand-gold transition-all cursor-pointer">
                  <Facebook size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-600 text-[9px] tracking-[0.2em] uppercase">
          <span>© 2026 Top Line Formaturas. Todos os direitos reservados.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
