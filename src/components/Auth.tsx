import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, sendSignInLinkToEmail } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { LogIn, Phone, Mail, ArrowRight, ShieldCheck, UserCircle, Key, Send, Clock, GraduationCap } from 'lucide-react';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [adminMethod, setAdminMethod] = useState<'password' | 'phone'>('password');
  const [studentAction, setStudentAction] = useState<'login' | 'register'>('login');
  const [studentMethod, setStudentMethod] = useState<'phone' | 'email_link'>('phone');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
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

  // Admin Login (Phone/Password mapped to Email/Password)
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      let digits = phoneNumber.replace(/\D/g, '');
      console.log("Admin Auth - Digits:", digits);
      const isMaster = digits === '48991764001' || digits === '5548991764001';
      
      // Normalize primary digits to include 55
      let normalizedDigits = digits;
      if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
        normalizedDigits = '55' + digits;
      }
      
      const primaryEmail = `${normalizedDigits}@admin.topline.com`;
      const secondaryEmail = `${normalizedDigits.startsWith('55') ? normalizedDigits.substring(2) : normalizedDigits}@admin.topline.com`;
      console.log("Admin Auth - Trying emails:", primaryEmail, secondaryEmail);

      const tryLogin = async (email: string) => {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          return true;
        } catch (err: any) {
          if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            return 'wrong-password';
          }
          return false;
        }
      };

      // 1. Try primary email
      const result1 = await tryLogin(primaryEmail);
      if (result1 === true) return;
      
      // 2. Try secondary email
      const result2 = await tryLogin(secondaryEmail);
      if (result2 === true) return;

      // 3. If it's the master admin and user not found, create it
      if (isMaster && (result1 === false || result2 === false)) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, primaryEmail, password);
          await updateProfile(userCredential.user, { displayName: 'Gabriel' });
          setSuccessMessage('Acesso mestre configurado! Entrando...');
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Senha incorreta para o administrador mestre.');
            return;
          }
          throw createErr;
        }
      }

      // 4. If password was wrong in any attempt
      if (result1 === 'wrong-password' || result2 === 'wrong-password') {
        setError('Senha incorreta para este telefone.');
      } else {
        setError('Administrador não encontrado.');
      }

    } catch (err: any) {
      console.error("Admin Auth Error:", err);
      setError(err.message || 'Erro na autenticação do administrador.');
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
      let digits = phoneNumber.replace(/\D/g, '');
      let formattedNumber = '';
      
      if (phoneNumber.trim().startsWith('+')) {
        formattedNumber = `+${digits}`;
      } else if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
        formattedNumber = `+55${digits}`;
      } else {
        formattedNumber = `+${digits}`;
      }
      
      // Basic validation for Brazilian numbers (10 or 11 digits + 55)
      if (formattedNumber.length < 12) {
        throw new Error('Número incompleto. Use o formato: 48 99999-9999');
      }

      // Store registration info in session storage to be picked up after verification
      if (studentAction === 'register') {
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          fullName,
          course,
          semester,
          email,
          phoneNumber: formattedNumber
        }));
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por telefone não está habilitado no Firebase. Por favor, habilite-o no console.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Número de telefone inválido. Verifique o formato.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError(`Erro ao enviar SMS: ${err.message || 'Verifique o número e tente novamente.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Student: Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // If registering, validate and store pending data
      if (studentAction === 'register') {
        if (!fullName || !course || !semester) {
          throw new Error('Por favor, preencha nome, curso e semestre antes de continuar.');
        }
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          fullName,
          course,
          semester,
          email,
          phoneNumber
        }));
      }

      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google. Tente novamente.');
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
      // Store registration info in session storage to be picked up after verification
      if (studentAction === 'register') {
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          fullName,
          course,
          semester,
          email,
          phoneNumber
        }));
      }

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <div id="recaptcha-container"></div>
      
      {/* Back Button */}
      <button 
        onClick={() => window.location.href = '/'}
        className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors group z-50"
      >
        <ArrowRight className="rotate-180 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Voltar ao Início
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 border border-brand-gold/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full" />
            <div className="relative w-full h-full bg-zinc-900 border border-brand-gold/30 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 opacity-20"
              >
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#D4AF37_0%,transparent_25%,#D4AF37_50%,transparent_75%,#D4AF37_100%)]" />
              </motion.div>
              <GraduationCap className="text-brand-gold w-8 h-8 relative z-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
            </div>
          </div>
          <h1 className="font-serif text-2xl text-white uppercase tracking-[0.1em] mb-1">Top Line</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[7px] uppercase tracking-[0.6em] font-light text-white/60">Formaturas</span>
            <span className="text-[7px] uppercase tracking-[0.1em] font-bold text-brand-gold">Black</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-light">Acesse sua área exclusiva</p>
            {authMode === 'admin' && (
              <span className="px-2 py-0.5 rounded bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[8px] font-bold uppercase tracking-widest">
                Admin Mode
              </span>
            )}
          </div>
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
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h2 className="text-brand-gold font-bold uppercase tracking-[0.2em] text-xs">Login Administrativo</h2>
                <p className="text-gray-500 text-[10px] mt-1">Escolha o método de acesso</p>
              </div>

              {/* Admin Method Toggle */}
              <div className="flex justify-center gap-6 mb-4">
                <button 
                  onClick={() => setAdminMethod('password')}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${adminMethod === 'password' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  Senha
                </button>
                <button 
                  onClick={() => setAdminMethod('phone')}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${adminMethod === 'phone' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  SMS (Seguro)
                </button>
              </div>

              {adminMethod === 'password' ? (
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="tel"
                      placeholder="Telefone (DDD + Número)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="password"
                      placeholder="Sua Senha"
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
                    {loading ? 'Autenticando...' : 'Entrar no Painel'}
                    <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                /* Admin SMS Login */
                !confirmationResult ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="tel"
                        placeholder="+55 (99) 99999-9999"
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
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="bg-[#0a0a0a] px-4 text-gray-500">Acesso Restrito</span>
                </div>
              </div>
            </div>
          ) : (
            /* Student Login Options */
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h2 className="text-white font-bold uppercase tracking-[0.2em] text-xs">Acesso do Formando</h2>
                <p className="text-gray-500 text-[10px] mt-1">Identifique-se para receber seu acesso exclusivo</p>
              </div>

              {/* Student Action Toggle */}
              <div className="flex justify-center gap-6 mb-2">
                <button 
                  onClick={() => { setStudentAction('login'); setError(null); }}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${studentAction === 'login' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setStudentAction('register'); setError(null); }}
                  className={`text-[10px] uppercase tracking-widest font-bold pb-1 border-b-2 transition-all ${studentAction === 'register' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500'}`}
                >
                  Cadastrar
                </button>
              </div>

              {studentAction === 'register' ? (
                /* Student Registration Form */
                <form onSubmit={(e) => { e.preventDefault(); studentMethod === 'phone' ? handlePhoneLogin(e) : handleEmailLinkLogin(e); }} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        placeholder="Nome Completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Curso"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="text"
                          placeholder="Semestre"
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="tel"
                        placeholder="Telefone (DDD + Número)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-brand-gold outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-1">Como deseja receber seu acesso?</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={(e) => { setStudentMethod('phone'); handlePhoneLogin(e); }}
                        disabled={loading}
                        className="bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-brand-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                      >
                        <Phone size={16} /> SMS
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { setStudentMethod('email_link'); handleEmailLinkLogin(e); }}
                        disabled={loading}
                        className="bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                      >
                        <Mail size={16} /> E-mail
                      </button>
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                      <span className="bg-[#0a0a0a] px-4 text-gray-500">Ou continue com</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                </form>
              ) : (
                /* Student Login Form */
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
                      E-mail
                    </button>
                  </div>

                  {studentMethod === 'phone' ? (
                    !confirmationResult ? (
                      <form onSubmit={handlePhoneLogin} className="space-y-4">
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input
                            type="tel"
                            placeholder="+55 (99) 99999-9999"
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
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                      <span className="bg-[#0a0a0a] px-4 text-gray-500">Ou continue com</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                </div>
              )}

              {/* Student Login/Register Options */}
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
