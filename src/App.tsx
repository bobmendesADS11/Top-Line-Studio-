import { useState } from 'react';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Gallery from './components/Gallery';
import Editor from './components/Editor';

type AppState = 'landing' | 'auth' | 'gallery' | 'editor';

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
      {state === 'gallery' && <Gallery onSelect={handlePhotoSelection} />}
      {state === 'editor' && (
        <Editor 
          selectedPhotos={selectedPhotos} 
          onBack={() => setState('gallery')} 
        />
      )}
    </div>
  );
}
