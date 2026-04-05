import { motion } from 'motion/react';
import { GraduationCap, Sparkles, ArrowRight } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  console.log('Landing component rendering...');
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Sparkles Overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/10 blur-[120px] rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="inline-block px-4 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-[0.2em]">
              20 Anos de Experiência Comprovada
            </span>
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
          
          <h1 className="text-5xl md:text-8xl font-serif mb-4 tracking-tight leading-tight text-white">
            <span className="topline-black block text-2xl md:text-4xl mb-2">Top Line</span>
            <span className="italic gold-gradient block md:inline">Black</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide leading-relaxed mb-12">
            Somos especialistas em formaturas com <span className="text-white font-medium">20 anos de experiência comprovada</span>. 
            Bem-vindo ao seu estúdio exclusivo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="gold-button group flex items-center gap-3"
            >
              Acessar Meu Studio
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-bold tracking-widest uppercase text-white">
              Conhecer a Top Line
            </button>
          </div>
        </motion.div>

        {/* Floating Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 mt-24 pt-12 border-t border-white/5 w-full"
        >
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-serif gold-gradient mb-1">20+</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Anos de História</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-serif text-white mb-1">Premium</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Padrão Medicina</p>
          </div>
          <div className="text-center hidden md:block">
            <p className="text-2xl md:text-3xl font-serif text-white mb-1">Exclusivo</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Atendimento VIP</p>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
        <div className="w-px h-12 bg-gradient-to-b from-brand-gold to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white">Scroll</p>
      </div>
    </div>
  );
}
