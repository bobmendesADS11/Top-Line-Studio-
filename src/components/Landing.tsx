import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, ArrowRight, Users, Calendar, Award, MapPin, CheckCircle2, Play, ChevronDown, BookOpen, MousePointer2, Image as ImageIcon, LogIn, Menu, X, Instagram, Facebook, Phone } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,25,10,0.15)_0%,rgba(0,0,0,1)_100%)]" />
      
      {/* Soft Warm Light Beam from the Right */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_85%_35%,rgba(212,175,55,0.05)_0%,transparent_60%)] blur-[100px]" />

      {/* Flowing Curved Wave of Particles (Optimized count) */}
      {[...Array(30)].map((_, i) => {
        const size = Math.random() * 3 + 1;
        const delay = i * 0.3;
        const duration = 15 + Math.random() * 5;
        
        return (
          <motion.div
            key={`wave-particle-${i}`}
            initial={{ 
              opacity: 0,
              x: "-10%",
              y: (45 + Math.sin(i * 0.5) * 10) + "%",
            }}
            animate={{ 
              opacity: [0, 0.7, 0.7, 0],
              x: "110%",
              y: (45 + Math.sin((i + 15) * 0.5) * 15) + "%",
            }}
            transition={{ 
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "linear"
            }}
            className="absolute rounded-full bg-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.4)] blur-[0.5px]"
            style={{ width: size, height: size }}
          />
        );
      })}

      {/* Background Gold Dust (Bokeh) */}
      {[...Array(12)].map((_, i) => {
        const size = Math.random() * 5 + 2;
        const opacity = Math.random() * 0.1 + 0.05;
        
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
              y: [null, (Math.random() * -30 - 15) + "px"]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute rounded-full bg-brand-gold/20 blur-[3px]"
            style={{ width: size, height: size }}
          />
        );
      })}

      {/* Subtle Twinkling Sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          initial={{ 
            opacity: 0,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: 0
          }}
          animate={{ 
            opacity: [0, 0.5, 0],
            scale: [0, 1, 0],
          }}
          transition={{ 
            duration: Math.random() * 4 + 4, 
            repeat: Infinity,
            delay: Math.random() * 10,
          }}
          className="absolute"
        >
          <Sparkles className="text-brand-gold/30 w-3 h-3" />
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
            <img 
              key={i}
              src="https://picsum.photos/seed/grad_small/100/100" 
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
      <div className="flex flex-col">
        <span className="font-serif text-lg text-white uppercase tracking-[0.05em] leading-none">Top Line</span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[5px] uppercase tracking-[0.6em] font-light text-white/60">Formaturas</span>
          <span className="text-[5px] uppercase tracking-[0.1em] font-bold text-brand-gold">Black</span>
        </div>
      </div>
    </div>
  );
}

function AlbumShowcase({ currentStep, onStepChange }: { currentStep: number, onStepChange: (step: number) => void }) {
  const [isHovered, setIsHovered] = useState(false);

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
        <div className="grid grid-cols-3 gap-4 p-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="aspect-square rounded-xl bg-zinc-900 border border-white/10 overflow-hidden relative group cursor-pointer"
            >
              <img 
                src={`https://picsum.photos/seed/grad${i}/400/400`} 
                alt="Graduation" 
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Design Inteligente",
      icon: Sparkles,
      content: (
        <div className="flex items-center justify-center h-full p-8">
          <div className="relative w-full max-w-md aspect-[4/3] bg-zinc-900 rounded-2xl border border-brand-gold/30 shadow-2xl shadow-brand-gold/10 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/10 to-transparent opacity-50" />
            
            {/* Processing Scan Line */}
            <motion.div 
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent z-20 blur-sm opacity-50"
            />

            <div className="p-6 h-full flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">Inteligência Artificial</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-24 bg-brand-gold/20 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full w-1/2 bg-brand-gold"
                      />
                    </div>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest">Otimizando Layout...</span>
                  </div>
                </div>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20"
                >
                  <Sparkles size={18} className="text-brand-gold" />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-12 gap-3 flex-1 relative">
                {/* Main Spread Simulation */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="col-span-7 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden relative shadow-2xl"
                >
                  <img src="https://picsum.photos/seed/grad7/600/800" className="w-full h-full object-cover opacity-100" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Floating "Memory" particles */}
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [0, -40, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 3, delay: i * 1, repeat: Infinity }}
                      className="absolute bottom-4 left-4"
                    >
                      <Sparkles className="text-brand-gold/40 w-4 h-4" />
                    </motion.div>
                  ))}
                </motion.div>

                <div className="col-span-5 flex flex-col gap-3">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex-1 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden relative"
                  >
                    <img src="https://picsum.photos/seed/grad8/400/400" className="w-full h-full object-cover opacity-100" referrerPolicy="no-referrer" />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex-1 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden relative"
                  >
                    <img src="https://picsum.photos/seed/grad9/400/400" className="w-full h-full object-cover opacity-100" referrerPolicy="no-referrer" />
                  </motion.div>
                </div>

                {/* "Flying" memories being sorted */}
                <AnimatePresence>
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, x: -100, y: 100 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        x: [Math.random() * 200, 0],
                        y: [Math.random() * 200, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        delay: i * 0.5, 
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="absolute w-12 h-12 rounded-md bg-brand-gold/20 border border-brand-gold/40 backdrop-blur-sm z-30 flex items-center justify-center overflow-hidden"
                    >
                      <img src="https://picsum.photos/seed/grad10/100/100" className="w-full h-full object-cover opacity-40" referrerPolicy="no-referrer" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <div className="mt-8 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 overflow-hidden">
                      <img src={`https://picsum.photos/seed/person${i}/50/50`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-brand-gold flex items-center justify-center text-[8px] font-bold text-black">
                    +12
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-brand-gold text-black text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  Design Automático
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Visualização 3D",
      icon: BookOpen,
      content: (
        <div className="flex items-center justify-center h-full p-12 perspective-2000">
          <motion.div 
            initial={{ rotateY: -25, rotateX: 10 }}
            animate={{ 
              rotateY: [-25, -5, -25],
              rotateX: [10, 5, 10],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-2xl aspect-[1.8/1] flex preserve-3d"
          >
            {/* Left Page (Full Photo) */}
            <div className="flex-1 bg-[#1a1a1a] rounded-l-sm border-y border-l border-white/5 relative overflow-hidden shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] origin-right">
              <img 
                src="https://picsum.photos/seed/grad11/800/1200" 
                className="w-full h-full object-cover opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/60 to-transparent" />
            </div>

            {/* Spine / Gutter */}
            <div className="w-1 bg-[#111] relative z-10 shadow-[0_0_10px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" />
            </div>

            {/* Right Page (2 Photos) */}
            <div className="flex-1 bg-[#1a1a1a] rounded-r-sm border-y border-r border-white/5 relative overflow-hidden shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)] p-6 flex flex-col gap-6">
              <div className="flex-1 rounded-sm overflow-hidden relative shadow-lg">
                <img 
                  src="https://picsum.photos/seed/grad12/800/600" 
                  className="w-full h-full object-cover opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent" />
              </div>
              <div className="flex-1 rounded-sm overflow-hidden relative shadow-lg">
                <img 
                  src="https://picsum.photos/seed/grad13/800/600" 
                  className="w-full h-full object-cover opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent" />
              </div>
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            {/* Cover Depth Effect */}
            <div className="absolute -inset-1 -z-10 bg-brand-gold/20 rounded-lg blur-xl opacity-50" />
            
            {/* Decorative "3D Rendering" badge */}
            <div className="absolute -top-4 -right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-white/10 backdrop-blur-md z-20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-white/60">Renderizando 3D</span>
            </div>
          </motion.div>
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
      <div className="lg:w-[400px] p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-zinc-900/30">
        <div className="space-y-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className={`flex gap-6 cursor-pointer transition-all duration-500 ${currentStep === i ? 'opacity-100 translate-x-2' : 'opacity-30 hover:opacity-50'}`}
              onClick={() => onStepChange(i)}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${currentStep === i ? 'bg-brand-gold text-black' : 'bg-white/5 text-white'}`}>
                <s.icon size={24} />
              </div>
              <div>
                <h4 className="text-xl font-serif mb-2">{s.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
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
      <div className="flex-1 relative bg-black overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        {/* Decorative elements */}
        <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20">
          <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Preview Interativo</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
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
    <div className="relative min-h-screen bg-[#050301] text-white selection:bg-brand-gold/30">
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
              className="px-4 py-2 rounded-full border border-brand-gold/50 bg-black/40 backdrop-blur-sm text-brand-gold text-[8px] font-bold uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(212,175,55,0.1)] cursor-pointer hover:bg-brand-gold hover:text-black transition-all"
            >
              3D
            </div>

            <button onClick={scrollToServices} className="hover:text-brand-gold transition-colors">Serviços</button>
            <button onClick={scrollToContact} className="hover:text-brand-gold transition-colors">Contato</button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="bg-brand-gold text-black px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.3)] active:scale-95"
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
        
        {/* Background Sparkles Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-gold/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-gold/10 blur-[150px] rounded-full" />
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
              <div className="px-6 py-2 rounded-full border border-brand-gold/50 bg-black/40 backdrop-blur-sm text-brand-gold text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                20 Anos de Excelência em Formaturas
              </div>
              <Sparkles className="w-4 h-4 text-brand-gold opacity-50" />
            </div>
            
            <div className="flex flex-col items-center mb-10">
              <div className="flex flex-col items-center mb-4">
                <h1 className="font-serif text-4xl md:text-7xl text-white tracking-[0.02em] uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  Top Line
                </h1>
                <span className="text-white/50 text-[8px] md:text-xs uppercase tracking-[1.2em] font-light mt-3 ml-[1.2em]">
                  Formaturas
                </span>
              </div>
              
              <div className="relative w-full max-w-xl py-3 md:py-4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/5 to-transparent border-y border-brand-gold/10 backdrop-blur-[1px]" />
                <div className="relative z-10 flex items-center justify-center gap-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
                  <span className="text-brand-gold text-lg md:text-2xl font-serif tracking-[0.3em] uppercase italic drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    Black
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-brand-gold/30 to-transparent" />
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="mb-12"
            >
              <span className="font-script text-5xl md:text-7xl text-brand-gold/90 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                Sonhe, acredite, realize!
              </span>
            </motion.div>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-light tracking-wide leading-relaxed mb-16">
              A experiência definitiva em formaturas premium. 
              Transformamos sonhos em memórias eternas com exclusividade e sofisticação.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <button 
                onClick={() => navigate('/login')}
                className="bg-brand-gold text-black px-12 py-5 rounded-full text-lg font-black uppercase tracking-[0.1em] hover:bg-white transition-all hover:scale-105 shadow-[0_0_40px_rgba(212,175,55,0.4)] active:scale-95 group flex items-center gap-3"
              >
                Acessar Studio
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={scrollToAlbum}
                className="px-12 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-bold tracking-[0.3em] uppercase text-white/80 backdrop-blur-sm hover:text-white flex items-center gap-3 group"
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

      {/* A Empresa Section */}
      <section ref={aboutRef} className="py-32 px-6 relative overflow-hidden bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-brand-gold/10 border border-white/10">
              <img 
                src="https://picsum.photos/seed/graduate_holding_diploma/1200/800" 
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
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mt-32">
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
      <section className="py-32 px-6 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">Como Funciona</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
              Sua jornada do clique à memória eterna em apenas 3 passos simples.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent -translate-y-1/2 z-0" />
            
            {[
              {
                icon: LogIn,
                title: "Acesse seu Studio",
                desc: "Faça login na sua área exclusiva para gerenciar suas fotos e pedidos com total segurança.",
                step: "01"
              },
              {
                icon: ImageIcon,
                title: "Selecione suas Fotos",
                desc: "Navegue pela sua galeria premium e escolha os momentos que mais marcaram sua trajetória.",
                step: "02"
              },
              {
                icon: Sparkles,
                title: "Crie seu Álbum 3D",
                desc: "Use nosso editor inteligente para diagramar e visualizar seu álbum físico em tempo real.",
                step: "03"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 bg-zinc-900/50 border border-white/5 p-10 rounded-[32px] hover:border-brand-gold/30 transition-all group"
              >
                <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-brand-gold group-hover:text-black transition-all duration-500">
                  <item.icon size={32} className="text-brand-gold group-hover:text-black transition-colors" />
                </div>
                <div className="absolute top-10 right-10 text-4xl font-serif text-white/5 group-hover:text-brand-gold/10 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-2xl font-serif mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed font-light">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* O Processo do Álbum 3D Section */}
      <section ref={albumRef} className="py-32 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">O Processo do Álbum 3D</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
              Uma experiência imersiva para eternizar seus momentos mais especiais.
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
      <section ref={servicesRef} className="py-32 px-6 bg-zinc-950">
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
      <section className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Instituições Parceiras</h2>
            <p className="text-gray-400 font-light">Confiança das maiores universidades do país.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-center opacity-50 grayscale hover:grayscale-0 transition-all">
            {/* Placeholder logos with university names */}
            {[
              "UFSC", "UNIVALI", "Positivo", "Uniguaçu", "UniBrasil", "Univille",
              "UniSociesc", "UFPR", "UTP", "PUCPR", "Unicuritiba", "Unisul"
            ].map((uni, i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <span className="text-2xl font-serif font-bold text-white/40 hover:text-brand-gold transition-colors">{uni}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Fotos Section */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">Galeria de Fotos</h2>
            <p className="text-gray-400 text-xl font-light">Momentos inesquecíveis capturados pela nossa equipe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="aspect-square rounded-2xl overflow-hidden border border-white/10"
              >
                <img 
                  src={`https://picsum.photos/seed/gallery${i}/800/800`} 
                  alt={`Gallery ${i}`} 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer ref={contactRef} className="py-24 px-6 border-t border-white/10 bg-black relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
          <div className="flex flex-col items-center md:items-start gap-8">
            <Logo />
            <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase leading-relaxed text-center md:text-left max-w-xs">
              Eternizando momentos com a sofisticação e exclusividade da Top Line Black Edition.
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
