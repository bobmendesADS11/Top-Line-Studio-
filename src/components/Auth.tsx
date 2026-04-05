import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, sendSignInLinkToEmail } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { LogIn, Phone, Mail, ArrowRight, ShieldCheck, UserCircle, Key, Send } from 'lucide-react';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [studentMethod, setStudentMethod] = useState<'phone' | 'email_link'>('phone');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  // Admin Login (Email/Password)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('E-mail ou senha incorretos para o administrador.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student: Phone Login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      setError('Erro ao enviar SMS. Verifique o número (ex: +5511999999999).');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      setError('Código inválido. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student: Email Link Login (Magic Link)
  const handleEmailLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSuccessMessage('Link de acesso enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError('Erro ao enviar link. Verifique seu e-mail.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError('Erro ao fazer login com Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 border border-brand-gold/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="topline-black text-3xl text-brand-gold mb-2">Top Line</h1>
          <p className="text-gray-400 text-sm">Acesse sua área exclusiva</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-black/50 p-1 rounded-xl mb-8 border border-white/5">
          <button
            onClick={() => setAuthMode('student')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'student' ? 'bg-brand-gold text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Área do Aluno
          </button>
          <button
            onClick={() => setAuthMode('admin')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'admin' ? 'bg-brand-gold text-black' : 'text-gray-500 hover:text-white'}`}
          >
            Administrador
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg mb-6 text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {authMode === 'admin' ? (
            /* Admin Login Form */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  placeholder="E-mail do Admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Acessando...' : 'Entrar no Painel'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* Student Login Options */
            <div className="space-y-6">
              {/* Student Method Toggle */}
              <div className="flex justify-center gap-6 mb-2">
                <button 
                  onClick={() => { setStudentMethod('phone'); setConfirmationResult(null); }}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${studentMethod === 'phone' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  Telefone
                </button>
                <button 
                  onClick={() => setStudentMethod('email_link')}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${studentMethod === 'email_link' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  Link por E-mail
                </button>
              </div>

              {studentMethod === 'phone' ? (
                !confirmationResult ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="tel"
                        placeholder="+55 (11) 99999-9999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Enviando...' : 'Receber Código SMS'}
                      <ArrowRight size={18} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        placeholder="Código de 6 dígitos"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Verificando...' : 'Confirmar Código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="w-full text-gray-500 text-xs hover:text-white transition-colors"
                    >
                      Voltar
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handleEmailLinkLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="email"
                      placeholder="Seu e-mail cadastrado"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
                    <Send size={18} />
                  </button>
                </form>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-zinc-900 px-2 text-gray-500">Ou continue com</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <UserCircle size={20} />
                Google
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-widest">
          Top Line Black Edition • 2026
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
