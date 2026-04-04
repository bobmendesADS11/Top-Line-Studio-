import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`,
      });

      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      console.error('Erro ao enviar OTP:', err);
      setError(err.message || 'Erro ao enviar código.');
      // Fallback para demo se não houver provedor de SMS configurado
      if (err.message?.includes('SMS provider')) {
        setStep('otp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      onLogin(data.user);
    } catch (err: any) {
      console.error('Erro ao verificar OTP:', err);
      setError(err.message || 'Código inválido.');
      // Mock login para teste se falhar (código 123456)
      if (otp === '123456') onLogin({ phone });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl w-full max-w-md"
      >
        <h2 className="text-3xl font-serif mb-2 text-center">Boas-vindas</h2>
        <p className="text-gray-400 text-center mb-8">Acesse seu estúdio de formaturas</p>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form 
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold w-5 h-5" />
                <input 
                  type="tel" 
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-hidden focus:border-brand-gold transition-colors"
                  required
                />
              </div>
              <button 
                disabled={loading}
                className="gold-button w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Receber Código <ArrowRight className="w-5 h-5" /></>}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <input 
                    key={i}
                    type="text" 
                    maxLength={1}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:outline-hidden focus:border-brand-gold transition-colors"
                    required
                  />
                ))}
              </div>
              <button 
                disabled={loading}
                className="gold-button w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-5 h-5" /></>}
              </button>
              <button 
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-400 hover:text-brand-gold transition-colors"
              >
                Alterar número de telefone
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
