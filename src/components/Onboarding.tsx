import { motion, AnimatePresence } from 'motion/react';
import { Camera, BookOpen, Share2, CheckCircle, Play } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Escolha suas fotos",
    description: "Navegue pela sua galeria e selecione as fotos que mais marcaram sua trajetória.",
    icon: <Camera className="w-8 h-8 text-brand-gold" />,
    image: "https://picsum.photos/seed/grad1/400/300"
  },
  {
    title: "Monte seu álbum",
    description: "Arraste as fotos para as páginas e organize do seu jeito no nosso editor 3D.",
    icon: <BookOpen className="w-8 h-8 text-brand-gold" />,
    image: "https://picsum.photos/seed/grad2/400/300"
  },
  {
    title: "Visualize e Compartilhe",
    description: "Veja como seu álbum ficou em 3D e compartilhe o link com amigos e familiares.",
    icon: <Share2 className="w-8 h-8 text-brand-gold" />,
    image: "https://picsum.photos/seed/grad3/400/300"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-black/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-4xl w-full overflow-hidden rounded-3xl flex flex-col md:flex-row"
      >
        <div className="flex-1 p-8 md:p-12">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-brand-gold font-bold tracking-widest text-xs uppercase">Tutorial</span>
            <div className="h-px flex-1 bg-brand-gold/20" />
          </div>
          
          <h2 className="text-4xl font-serif mb-8">Como criar sua <span className="gold-gradient">obra de arte</span></h2>
          
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onComplete}
            className="gold-button w-full mt-12 py-4 flex items-center justify-center gap-2 group"
          >
            Começar Agora <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="hidden md:block w-1/3 bg-brand-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy to-transparent z-10" />
          <img 
            src="https://picsum.photos/seed/grad_hero/800/1200" 
            alt="Graduation" 
            className="h-full w-full object-cover opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-8 left-8 right-8 z-20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-brand-gold" />
              <span className="text-xs font-bold uppercase tracking-widest">Premium Experience</span>
            </div>
            <p className="text-sm text-gray-300 italic">"Transformando memórias em eternidade."</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
