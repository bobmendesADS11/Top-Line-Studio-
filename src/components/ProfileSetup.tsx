import { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Calendar, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

interface ProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

export default function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [course, setCourse] = useState('');
  const [classYear, setClassYear] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update the user's profile or create it
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          course: course,
          class_year: classYear,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      onComplete();
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar seus dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-black/98 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-md w-full p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-gold/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-6 border border-brand-gold/20">
            <GraduationCap className="w-8 h-8 text-brand-gold" />
          </div>

          <h2 className="text-3xl font-serif mb-2">Quase lá, <span className="gold-gradient">Formando!</span></h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Confirme os detalhes da sua formatura para personalizarmos sua experiência.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">Seu Curso</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Direito, Medicina, Engenharia..."
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold ml-1">Sua Turma (Semestre/Ano)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  required
                  type="text" 
                  placeholder="Ex: 26/2, 25/1..."
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold transition-all text-sm"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="gold-button w-full py-4 flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Confirmar e Continuar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <Sparkles className="w-3 h-3 text-brand-gold/40" />
            Top Line Formaturas — 20 Anos
          </div>
        </div>
      </motion.div>
    </div>
  );
}
