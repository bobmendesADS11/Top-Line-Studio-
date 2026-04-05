import { useState } from 'react';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Gallery from './components/Gallery';
import Editor from './components/Editor';
import AdminDashboard from './components/AdminDashboard';

type AppState = 'landing' | 'auth' | 'onboarding' | 'gallery' | 'editor' | 'admin';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [user, setUser] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);

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
    </div>
  );
}
