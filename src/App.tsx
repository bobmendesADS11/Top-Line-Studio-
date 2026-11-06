import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import { getAccessMode } from './lib/accessMode';

// Telas pesadas (3D, editor, painel admin) só são baixadas quando a pessoa entra nelas.
// Assim a página inicial abre bem mais rápido.
const Auth = lazy(() => import('./components/Auth'));
const Admin = lazy(() => import('./components/Admin'));
const Student = lazy(() => import('./components/Student'));

const ScreenLoader: React.FC = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

interface RouteWrapperProps {
  currentLocation: ReturnType<typeof useLocation>;
  user: any;
  role: string | null;
  loading: boolean;
}

const AnimatedRouteWrapper: React.FC<RouteWrapperProps> = React.memo(({ currentLocation, user, role, loading }) => {
  return (
    <div
      className="w-full min-h-screen bg-black route-fade-in"
    >
      <Suspense fallback={<ScreenLoader />}>
      <Routes location={currentLocation}>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/login" 
          element={loading ? <ScreenLoader /> : user ? <Navigate to={role === 'admin' && getAccessMode() !== 'aluno' ? '/admin' : '/area-do-aluno'} replace /> : <Auth />} 
        />
        <Route 
          path="/admin/*" 
          element={loading ? <ScreenLoader /> : role === 'admin' ? <Admin /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/area-do-aluno/*" 
          element={
            loading ? <ScreenLoader /> :
            role === 'admin' ? (getAccessMode() === 'aluno' ? <Student /> : <Navigate to="/admin" replace />) :
            role === 'student' ? <Student /> : 
            role === 'pending' ? <PendingAccess /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
});

AnimatedRouteWrapper.displayName = 'AnimatedRouteWrapper';

const AnimatedRoutes: React.FC<{ user: any; role: string | null; loading: boolean }> = ({ user, role, loading }) => {
  const location = useLocation();

  // Top-level section key so that main views (Landing, Login, Admin, Student) transition smoothly
  const sectionKey = location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname.startsWith('/area-do-aluno')
      ? 'student'
      : location.pathname === '/login'
        ? 'login'
        : 'landing';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [sectionKey]);

  // Sem esperar animação de saída: se a aba estiver em segundo plano (ex.: popup de
  // login do Google), a animação não termina e a tela nova nunca aparecia.
  return (
    <AnimatedRouteWrapper
      key={sectionKey}
      currentLocation={location}
      user={user}
      role={role}
      loading={loading}
    />
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    // Firebase (login + banco) carrega depois da página aparecer: a home abre bem mais rápido
    (async () => {
    const [{ auth, db }, { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink }, { doc, getDoc, setDoc, serverTimestamp }] =
      await Promise.all([import('./lib/firebase'), import('firebase/auth'), import('firebase/firestore')]);
    if (cancelled) return;
    // Handle Email Link Sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Por favor, confirme seu e-mail para completar o acesso:');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
          })
          .catch((error) => {
            console.error("Error signing in with email link:", error);
          });
      }
    }

    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Contas "mestre" que podem se promover a admin sozinhas (as regras do Firestore
          // aceitam só estas: e-mail do Gabriel verificado ou o telefone dele verificado por SMS).
          // Qualquer outro admin precisa ter role = 'admin' definido por um admin no banco.
          const isAdminEmail = currentUser.email?.toLowerCase() === 'gabrielmestrelli@gmail.com' && currentUser.emailVerified;
          const isAdminPhone = currentUser.phoneNumber === '+5548991764001';
          const isImmediateStudent = currentUser.email?.toLowerCase() === 'bielmaestrelli@hotmail.com';
          const shouldBeAdmin = isAdminEmail || isAdminPhone;

          // Check user role in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          // Internet ruim: não deixa a tela esperando o banco para sempre
          const userSnap = await Promise.race([
            getDoc(userRef),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout ao ler perfil')), 12000)),
          ]);

          if (userSnap.exists()) {
            const currentData = userSnap.data();
            
            if (shouldBeAdmin && currentData.role !== 'admin') {
              // Upgrade to admin if needed
              await setDoc(userRef, { ...currentData, role: 'admin' }, { merge: true });
              setRole('admin');
            } else if (currentData.role === 'pending' || isImmediateStudent) {
              // Automatically activate pending accounts to full student access
              await setDoc(userRef, { ...currentData, role: 'student', package: currentData.package || 'ALBUM' }, { merge: true });
              setRole('student');
            } else {
              setRole(currentData.role);
            }
          } else {
            // Create new profile with instant student access
            const newRole = shouldBeAdmin ? 'admin' : 'student';
            
            // Pick up pending registration data if available
            const pendingDataStr = sessionStorage.getItem('pendingRegistration');
            const pendingData = pendingDataStr ? JSON.parse(pendingDataStr) : {};
            sessionStorage.removeItem('pendingRegistration');

            let extractedPhone = currentUser.phoneNumber || pendingData.phoneNumber || '';
            if (!extractedPhone && currentUser.email?.endsWith('@admin.topline.com')) {
              extractedPhone = '+' + currentUser.email.split('@')[0];
            }

            let extractedName = currentUser.displayName || pendingData.fullName || '';
            if (shouldBeAdmin && !extractedName) {
              extractedName = 'Gabriel';
            }

            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || pendingData.email || '',
              displayName: extractedName,
              photoURL: currentUser.photoURL || '',
              phoneNumber: extractedPhone,
              institution: pendingData.institution || '',
              course: pendingData.course || '',
              semester: pendingData.semester || '',
              role: newRole,
              package: pendingData.package || 'ALBUM',
              createdAt: serverTimestamp(),
            });
            setRole(newRole);
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user role:", error);
          
          // Sem acesso ao banco não dá para saber o papel: entra como aluno.
          // (Nunca liberar o painel admin pelo lado do navegador — quem decide são as regras.)
          setRole('student');
          setUser(currentUser);
        }
        setLoading(false);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    })().catch((error) => {
      console.error('Erro ao iniciar o login:', error);
      setLoading(false);
    });

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // A página inicial abre na hora; só as áreas que dependem do login esperam o banco.
  return (
    <Router>
      <AnimatedRoutes user={user} role={role} loading={loading} />
    </Router>
  );
};

const PendingAccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900/50 border border-brand-gold/20 rounded-3xl p-12 text-center backdrop-blur-xl"
      >
        <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-gold/20">
          <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="topline-Studio text-3xl mb-4">Acesso em Processamento</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Olá! Recebemos sua solicitação. Sua conta está sendo configurada pela nossa equipe. 
          Em breve você terá acesso total à sua área exclusiva Top Line.
        </p>
        <button 
          onClick={async () => { const { auth } = await import('./lib/firebase'); auth.signOut(); }}
          className="text-brand-gold text-xs font-bold uppercase tracking-widest hover:underline"
        >
          Sair e Voltar depois
        </button>
      </motion.div>
    </div>
  );
};

export default App;
