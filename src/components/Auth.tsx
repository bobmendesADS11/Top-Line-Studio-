import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, sendSignInLinkToEmail, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  LogIn, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  UserCircle, 
  Key, 
  Clock, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  Phone,
  CheckCircle2,
  Building2
} from 'lucide-react';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');
  const [studentAction, setStudentAction] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic_link'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Student Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Admin Form States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to translate Firebase Auth errors to friendly Portuguese
  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'E-mail ou senha incorretos. Verifique suas credenciais ou crie uma conta.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Alterne para a aba "Login" para entrar com sua senha.';
    }
    if (code === 'auth/weak-password') {
      return 'A senha é fraca. Digite pelo menos 6 caracteres.';
    }
    if (code === 'auth/invalid-email') {
      return 'Formato de e-mail inválido. Verifique o endereço digitado.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'O popup do Google foi fechado antes de concluir a autenticação.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Falha na conexão de rede. Verifique sua internet.';
    }
    return err?.message || 'Ocorreu um erro na autenticação. Tente novamente.';
  };

  // Student Direct Login (Email + Password)
  const handleStudentEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor, informe e-mail e senha.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      setSuccessMessage('Login efetuado com sucesso! Acessando sua área...');
    } catch (err: any) {
      console.error('Student login error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Student Direct Registration (Creates account & immediately grants access)
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();
    const cleanInstitution = institution.trim();
    const cleanCourse = course.trim();
    const cleanSemester = semester.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      setError('Por favor, preencha nome completo, e-mail e crie uma senha.');
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      // 2. Set Firebase Auth Display Name
      await updateProfile(user, { displayName: cleanName });

      // 3. Immediately store student profile with instant access (role: 'student')
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: cleanEmail,
        displayName: cleanName,
        institution: cleanInstitution || 'Não informada',
        course: cleanCourse || 'Geral',
        semester: cleanSemester || 'Concluído',
        phoneNumber: cleanPhone,
        role: 'student',
        package: 'ALBUM',
        createdAt: serverTimestamp(),
      });

      setSuccessMessage('Conta criada com sucesso! Redirecionando para seu álbum exclusivo...');
    } catch (err: any) {
      console.error('Student register error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Student Google 1-Click Login / Register
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // If registering with Google, preserve any pre-filled profile info
      if (studentAction === 'register') {
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          fullName: fullName.trim(),
          institution: institution.trim(),
          course: course.trim(),
          semester: semester.trim(),
          phoneNumber: phoneNumber.trim(),
          package: 'ALBUM',
        }));
      }

      await signInWithPopup(auth, googleProvider);
      setSuccessMessage('Autenticado com Google com sucesso!');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Student Magic Link Login (Optional alternative)
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor, informe seu e-mail.');
      setLoading(false);
      return;
    }

    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', cleanEmail);
      setSuccessMessage('Link de acesso enviado para o seu e-mail! Dica: se não encontrar na caixa de entrada, verifique a pasta de Lixo Eletrônico/Spam.');
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError('Erro ao enviar link. Recomendamos entrar com senha ou Google para acesso instantâneo.');
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Digite seu e-mail para receber as instruções de recuperação.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('Não foi possível enviar a redefinição. Verifique o e-mail digitado.');
    } finally {
      setLoading(false);
    }
  };

  // Login administrativo
  // Segurança: nenhuma senha fica no código. O login só funciona com contas de admin
  // que já existem no Firebase Authentication (criadas pelo console do Firebase).
  // Quem é admin de verdade é decidido pelas regras do Firestore (campo role = 'admin').
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const loginInput = adminUsername.trim().toLowerCase();
    const trimmedPassword = adminPassword.trim();

    if (!loginInput || !trimmedPassword) {
      setError('Informe usuário e senha.');
      setLoading(false);
      return;
    }

    // Monta a lista de e-mails possíveis a partir do que foi digitado
    const candidates: string[] = [];
    if (loginInput.includes('@')) {
      candidates.push(loginInput);
    } else if (loginInput === 'gabriel' || loginInput === 'admin') {
      candidates.push('gabriel@admin.topline.com', 'gabriel0709@admin.topline.com', 'gabriel.master@admin.topline.com');
    } else {
      const digits = loginInput.replace(/\D/g, '');
      if (digits) {
        const withCountry = (digits.length === 10 || digits.length === 11) && !digits.startsWith('55') ? '55' + digits : digits;
        const withoutCountry = withCountry.startsWith('55') ? withCountry.substring(2) : withCountry;
        candidates.push(`${withCountry}@admin.topline.com`, `${withoutCountry}@admin.topline.com`);
      } else {
        candidates.push(`${loginInput}@admin.topline.com`);
      }
    }

    try {
      for (const candidateEmail of candidates) {
        try {
          await signInWithEmailAndPassword(auth, candidateEmail, trimmedPassword);
          setSuccessMessage('Acesso administrativo autorizado! Entrando no painel...');
          return;
        } catch (err: any) {
          if (err?.code === 'auth/too-many-requests') throw err;
          // tenta o próximo e-mail
        }
      }
      setError('Usuário ou senha de administrador incorretos.');
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-gold/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Back to Home Button */}
      <button 
        onClick={() => window.location.href = '/'}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 text-gray-400 hover:text-white flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest transition-colors group z-50 bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5"
      >
        <ArrowRight className="rotate-180 w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform text-brand-gold" />
        Voltar ao Início
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-zinc-950/80 border border-brand-gold/25 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] mt-12 sm:mt-0 relative z-10"
      >
        {/* Top Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative w-14 h-14 mb-3">
            <div className="absolute inset-0 bg-brand-gold/25 blur-xl rounded-full" />
            <div className="relative w-full h-full bg-zinc-900 border border-brand-gold/40 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group">
              <GraduationCap className="text-brand-gold w-7 h-7 relative z-10 drop-shadow-[0_0_12px_rgba(212,175,55,0.7)]" />
            </div>
          </div>

          <div className="relative flex items-center justify-center gap-3">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl sm:text-2xl text-white uppercase tracking-[0.25em]">Top</span>
              <span className="font-serif text-xl sm:text-2xl text-white uppercase tracking-[0.25em]">Line</span>
            </div>
            <span className="font-script text-2xl sm:text-3xl gold-gradient leading-none pt-1 inline-block pr-2">Studio</span>
            
            {/* 20 Anos Badge */}
            <div className="flex flex-col items-center ml-1 border-l border-white/10 pl-2">
              <span className="font-script text-xl text-brand-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] inline-block px-1">20</span>
              <span className="text-[9px] uppercase tracking-widest text-brand-gold/80 -mt-1 font-bold">Anos</span>
            </div>
          </div>
          
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-light mt-2">
            {authMode === 'student' ? 'Portal do Formando' : 'Painel de Gestão'}
          </p>
        </div>

        {/* Portal Switcher (Aluno vs Admin) */}
        <div className="flex bg-black/60 p-1 rounded-xl mb-6 border border-white/10">
          <button
            onClick={() => { setAuthMode('student'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'student' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <GraduationCap size={14} />
            Área do Aluno
          </button>
          <button
            onClick={() => { setAuthMode('admin'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'admin' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} />
            Administrador
          </button>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-xs flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-5 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <div className="leading-relaxed">{successMessage}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION: ADMIN LOGIN */}
        {authMode === 'admin' ? (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-brand-gold font-bold uppercase tracking-[0.2em] text-xs">Acesso Administrativo</h2>
              <p className="text-gray-400 text-[11px] mt-1">Identifique-se com usuário e senha de gestão</p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Usuário (ex: gabriel)"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-sm"
                  required
                />
              </div>

              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/15 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                {loading ? 'Autenticando...' : 'Entrar no Painel Master'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          /* SECTION: STUDENT AUTHENTICATION */
          <div className="space-y-5">
            {/* Student Mode Selector (Login vs Cadastrar) */}
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => { setStudentAction('login'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center transition-all border-b-2 ${
                  studentAction === 'login' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Já sou Cadastrado
              </button>
              <button 
                onClick={() => { setStudentAction('register'); setError(null); setSuccessMessage(null); }}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest text-center transition-all border-b-2 ${
                  studentAction === 'register' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Quick 1-Click Google Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-white/10 active:scale-[0.99] transition-all text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 border border-white/15 disabled:opacity-50 text-xs shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {studentAction === 'login' ? 'Entrar com Google (1 clique)' : 'Cadastrar com Google (1 clique)'}
              </button>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-zinc-950 px-3 text-gray-500">ou com seu e-mail e senha</span>
              </div>
            </div>

            {/* REGISTER FORM */}
            {studentAction === 'register' ? (
              <form onSubmit={handleStudentRegister} className="space-y-3.5">
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                  <input
                    type="text"
                    placeholder="Nome Completo do Formando"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                    required
                  />
                </div>

                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                  <input
                    type="text"
                    placeholder="Instituição / Faculdade (ex: UFSC, UNISUL...)"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="text"
                      placeholder="Curso"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="text"
                      placeholder="Semestre/Ano"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                  <input
                    type="tel"
                    placeholder="WhatsApp (DDD + Número)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                    required
                  />
                </div>

                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie sua senha de acesso (mín. 6 dígitos)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-gold transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="bg-brand-gold/10 border border-brand-gold/20 p-3 rounded-xl flex items-center gap-2.5">
                  <Sparkles size={16} className="text-brand-gold shrink-0" />
                  <span className="text-[11px] text-gray-300">
                    Acesso imediato! Não depende de link por e-mail e não cai na caixa de spam.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/15 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest mt-2"
                >
                  {loading ? 'Criando Conta...' : 'Criar Minha Conta e Acessar'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <div className="space-y-4">
                {loginMethod === 'password' ? (
                  <form onSubmit={handleStudentEmailLogin} className="space-y-3.5">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                      <input
                        type="email"
                        placeholder="Seu e-mail cadastrado"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha de acesso"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-gold transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(!showForgotPassword)}
                        className="text-[10px] text-brand-gold/80 hover:text-brand-gold transition-colors uppercase tracking-widest font-semibold"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    {showForgotPassword && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-zinc-900 border border-white/10 rounded-xl space-y-2"
                      >
                        <p className="text-[11px] text-gray-300">
                          Digite seu e-mail acima e enviaremos um link seguro para redefinir sua senha:
                        </p>
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={loading}
                          className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-xs transition-colors"
                        >
                          Enviar E-mail de Recuperação
                        </button>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/15 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      {loading ? 'Acessando...' : 'Entrar na Área do Aluno'}
                      <LogIn size={16} />
                    </button>
                  </form>
                ) : (
                  /* MAGIC LINK ALTERNATIVE FORM */
                  <form onSubmit={handleMagicLinkLogin} className="space-y-3.5">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                      <input
                        type="email"
                        placeholder="Digite seu e-mail para receber o link"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-brand-gold outline-none transition-colors text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5">
                      <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-200/90 leading-relaxed">
                        Atenção: Provedores como Hotmail/Outlook podem enviar este link para o Lixo Eletrônico. 
                        Recomendamos usar seu login com <b>senha</b> ou <b>Google</b> acima para entrar instantaneamente sem falhas.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-gold text-black font-bold py-3.5 rounded-xl hover:bg-brand-gold/90 transition-all shadow-lg shadow-brand-gold/15 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      {loading ? 'Enviando...' : 'Enviar Link por E-mail'}
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* Toggle between Password and Magic Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod(loginMethod === 'password' ? 'magic_link' : 'password');
                      setError(null);
                    }}
                    className="text-[10px] text-gray-400 hover:text-brand-gold transition-colors underline underline-offset-4"
                  >
                    {loginMethod === 'password' 
                      ? 'Prefere receber um link de acesso por e-mail? Clique aqui'
                      : 'Voltar para o login padrão com E-mail e Senha'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-[10px] text-gray-600 uppercase tracking-widest font-light">
          Top Line Studio • Excelência em Formaturas
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
