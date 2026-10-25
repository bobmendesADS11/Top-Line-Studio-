import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Admin from './components/Admin';
import Student from './components/Student';

interface RouteWrapperProps {
  currentLocation: ReturnType<typeof useLocation>;
  user: any;
  role: string | null;
}

const AnimatedRouteWrapper: React.FC<RouteWrapperProps> = React.memo(({ currentLocation, user, role }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="w-full min-h-screen bg-black"
    >
      <Routes location={currentLocation}>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={role === 'admin' ? '/admin' : '/area-do-aluno'} replace /> : <Auth />} 
        />
        <Route 
          path="/admin/*" 
          element={role === 'admin' ? <Admin /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/area-do-aluno/*" 
          element={
            role === 'admin' ? <Navigate to="/admin" replace /> :
            role === 'student' ? <Student /> : 
            role === 'pending' ? <PendingAccess /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
});

AnimatedRouteWrapper.displayName = 'AnimatedRouteWrapper';

const AnimatedRoutes: React.FC<{ user: any; role: string | null }> = ({ user, role }) => {
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      <AnimatedRouteWrapper
        key={sectionKey}
        currentLocation={location}
        user={user}
        role={role}
      />
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const isAdminEmail = currentUser.email?.toLowerCase() === 'gabrielmestrelli@gmail.com' || 
                             currentUser.email?.toLowerCase().endsWith('@admin.topline.com');
          const isAdminPhone = currentUser.phoneNumber === '+5548991764001';
          const isImmediateStudent = currentUser.email?.toLowerCase() === 'bielmaestrelli@hotmail.com';
          const shouldBeAdmin = isAdminEmail || isAdminPhone;

          // Check user role in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

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
            if (isAdminEmail && !extractedPhone && currentUser.email?.endsWith('@admin.topline.com')) {
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
          
          // Critical: If it's a master account, force admin role even if Firestore fails
          const isAdminEmail = currentUser.email?.toLowerCase() === 'gabrielmestrelli@gmail.com' || 
                             currentUser.email?.toLowerCase().endsWith('@admin.topline.com');
          const isAdminPhone = currentUser.phoneNumber === '+5548991764001';
          
          if (isAdminEmail || isAdminPhone) {
            setRole('admin');
          } else {
            setRole('student'); // Fallback for others
          }
          setUser(currentUser);
        }
        setLoading(false);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <AnimatedRoutes user={user} role={role} />
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
          onClick={() => auth.signOut()}
          className="text-brand-gold text-xs font-bold uppercase tracking-widest hover:underline"
        >
          Sair e Voltar depois
        </button>
      </motion.div>
    </div>
  );
};

export default App;
