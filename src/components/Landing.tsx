import { motion } from 'motion/react';
import { GraduationCap, Sparkles, ChevronRight } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1920" 
          alt="Formatura" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-brand-black/60 via-brand-black/80 to-brand-black"></div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 max-w-4xl"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
          >
            <GraduationCap className="w-20 h-20 text-brand-gold" />
          </motion.div>
        </div>

        <h1 className="text-6xl md:text-8xl font-serif mb-4 tracking-tight">
          Top Line <span className="gold-gradient">Formaturas</span>
        </h1>
        <h2 className="text-4xl md:text-5xl font-serif mb-8 gold-gradient opacity-90">Studio</h2>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light italic">
          "Sonhe, Acredite, Realize"
        </p>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={onStart}
            className="gold-button flex items-center gap-2 text-lg"
          >
            Criar meu Álbum <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-brand-gold/60">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">20 Anos de Excelência</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 opacity-20 hidden md:block">
        <p className="text-8xl font-serif text-brand-gold font-bold">20</p>
        <p className="text-xl tracking-widest uppercase">Anos</p>
      </div>
    </div>
  );
}
