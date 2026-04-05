import { GraduationCap, Sparkles, ChevronRight } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  console.log('Landing component rendering...');
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <div className="flex justify-center mb-6">
          <GraduationCap className="w-20 h-20 text-yellow-500" />
        </div>

        <h1 className="text-6xl md:text-8xl font-serif mb-4 tracking-tight text-white">
          Top Line <span className="text-yellow-500">Formaturas</span>
        </h1>
        <h2 className="text-4xl md:text-5xl font-serif mb-8 text-yellow-500 opacity-90">Studio</h2>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light italic">
          "Sonhe, Acredite, Realize"
        </p>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={onStart}
            className="bg-yellow-500 text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 text-lg hover:bg-yellow-400 transition-colors"
          >
            Criar meu Álbum <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-yellow-500/60">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-widest uppercase">20 Anos de Excelência</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
