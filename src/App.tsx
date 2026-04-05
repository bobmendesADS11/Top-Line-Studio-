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
  const [state, setState] = useState<AppState>('landing');
  const [user, setUser] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
  const [sharedAlbumId, setSharedAlbumId] = useState<string | null>(null);

  useEffect(() => {
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
    <div className="min-h-screen bg-brand-black">
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
