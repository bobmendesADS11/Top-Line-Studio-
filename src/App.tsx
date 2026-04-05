import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Admin from './components/Admin';
import Student from './components/Student';

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
          // Check user role in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setRole(userSnap.data().role);
          } else {
            // Create new student profile if it doesn't exist
            const newRole = currentUser.email === 'GabrielMestrelli@gmail.com' ? 'admin' : 'student';
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              phoneNumber: currentUser.phoneNumber,
              role: newRole,
              createdAt: serverTimestamp(),
            });
            setRole(newRole);
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUser(currentUser);
          setRole('student'); // Fallback
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={role === 'admin' ? '/admin' : '/area-do-aluno'} /> : <Auth />} 
        />
        <Route 
          path="/admin/*" 
          element={role === 'admin' ? <Admin /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/area-do-aluno/*" 
          element={role === 'student' ? <Student /> : <Navigate to="/login" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
