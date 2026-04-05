import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import ProfileSetup from './components/ProfileSetup';
import Gallery from './components/Gallery';
import Editor from './components/Editor';
import AdminDashboard from './components/AdminDashboard';
import PublicViewer from './components/PublicViewer';

type AppState = 'landing' | 'auth' | 'onboarding' | 'profile_setup' | 'gallery' | 'editor' | 'admin' | 'public_view';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

export default function App() {
  console.log('App component rendering...');
  const [state, setState] = useState<AppState>('landing');
  const [user, setUser] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [sharedAlbumId, setSharedAlbumId] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    console.log('App useEffect running...');
    // Check for Supabase config
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Only show error if it's clearly a placeholder or missing
    if (!url || !key || url.includes('placeholder') || url.includes('xyz.supabase.co')) {
      setConfigError(true);
    } else {
      setConfigError(false);
    }

    const params = new URLSearchParams(window.location.search);
    const albumId = params.get('albumId');
    if (albumId) {
      setSharedAlbumId(albumId);
      setState('public_view');
    }
  }, []);

  const handleStart = () => {
    if (user) {
      setState('gallery');
    } else {
      setState('auth');
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    // Check if user is admin (using phone as identifier for demo, 
    // or you can check email if using Google Auth)
    if (userData.phone === '+5548999999999' || userData.email === 'GabrielMestrelli@gmail.com') {
      setState('admin');
    } else {
      setState('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setState('profile_setup');
  };

  const handleProfileComplete = () => {
    setState('gallery');
  };

  const handlePhotoSelection = (photos: Photo[]) => {
    setSelectedPhotos(photos);
    setState('editor');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-2 right-2 text-[10px] text-yellow-500/50 z-[300]">v1.0.3-debug</div>
      <div className="fixed bottom-2 left-2 text-[10px] text-green-500 z-[300]">App Running</div>
      {configError && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] py-1 px-4 text-center z-[200] font-bold uppercase tracking-widest">
          Configuração do Supabase ausente. Verifique as variáveis de ambiente no Vercel.
        </div>
      )}
      {state === 'landing' && <Landing onStart={handleStart} />}
      {state === 'auth' && <Auth onLogin={handleLogin} />}
      {state === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {state === 'profile_setup' && user && (
        <ProfileSetup userId={user.id} onComplete={handleProfileComplete} />
      )}
      {state === 'gallery' && <Gallery onSelect={handlePhotoSelection} />}
      {state === 'editor' && (
        <Editor 
          selectedPhotos={selectedPhotos} 
          onBack={() => setState('gallery')} 
        />
      )}
      {state === 'admin' && (
        <AdminDashboard onBack={() => setState('landing')} />
      )}
      {state === 'public_view' && sharedAlbumId && (
        <PublicViewer albumId={sharedAlbumId} />
      )}
    </div>
  );
}
