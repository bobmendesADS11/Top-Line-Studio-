import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Grid, 
  Maximize, 
  Layers, 
  Palette, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Clock,
  ChevronLeft,
  Settings2,
  Box,
  Crop as CropIcon,
  AlertTriangle,
  X,
  ListOrdered,
  History,
  MessageCircle,
  Save,
  BookmarkCheck
} from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import Album3D from './Album3D';
import CheckoutModal from './CheckoutModal';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  aspectRatio?: number;
}

interface PhotoCrop {
  px?: Area;
}

interface AlbumEditorProps {
  photos: Photo[];
  onSave?: (pages: string[]) => void;
  onBack?: () => void;
  hasPurchasedAlbum?: boolean;
  userTier?: 'PROSPECT' | 'LINK' | 'ALBUM';
}

type LayoutType = 'minimalist' | 'grid' | 'vgrid' | 'panorama' | 'spread';
type EffectType = 'none' | 'bw' | 'sepia' | 'vintage' | 'vibrant';
type AlbumSize = '20x30' | '30x30' | '30x40';
type MaterialType = 'standard' | 'premium' | 'acrylic' | 'leather' | 'velvet' | 'photo';

const PRICES = {
  edition: {
    link: 1200.00,       // Noir Link Studio (Digital)
    album: 1850.00,     // Full Experience (Physical + Link)
  },
  photo: 45.00,         // Unit price per photo curated
  size: {
    '20x30': 0,
    '30x30': 150,
    '30x40': 300
  },
  material: {
    'standard': 0,
    'premium': 350,
    'leather': 550,
    'acrylic': 950,
    'velvet': 750,
    'photo': 500
  },
  pagePackage: {
    20: 0,
    40: 400,
    60: 750,
    80: 1100
  }
};

const DEMO_PHOTOS: Photo[] = [
  { id: 'demo1', url: 'https://picsum.photos/seed/grad1/800/1200' },
  { id: 'demo2', url: 'https://picsum.photos/seed/grad2/800/1200' },
  { id: 'demo3', url: 'https://picsum.photos/seed/grad3/800/1200' },
  { id: 'demo4', url: 'https://picsum.photos/seed/grad4/800/1200' },
  { id: 'demo5', url: 'https://picsum.photos/seed/grad5/800/1200' },
  { id: 'demo6', url: 'https://picsum.photos/seed/grad6/800/1200' },
];

const DEFAULT_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-11606-large.mp4";

const getStorageKey = () => `topline_album_draft_${auth.currentUser?.uid || 'guest'}`;

// Fotos enviadas ficam como data URL (até ~1 MB cada). Guardar isso dentro do rascunho
// estourava o limite do Firestore (1 MB por documento) e do localStorage (~5 MB),
// e o salvamento falhava em silêncio. No rascunho guardamos só a referência (id + url leve)
// e na hora de restaurar buscamos a foto completa pelo id.
const toLightPhoto = (p: Photo): Photo => ({
  id: p.id,
  url: p.url?.startsWith('data:') ? '' : p.url,
  thumbnail: p.thumbnail?.startsWith('data:') ? undefined : p.thumbnail,
  aspectRatio: p.aspectRatio,
});

const rehydratePhotos = (saved: Photo[], available: Photo[]): Photo[] => {
  const byId = new Map(available.map(p => [p.id, p]));
  const restored = saved
    .map(p => byId.get(p.id) || (p.url ? p : null))
    .filter(Boolean) as Photo[];
  // Fotos novas que ainda não estavam no rascunho entram no final
  const savedIds = new Set(saved.map(p => p.id));
  return [...restored, ...available.filter(p => !savedIds.has(p.id))];
};
const getVersionsKey = () => `topline_album_versions_${auth.currentUser?.uid || 'guest'}`;

interface AlbumSnapshot {
  id: string;
  label: string;
  timestamp: string;
  date: string;
  pageCount: number;
  photoCount: number;
  purchaseType: 'LINK' | 'FULL';
  snapshot: any;
}

const AlbumEditor: React.FC<AlbumEditorProps> = ({ photos, onSave, onBack, hasPurchasedAlbum = false, userTier = 'PROSPECT' }) => {
  const [activePhotos, setActivePhotos] = useState<Photo[]>(() => photos.length > 0 ? photos : DEMO_PHOTOS);
  
  // Ordem das fotos salva no rascunho (para não perder a arrumação quando as fotos recarregam)
  const savedPhotoOrderRef = useRef<Photo[] | null>(null);

  // Keep activePhotos in sync with incoming photos prop
  useEffect(() => {
    if (photos.length > 0) {
      setActivePhotos(savedPhotoOrderRef.current ? rehydratePhotos(savedPhotoOrderRef.current, photos) : photos);
    }
  }, [photos]);

  const [globalLayout, setGlobalLayout] = useState<LayoutType>('minimalist');
  const [pageEffects, setPageEffects] = useState<EffectType[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [albumSize, setAlbumSize] = useState<AlbumSize>('30x30');
  const [materialType, setMaterialType] = useState<MaterialType>('standard');
  const [videoUrl, setVideoUrl] = useState<string>(DEFAULT_VIDEO);
  const [pages, setPages] = useState<string[]>([]);
  const [pageLayouts, setPageLayouts] = useState<LayoutType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [requestedPageCount, setRequestedPageCount] = useState<number>(20);
  const [purchaseType, setPurchaseType] = useState<'LINK' | 'FULL'>('FULL');

  // Auto-Save, Versions & Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [savedVersions, setSavedVersions] = useState<AlbumSnapshot[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [draftRestoredToast, setDraftRestoredToast] = useState(false);
  
  const getPhotosTotalCapacity = () => {
    let cap = 0;
    for (let i = 0; i < pageLayouts.length; i++) {
      const layout = pageLayouts[i];
      if (layout === 'grid') cap += 4;
      else if (layout === 'vgrid') cap += 2;
      else if (layout === 'panorama') {
        cap += 1;
        i++;
      } else {
        cap += 1;
      }
    }
    return cap;
  };

  const optimizeHelper = (layoutsArr: LayoutType[], targetCount: number, updateFn: (arr: LayoutType[]) => void) => {
    let photoIdx = 0;
    const newLayouts = [...layoutsArr];
    const totalPages = newLayouts.length;
    
    // Reset all to minimalist first to have a clean slate
    for (let i = 0; i < totalPages; i++) newLayouts[i] = 'minimalist';

    for (let i = 0; i < totalPages; i++) {
      if (photoIdx >= targetCount) break;

      const remainingPhotos = targetCount - photoIdx;
      const remainingPages = totalPages - i;
      
      // If we have more photos than pages left, we need higher density
      if (remainingPhotos > remainingPages) {
        // Can we do a panorama? (Needs at least 2 pages and 1 photo)
        // Only if it doesn't leave too many photos for too few pages
        const isIdealForPanorama = i % 4 === 2 && remainingPages >= 2 && (remainingPhotos - 1) <= (remainingPages - 2) * 4;
        
        if (isIdealForPanorama) {
          newLayouts[i] = 'panorama';
          if (i + 1 < totalPages) newLayouts[i + 1] = 'panorama';
          photoIdx += 1;
          i++; // skip next page
        } else {
          // Choose density based on what's needed to finish exactly
          const densityNeeded = remainingPhotos / remainingPages;
          
          if (densityNeeded > 2.5 && remainingPhotos >= 4) {
            newLayouts[i] = 'grid';
            photoIdx += 4;
          } else if (densityNeeded > 1.2 && remainingPhotos >= 2) {
            newLayouts[i] = 'vgrid';
            photoIdx += 2;
          } else {
            newLayouts[i] = 'minimalist';
            photoIdx += 1;
          }
        }
      } else {
        // 1 photo per page is enough
        newLayouts[i] = 'minimalist';
        photoIdx += 1;
      }
    }

    // Final safety check: if we still have photos left (shouldn't happen with 30/20, but for safety)
    if (photoIdx < targetCount) {
       // Bump the last few pages to grid until satisfied
       for (let i = totalPages - 1; i >= 0 && photoIdx < targetCount; i--) {
          const oldLayout = newLayouts[i];
          if (oldLayout === 'panorama') continue; // don't break spreads
          
          if (oldLayout === 'minimalist') {
            newLayouts[i] = 'vgrid';
            photoIdx += 1;
          } else if (oldLayout === 'vgrid') {
            newLayouts[i] = 'grid';
            photoIdx += 2;
          }
       }
    }

    updateFn([...newLayouts]);
  };

  const optimizeLayouts = () => {
    optimizeHelper(pageLayouts, activePhotos.length, setPageLayouts);
  };

  const movePhotoInOrder = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...activePhotos];
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= newPhotos.length) return;
    
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[newIdx];
    newPhotos[newIdx] = temp;
    
    setActivePhotos(newPhotos);
  };

  // Crop state
  const [photoCrops, setPhotoCrops] = useState<Record<string, PhotoCrop>>({});
  const [croppingPhoto, setCroppingPhoto] = useState<{ id: string, url: string, aspect: number, baseZoom: number } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [completedCrop, setCompletedCrop] = useState<Area | null>(null);
  
  const totalPriceLink = PRICES.edition.link + (activePhotos.length * PRICES.photo);
  const totalPriceFull = PRICES.edition.album + 
                        (activePhotos.length * PRICES.photo) + 
                        PRICES.size[albumSize] + 
                        PRICES.material[materialType] + 
                        (PRICES.pagePackage[requestedPageCount as keyof typeof PRICES.pagePackage] || 0);

  const totalPrice = purchaseType === 'LINK' ? totalPriceLink : totalPriceFull;

  // Load Draft and Versions
  useEffect(() => {
    const loadDraftAndVersions = async () => {
      try {
        const userStorageKey = getStorageKey();
        const saved = localStorage.getItem(userStorageKey) || localStorage.getItem('noir_album_persistence');
        const savedVersionsRaw = localStorage.getItem(getVersionsKey());

        if (savedVersionsRaw) {
          try {
            setSavedVersions(JSON.parse(savedVersionsRaw));
          } catch (e) {
            console.warn('Error parsing saved versions:', e);
          }
        }

        let draftData: any = null;
        if (saved) {
          draftData = JSON.parse(saved);
        } else if (auth.currentUser) {
          // Attempt loading from Firestore if local draft is empty
          try {
            const draftDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'drafts', 'album_editor'));
            if (draftDoc.exists()) {
              draftData = draftDoc.data();
            }
          } catch (e) {
            console.warn('Firestore draft read error:', e);
          }
        }

        if (draftData) {
          if (draftData.globalLayout) setGlobalLayout(draftData.globalLayout);
          if (draftData.pageLayouts) setPageLayouts(draftData.pageLayouts);
          if (draftData.pageEffects) setPageEffects(draftData.pageEffects);
          if (draftData.coverPhotoId) setCoverPhotoId(draftData.coverPhotoId);
          if (draftData.albumSize) setAlbumSize(draftData.albumSize);
          if (draftData.materialType) setMaterialType(draftData.materialType);
          if (draftData.requestedPageCount) setRequestedPageCount(draftData.requestedPageCount);
          if (draftData.purchaseType) setPurchaseType(draftData.purchaseType);
          if (draftData.photoCrops) setPhotoCrops(draftData.photoCrops);
          if (draftData.videoUrl) setVideoUrl(draftData.videoUrl);
          if (draftData.activePhotos && Array.isArray(draftData.activePhotos) && draftData.activePhotos.length > 0) {
            savedPhotoOrderRef.current = draftData.activePhotos;
            const restored = rehydratePhotos(draftData.activePhotos, photos);
            if (restored.length > 0) setActivePhotos(restored);
          }

          setDraftRestoredToast(true);
          setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
          setTimeout(() => setDraftRestoredToast(false), 5000);
        }
      } catch (e) {
        console.error("Erro ao carregar rascunho:", e);
      } finally {
        setIsFirstLoad(false);
      }
    };

    loadDraftAndVersions();
  }, []);

  // Continuous Auto-Save to LocalStorage and Firestore
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lembra a ordem atual (o aluno pode reordenar) para quando as fotos recarregarem
  useEffect(() => {
    if (!isFirstLoad && activePhotos.length > 0) savedPhotoOrderRef.current = activePhotos;
  }, [activePhotos, isFirstLoad]);

  useEffect(() => {
    if (isFirstLoad) return;
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const draft = {
        globalLayout,
        pageLayouts,
        pageEffects,
        coverPhotoId,
        albumSize,
        materialType,
        requestedPageCount,
        purchaseType,
        photoCrops,
        videoUrl,
        activePhotos: activePhotos.map(toLightPhoto),
        lastSavedAt: now.toISOString()
      };

      // 1. Save to LocalStorage
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(draft));
        setLastSavedTime(timeStr);
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      // 2. Sync to Firestore if authenticated
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid, 'drafts', 'album_editor'), {
            ...draft,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.warn('Firestore draft sync error:', err);
        }
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [globalLayout, pageLayouts, pageEffects, coverPhotoId, albumSize, materialType, requestedPageCount, purchaseType, photoCrops, videoUrl, activePhotos, isFirstLoad]);

  // Version management functions
  const handleSaveNewVersion = (label?: string) => {
    const versionLabel = label || newVersionLabel.trim() || `Versão ${savedVersions.length + 1}`;
    const now = new Date();
    const newVersion: AlbumSnapshot = {
      id: 'ver_' + Date.now(),
      label: versionLabel,
      timestamp: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('pt-BR'),
      pageCount: pageLayouts.length,
      photoCount: activePhotos.length,
      purchaseType,
      snapshot: {
        globalLayout,
        pageLayouts: [...pageLayouts],
        pageEffects: [...pageEffects],
        coverPhotoId,
        albumSize,
        materialType,
        requestedPageCount,
        purchaseType,
        photoCrops: { ...photoCrops },
        videoUrl,
        activePhotos: activePhotos.map(toLightPhoto)
      }
    };

    const updated = [newVersion, ...savedVersions].slice(0, 15);
    setSavedVersions(updated);
    setNewVersionLabel('');
    try {
      localStorage.setItem(getVersionsKey(), JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving version list:', e);
    }
  };

  const handleRestoreVersion = (ver: AlbumSnapshot) => {
    if (!ver.snapshot) return;
    const s = ver.snapshot;
    if (s.globalLayout) setGlobalLayout(s.globalLayout);
    if (s.pageLayouts) setPageLayouts(s.pageLayouts);
    if (s.pageEffects) setPageEffects(s.pageEffects);
    if (s.coverPhotoId) setCoverPhotoId(s.coverPhotoId);
    if (s.albumSize) setAlbumSize(s.albumSize);
    if (s.materialType) setMaterialType(s.materialType);
    if (s.requestedPageCount) setRequestedPageCount(s.requestedPageCount);
    if (s.purchaseType) setPurchaseType(s.purchaseType);
    if (s.photoCrops) setPhotoCrops(s.photoCrops);
    if (s.videoUrl) setVideoUrl(s.videoUrl);
    if (s.activePhotos) {
      savedPhotoOrderRef.current = s.activePhotos;
      const restored = rehydratePhotos(s.activePhotos, photos);
      if (restored.length > 0) setActivePhotos(restored);
    }

    setShowVersionsModal(false);
    setDraftRestoredToast(true);
    setTimeout(() => setDraftRestoredToast(false), 4000);
  };

  const handleDeleteVersion = (verId: string) => {
    const updated = savedVersions.filter(v => v.id !== verId);
    setSavedVersions(updated);
    try {
      localStorage.setItem(getVersionsKey(), JSON.stringify(updated));
    } catch (e) {
      console.warn('Error deleting version:', e);
    }
  };

  // Initialize page layouts and effects when photos change (only if no draft and no previous state)
  useEffect(() => {
    if (!isFirstLoad) {
      const saved = localStorage.getItem(getStorageKey()) || localStorage.getItem('noir_album_persistence');
      // If we have a saved draft, we only auto-trigger optimization if photos exceed current capacity
      if (saved && getPhotosTotalCapacity() >= activePhotos.length) return; 
    }
    
    // Auto-select best package for first load
    if (pageLayouts.length === 0) {
      const photosPerPage = globalLayout === 'grid' ? 4 : (globalLayout === 'vgrid' ? 2 : 1);
      const numPagesBase = Math.ceil(activePhotos.length / photosPerPage);
      const numPages = globalLayout === 'panorama' ? activePhotos.length * 2 : numPagesBase;
      
      const ideal = [20, 40, 60, 80].reduce((prev, curr) => 
        Math.abs(curr - numPages) < Math.abs(prev - numPages) ? curr : prev
      );
      setRequestedPageCount(ideal);
      
      const initialLayouts = new Array(ideal).fill(globalLayout);
      
      // If we have more photos than pages, we run the optimization logic immediately
      if (activePhotos.length > ideal) {
        optimizeHelper(initialLayouts, activePhotos.length, setPageLayouts);
      } else {
        setPageLayouts(initialLayouts);
        setPageEffects(new Array(ideal).fill('none'));
      }
      
      if (!coverPhotoId && activePhotos.length > 0) {
        setCoverPhotoId(activePhotos[0].id);
      }
    } else if (getPhotosTotalCapacity() < activePhotos.length) {
      // If capacity is exceeded later (e.g. user added more photos in gallery)
      // and we are not in first load, we auto-optimize if enabled
      if (isAutoSyncEnabled) {
        optimizeLayouts();
      }
    }
  }, [activePhotos.length, globalLayout, isFirstLoad, pageLayouts.length, isAutoSyncEnabled]);


  const addPage = () => {
    setPageLayouts([...pageLayouts, globalLayout]);
    setPageEffects([...pageEffects, 'none']);
  };

  const removePage = (index: number) => {
    if (pageLayouts.length <= 1) return;
    setPageLayouts(pageLayouts.filter((_, i) => i !== index));
    setPageEffects(pageEffects.filter((_, i) => i !== index));
  };

  // Update all layouts when global layout changes
  const handleGlobalLayoutChange = (newLayout: LayoutType) => {
    setGlobalLayout(newLayout);
    // When global layout changes, we preserve the current page budget (requestedPageCount)
    // but re-fill the layouts
    setPageLayouts(new Array(requestedPageCount).fill(newLayout));
    setPageEffects(new Array(requestedPageCount).fill('none'));
  };

  const handlePageCountChange = (count: number) => {
    setRequestedPageCount(count);
    if (count > pageLayouts.length) {
      const extra = count - pageLayouts.length;
      setPageLayouts([...pageLayouts, ...new Array(extra).fill(globalLayout)]);
      setPageEffects([...pageEffects, ...new Array(extra).fill('none')]);
    } else {
      setPageLayouts(pageLayouts.slice(0, count));
      setPageEffects(pageEffects.slice(0, count));
    }
  };

  const syncPageCount = useCallback(() => {
    let photoIdx = 0;
    let lastUsedPage = -1;
    
    for (let i = 0; i < pageLayouts.length; i++) {
      if (photoIdx < activePhotos.length) {
        lastUsedPage = i;
        const layout = pageLayouts[i];
        if (layout === 'grid') photoIdx += 4;
        else if (layout === 'vgrid') photoIdx += 2;
        else if (layout === 'panorama') {
          photoIdx += 1;
          lastUsedPage = i + 1 < pageLayouts.length ? i + 1 : i;
          i++; 
        } else photoIdx += 1;
      }
    }

    if (lastUsedPage !== -1 && lastUsedPage < pageLayouts.length - 1) {
      // Respect the budget: Don't shrink below requestedPageCount
      const minPages = requestedPageCount;
      const targetSlice = Math.max(minPages, lastUsedPage + 1);
      
      if (targetSlice < pageLayouts.length) {
        setPageLayouts(pageLayouts.slice(0, targetSlice));
        setPageEffects(pageEffects.slice(0, targetSlice));
      }
    }
  }, [activePhotos.length, pageLayouts, pageEffects]);

  useEffect(() => {
    if (isAutoSyncEnabled && !isFirstLoad) {
      // With fixed page packages, auto-sync might only be useful if it doesn't break the budget.
      // But for now, we'll keep it as requested: choosing the page count upfront.
      // If auto-sync is on, it might shrink below the budget if there aren't enough photos.
      syncPageCount();
    }
  }, [syncPageCount, isAutoSyncEnabled, isFirstLoad]);

  const clearDraft = () => {
    if (confirm('Deseja realmente limpar todas as edições e começar do zero?')) {
      localStorage.removeItem(getStorageKey());
      localStorage.removeItem('noir_album_persistence');
      window.location.reload();
    }
  };

  const handlePageLayoutChange = (index: number, newLayout: LayoutType) => {
    const newLayouts = [...pageLayouts];
    
    if (newLayout === 'panorama') {
      // Find the spread start (even indices: 0, 2, 4...)
      const spreadStart = index % 2 === 0 ? index : index - 1;
      if (spreadStart + 1 < newLayouts.length) {
        newLayouts[spreadStart] = 'panorama';
        newLayouts[spreadStart + 1] = 'panorama';
      } else {
        // Last page cannot be panorama spread
        newLayouts[index] = 'spread';
      }
    } else {
      // If we are changing AWAY from panorama, we only change the clicked page
      // but we must check if the companion was ALSO a panorama and change it back to something else
      const companionIdx = index % 2 === 0 ? index + 1 : index - 1;
      if (newLayouts[index] === 'panorama' && companionIdx < newLayouts.length && newLayouts[companionIdx] === 'panorama') {
        newLayouts[companionIdx] = 'minimalist';
      }
      newLayouts[index] = newLayout;
    }
    
    setPageLayouts(newLayouts);
  };


  const handlePageEffectChange = (index: number, newEffect: EffectType) => {
    const newEffects = [...pageEffects];
    newEffects[index] = newEffect;
    setPageEffects(newEffects);
  };

  const generateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate pages whenever photos, layouts, or effects change - Debounced for performance
  useEffect(() => {
    if (activePhotos.length > 0 && pageLayouts.length > 0 && pageEffects.length > 0) {
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
      generateTimerRef.current = setTimeout(() => {
        generateAllPages();
      }, 300);
    }
    return () => {
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
    };
  }, [activePhotos, pageLayouts, pageEffects, albumSize, JSON.stringify(photoCrops)]);

  const applyEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, pageEffect: EffectType) => {
    if (pageEffect === 'none') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (pageEffect === 'bw') {
        const avg = 0.3 * r + 0.59 * g + 0.11 * b;
        data[i] = data[i + 1] = data[i + 2] = avg;
      } else if (pageEffect === 'sepia') {
        data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
        data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
        data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
      } else if (pageEffect === 'vintage') {
        data[i] = r * 0.9;
        data[i + 1] = g * 0.8;
        data[i + 2] = b * 0.7;
      } else if (pageEffect === 'vibrant') {
        const max = Math.max(r, g, b);
        data[i] += (max - r) * 0.2;
        data[i + 1] += (max - g) * 0.2;
        data[i + 2] += (max - b) * 0.2;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  const pageCacheRef = useRef<Record<string, { url: string, hash: string }>>({});

  const drawPage = async (pagePhotos: Photo[], layout: LayoutType, pageEffect: EffectType, side?: 'left' | 'right'): Promise<string> => {
    // Generate simple hash for this page state
    const pageHash = JSON.stringify({
      photos: pagePhotos.map(p => ({ id: p.id, url: p.url, crop: photoCrops[p.id] })),
      layout,
      pageEffect,
      side,
      albumSize
    });

    if (pageCacheRef.current[pageHash]) {
      return pageCacheRef.current[pageHash].url;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Resolution based on size
    let width = 1200;
    let height = 1200;
    if (albumSize === '20x30') { width = 800; height = 1200; }
    if (albumSize === '30x40') { width = 1200; height = 1600; }
    
    canvas.width = width;
    canvas.height = height;

    // Background - Enhanced Luxury Material (Noir Silk)
    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Fine Silk Texture / Grain
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#222' : '#000';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Subtle edge highlight (Inner border/bevel feel)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Load images - Using cache
    const loadedImages = await Promise.all(
      pagePhotos.map(p => new Promise<{ img: HTMLImageElement, id: string }>((resolve) => {
        if (imageCacheRef.current[p.url]) {
          resolve({ img: imageCacheRef.current[p.url], id: p.id });
          return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageCacheRef.current[p.url] = img;
          resolve({ img, id: p.id });
        };
        img.onerror = () => {
          const fbCanvas = document.createElement('canvas');
          fbCanvas.width = 800;
          fbCanvas.height = 1200;
          const fbCtx = fbCanvas.getContext('2d');
          if (fbCtx) {
            fbCtx.fillStyle = '#18181b';
            fbCtx.fillRect(0, 0, 800, 1200);
            fbCtx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            fbCtx.lineWidth = 8;
            fbCtx.strokeRect(30, 30, 740, 1140);
            fbCtx.fillStyle = '#D4AF37';
            fbCtx.font = 'bold 32px serif';
            fbCtx.textAlign = 'center';
            fbCtx.fillText('TOP LINE STUDIO', 400, 580);
            fbCtx.fillStyle = '#a1a1aa';
            fbCtx.font = '20px sans-serif';
            fbCtx.fillText('Registro Oficial', 400, 630);
          }
          const placeholder = new Image();
          placeholder.onload = () => resolve({ img: placeholder, id: p.id });
          placeholder.src = fbCanvas.toDataURL('image/jpeg', 0.85);
        };
        img.src = p.url;
      }))
    );

    const drawImageWithCrop = (imgObj: { img: HTMLImageElement, id: string }, x: number, y: number, w: number, h: number, panoramaSide?: 'left' | 'right') => {
      const { img, id } = imgObj;
      const cropData = photoCrops[id];
      
      // For panorama, the effective target is twice the width
      const effectiveW = panoramaSide ? w * 2 : w;
      const targetRatio = effectiveW / h;
      
      if (cropData?.px) {
        let { x: sx, y: sy, width: sw, height: sh } = cropData.px;
        
        if (sw > 0 && sh > 0) {
          const cropRatio = sw / sh;
          
          if (Math.abs(cropRatio - targetRatio) > 0.01) {
            if (cropRatio > targetRatio) {
              const oldSw = sw;
              sw = sh * targetRatio;
              sx += (oldSw - sw) / 2;
            } else {
              const oldSh = sh;
              sh = sw / targetRatio;
              sy += (oldSh - sh) * 0.1;
            }
          }
          
          if (panoramaSide === 'left') {
            ctx.drawImage(img, sx, sy, sw / 2, sh, x, y, w, h);
          } else if (panoramaSide === 'right') {
            ctx.drawImage(img, sx + sw / 2, sy, sw / 2, sh, x, y, w, h);
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
          }
          return;
        }
      }

      // Fallback
      const imgRatio = img.width / img.height;
      let sw, sh, sx, sy;
      
      const isFit = Math.abs(imgRatio - targetRatio) < 0.01;

      if (imgRatio > targetRatio) {
        sh = img.height;
        sw = sh * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = isFit ? 0 : (img.height - sh) * 0.15;
        if (sy < 0) sy = 0;
      }

      if (panoramaSide === 'left') {
        ctx.drawImage(img, sx, sy, sw / 2, sh, x, y, w, h);
      } else if (panoramaSide === 'right') {
        ctx.drawImage(img, sx + sw / 2, sy, sw / 2, sh, x, y, w, h);
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      }
    };

    if (layout === 'minimalist') {
      if (loadedImages[0]) {
        const imgObj = loadedImages[0];
        const { img } = imgObj;
        
        // Calculate fit dimensions within margins - Reduced for more impact
        const marginX = width * 0.05;
        const marginY = height * 0.05;
        const maxW = width - marginX * 2;
        const maxH = height - marginY * 2;
        
        const imgRatio = img.width / img.height;
        const areaRatio = maxW / maxH;
        
        let drawW, drawH;
        if (imgRatio > areaRatio) {
          drawW = maxW;
          drawH = drawW / imgRatio;
        } else {
          drawH = maxH;
          drawW = drawH * imgRatio;
        }
        
        const drawX = (width - drawW) / 2;
        const drawY = (height - drawH) / 2;
        
        // Dynamic Paper Depth / Shadow behind the photo - Softer, centered shadow
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 15;

        // Fine Art Frame (Passepartout Effect) - Thinner and more subtle
        ctx.fillStyle = '#111';
        const framePadding = width * 0.005;
        ctx.fillRect(drawX - framePadding, drawY - framePadding, drawW + framePadding * 2, drawH + framePadding * 2);
        
        drawImageWithCrop(imgObj, drawX, drawY, drawW, drawH);
        
        // Reset shadow for further drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
 else if (layout === 'grid') {
      const margin = width * 0.06;
      const gap = width * 0.04;
      const cols = 2;
      const rows = 2;
      const cellW = (width - margin * 2 - gap) / cols;
      const cellH = (height - margin * 2 - gap) / rows;

      loadedImages.forEach((imgObj, i) => {
        if (i >= 4) return;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cellW + gap);
        const y = margin + row * (cellH + gap);
        drawImageWithCrop(imgObj, x, y, cellW, cellH);
      });
    } else if (layout === 'spread') {
      if (loadedImages[0]) {
        drawImageWithCrop(loadedImages[0], 0, 0, width, height);
      }
    } else if (layout === 'panorama') {
      if (loadedImages[0]) {
        drawImageWithCrop(loadedImages[0], 0, 0, width, height, side);
      }
    } else if (layout === 'vgrid') {
      const margin = width * 0.05;
      const gap = width * 0.02;
      const cellW = width - margin * 2;
      const cellH = (height - margin * 2 - gap) / 2;

      loadedImages.forEach((imgObj, i) => {
        if (i >= 2) return;
        const y = margin + i * (cellH + gap);
        drawImageWithCrop(imgObj, margin, y, cellW, cellH);
      });
    }

    // If page has no photos assigned, render an exquisite luxury fine-art layout placeholder
    if (loadedImages.length === 0) {
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
      ctx.lineWidth = 3;
      ctx.strokeRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
      
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);

      // Gold graduation crest / monogram
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 30px serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOP LINE STUDIO', width / 2, height / 2 - 30);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '16px sans-serif';
      ctx.fillText('LÂMINA DISPONÍVEL', width / 2, height / 2 + 12);

      ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.font = 'italic 13px serif';
      ctx.fillText('Selecione fotos na galeria para personalizar esta lâmina', width / 2, height / 2 + 38);
    }

    applyEffect(ctx, width, height, pageEffect);
    
    const result = canvas.toDataURL('image/jpeg', 0.88);
    pageCacheRef.current[pageHash] = { url: result, hash: pageHash };
    return result;
  };

  const onCropSave = () => {
    if (croppingPhoto && completedCrop) {
      setPhotoCrops({
        ...photoCrops,
        [croppingPhoto.id]: { px: completedCrop }
      });
      setCroppingPhoto(null);
    }
  };

  const getPagePhotos = (pageIdx: number) => {
    let photoIdx = 0;
    for (let i = 0; i < pageIdx; i++) {
      const layout = pageLayouts[i];
      let ppp = 1;
      if (layout === 'grid') ppp = 4;
      if (layout === 'vgrid') ppp = 2;
      if (layout === 'panorama') {
        // Find if this is the second half of a panorama
        const isSecondHalf = i > 0 && pageLayouts[i-1] === 'panorama';
        if (isSecondHalf) {
          // If second half, we already consumed the photo in the first half logic in generateAllPages
          // but for getPagePhotos (used for UI previews), we need the index.
          // Actually, panorama logic is split.
          photoIdx += 0; 
        } else {
          photoIdx += 1;
        }
        // This is complex. Let's simplify: generateAllPages is the source of truth.
        // For UI, we'll just try to match.
      } else {
        photoIdx += ppp;
      }
    }
    const layout = pageLayouts[pageIdx];
    let ppp = 1;
    if (layout === 'grid') ppp = 4;
    if (layout === 'vgrid') ppp = 2;
    
    // For panorama, if it's the second page of a spread, we need the SAME photo as before
    if (layout === 'panorama' && pageIdx > 0 && pageLayouts[pageIdx-1] === 'panorama') {
      // Find the photo index shift
      let adjustedIdx = 0;
      for(let j=0; j<pageIdx; j++) {
        if (pageLayouts[j] === 'panorama') {
          if (j > 0 && pageLayouts[j-1] === 'panorama') continue;
          adjustedIdx += 1;
        } else {
          let pp = 1;
          if (pageLayouts[j] === 'grid') pp = 4;
          if (pageLayouts[j] === 'vgrid') pp = 2;
          adjustedIdx += pp;
        }
      }
      return activePhotos.slice(adjustedIdx - 1, adjustedIdx);
    }

    return activePhotos.slice(photoIdx, photoIdx + ppp);
  };

  const openCropModalForPagePhoto = (photo: Photo, layout: LayoutType) => {
    const { width, height } = getPageDimensions();
    let aspect = 1;
    
    // Create temporary image to get real aspect ratio if missing
    const img = new Image();
    img.src = photo.url;
    
    const getPhotoAspect = () => {
      if (photo.aspectRatio) return photo.aspectRatio;
      
      // Attempt to get from activePhotos if provided there
      const found = activePhotos.find(p => p.id === photo.id);
      if (found?.aspectRatio) return found.aspectRatio;

      if (img.width > 0) return img.width / img.height;
      // Fallback for demos or unloaded images
      if (photo.url.includes('seed')) return 800 / 1200;
      return 1;
    };

    const photoAspect = getPhotoAspect();

    // The aspect ratio MUST match how drawImageWithCrop will eventually render it
    if (layout === 'minimalist') {
      aspect = photoAspect;
    } else if (layout === 'grid') {
      const margin = width * 0.06;
      const gap = width * 0.04;
      const cellW = (width - margin * 2 - gap) / 2;
      const cellH = (height - margin * 2 - gap) / 2;
      aspect = cellW / cellH;
    } else if (layout === 'vgrid') {
      aspect = (width - width * 0.1) / ((height - height * 0.12) / 2);
    } else if (layout === 'spread') {
      aspect = width / height;
    } else if (layout === 'panorama') {
      aspect = (width * 2) / height;
    }
    
    // Calculate zoom level to FIT the whole photo in the crop area
    const zoomToFit = photoAspect > aspect ? aspect / photoAspect : photoAspect / aspect;
    
    setCroppingPhoto({ id: photo.id, url: photo.url, aspect, baseZoom: zoomToFit });
    
    setCrop({ x: 0, y: 0 }); 
    setZoom(zoomToFit); 
    setCompletedCrop(null);
  };

  const getPageDimensions = () => {
    let width = 1200;
    let height = 1200;
    if (albumSize === '20x30') { width = 800; height = 1200; }
    if (albumSize === '30x40') { width = 1200; height = 1600; }
    return { width, height };
  };

  const generateAllPages = async () => {
    setIsGenerating(true);
    try {
      const newPages: string[] = [];
      
      let photoIdx = 0;
      for (let i = 0; i < pageLayouts.length; i++) {
        const layout = pageLayouts[i];
        const pageEffect = pageEffects[i] || 'none';
        let photosPerPage = 1;
        
        if (layout === 'grid') photosPerPage = 4;
        if (layout === 'vgrid') photosPerPage = 2;
        
        if (layout === 'panorama') {
          const pagePhotos = photoIdx < activePhotos.length ? activePhotos.slice(photoIdx, photoIdx + 1) : [];

          // Generate left half
          const pageDataLeft = await drawPage(pagePhotos, 'panorama', pageEffect, 'left');
          newPages.push(pageDataLeft);

          // Check if next page is also panorama to avoid double consumption of layout slots
          if (i + 1 < pageLayouts.length) {
            const pageDataRight = await drawPage(pagePhotos, 'panorama', pageEffect, 'right');
            newPages.push(pageDataRight);
            i++; // Skip next layout
          }
          if (pagePhotos.length > 0) photoIdx += 1;
        } else {
          const pagePhotos = photoIdx < activePhotos.length ? activePhotos.slice(photoIdx, photoIdx + photosPerPage) : [];
          const pageData = await drawPage(pagePhotos, layout, pageEffect);
          newPages.push(pageData);
          if (pagePhotos.length > 0) photoIdx += pagePhotos.length;
        }
      }

      setPages(newPages);
    } catch (e) {
      console.error("Layout generation error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-black overflow-hidden">
      {/* Crop Modal */}
      <AnimatePresence>
        {croppingPhoto && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-[95vw] h-[90vh] rounded-[40px] overflow-hidden flex flex-col lg:flex-row border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              {/* Photo Area */}
              <div className="flex-1 relative bg-black flex flex-col mb-[env(safe-area-inset-bottom)]">
                <div className="absolute top-8 left-8 z-20 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <CropIcon size={22} className="text-brand-gold" />
                      Visualização do Álbum
                    </h3>
                  </div>
                </div>

                <div className="flex-1 relative">
                  <Cropper
                    image={croppingPhoto.url}
                    crop={crop}
                    zoom={zoom}
                    aspect={croppingPhoto.aspect}
                    onCropChange={setCrop}
                    onCropComplete={(_, px) => setCompletedCrop(px)}
                    onZoomChange={setZoom}
                    showGrid={true}
                    restrictPosition={false}
                    minZoom={croppingPhoto.baseZoom}
                    maxZoom={croppingPhoto.baseZoom * 5}
                    classes={{
                      containerClassName: "rounded-lg",
                      cropAreaClassName: "border-2 border-brand-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.95)]",
                      mediaClassName: "max-w-none"
                    }}
                  />
                </div>
              </div>

              {/* Controls Sidebar */}
              <div className="w-full lg:w-96 p-8 lg:p-12 bg-zinc-900 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h4 className="text-xs uppercase tracking-[0.3em] font-bold text-gray-500">Ajustes</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Refine o enquadramento final</p>
                  </div>
                  <button 
                    onClick={() => setCroppingPhoto(null)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-12">
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Nível de Zoom</span>
                        <p className="text-[9px] text-gray-500 italic">Arraste para aproximar a foto</p>
                      </div>
                      <span className="text-xl font-mono text-brand-gold">{Math.round((zoom / (croppingPhoto?.baseZoom || 1)) * 100)}%</span>
                    </div>
                    <div className="relative group">
                      <input
                        type="range"
                        value={zoom}
                        min={croppingPhoto.baseZoom}
                        max={croppingPhoto.baseZoom * 5}
                        step={croppingPhoto.baseZoom / 100}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-brand-gold hover:accent-white transition-all overflow-hidden"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                      <span>100% (Cheio)</span>
                      <span>300%</span>
                      <span>500% (Máx)</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <h5 className="text-[9px] uppercase tracking-widest font-bold text-brand-gold flex items-center gap-2">
                      <Sparkles size={14} /> Dicas do Especialista
                    </h5>
                    <ul className="space-y-3">
                      {[
                        'Mantenha as feições centralizadas na grade.',
                        'Evite cortar mãos ou partes vitais do corpo.',
                        'O zoom ajuda a remover distrações do fundo.'
                      ].map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-[10px] text-gray-400 leading-relaxed">
                          <span className="text-brand-gold font-bold">{idx + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto flex flex-col gap-4">
                  <button 
                    onClick={onCropSave}
                    className="w-full py-5 rounded-2xl bg-brand-gold text-black font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <Check size={18} />
                    Confirmar Enquadramento
                  </button>
                  <button 
                    onClick={() => setCroppingPhoto(null)}
                    className="w-full py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors border border-white/10 hover:border-white/20"
                  >
                    Descartar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 bg-zinc-900 border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 relative z-10 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold"
          >
            <ChevronLeft size={14} /> Voltar
          </button>
          
          <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest border ${
            userTier === 'ALBUM' 
              ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
              : userTier === 'LINK'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400'
          }`}>
            {userTier === 'ALBUM' ? 'Studio' : userTier === 'LINK' ? 'Link Studio' : 'Modo Demonstração'}
          </div>
        </div>

        {userTier !== 'ALBUM' && (
          <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl">
            <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles size={12} /> {userTier === 'PROSPECT' ? 'Modo de Demonstração' : 'Prévia Premium'}
            </p>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              {userTier === 'PROSPECT' 
                ? 'Estamos usando fotos de exemplo para você conhecer a qualidade. Adquira o Link Studio para usar suas próprias fotos!'
                : 'Você está visualizando suas fotos no modelo físico. Adquira o Studio para finalizar e receber seu álbum em casa.'}
            </p>
          </div>
        )}

        <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl">
          <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Settings2 size={14} /> 1. Escolha seu Produto
          </p>
          <div className="flex gap-2">
            {[
              { id: 'LINK', label: 'Noir Link', icon: Sparkles },
              { id: 'FULL', label: 'Álbum + Link', icon: Box }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPurchaseType(item.id as 'LINK' | 'FULL')}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  purchaseType === item.id 
                    ? 'bg-brand-gold border-brand-gold text-black' 
                    : 'bg-black/40 border-white/10 text-gray-400 hover:border-brand-gold/50'
                }`}
              >
                <item.icon size={16} />
                <span className="text-[8px] uppercase font-bold tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[7px] text-gray-500 mt-2 uppercase tracking-tight text-center leading-tight">
            {purchaseType === 'LINK' 
              ? 'Interatividade e realidade aumentada digital.'
              : 'O luxo do físico unido à tecnologia do digital.'}
          </p>
        </div>

        <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <Sparkles size={14} /> Status da Diagramação
            </h3>
            {getPhotosTotalCapacity() < activePhotos.length && (
              <span className="flex h-2 w-2 rounded-full bg-brand-gold animate-ping" />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
              <span className="text-gray-400">Fotos Enquadradas</span>
              <span className={getPhotosTotalCapacity() >= activePhotos.length ? 'text-green-500' : 'text-brand-gold'}>
                {Math.min(activePhotos.length, getPhotosTotalCapacity())} / {activePhotos.length}
              </span>
            </div>
            
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getPhotosTotalCapacity() >= activePhotos.length ? 'bg-green-500' : 'bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`}
                style={{ width: `${Math.min(100, (getPhotosTotalCapacity() / activePhotos.length) * 100)}%` }}
              />
            </div>

            {getPhotosTotalCapacity() < activePhotos.length ? (
              <div className="space-y-3">
                <p className="text-[8px] text-brand-gold uppercase tracking-widest leading-relaxed">
                  Faltam <strong className="text-white">{activePhotos.length - getPhotosTotalCapacity()} fotos</strong> para diagramar.
                </p>
                <button 
                  onClick={optimizeLayouts}
                  className="w-full py-2 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[8px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-brand-gold hover:text-black transition-all"
                >
                  Otimizar Lâminas Automaticamente
                </button>
              </div>
            ) : (
              <p className="text-[8px] text-green-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Check size={10} /> Todas as fotos estão no álbum
              </p>
            )}
            <p className="text-[8px] text-gray-400 uppercase tracking-widest leading-relaxed italic border-t border-white/5 pt-2">
              Dica: Mude o layout de cada página em "VER DIAGRAMAÇÃO".
            </p>
          </div>
        </div>

        <div className={purchaseType === 'LINK' ? 'opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all' : ''}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <Layers size={14} /> 2. Pacote de Páginas
            </h3>
            {purchaseType === 'LINK' && (
              <span className="text-[6px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Preview</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[20, 40, 60, 80].map((count) => {
              const photosNeeded = activePhotos.length / 1.5;
              const isRecommended = [20, 40, 60, 80].reduce((prev, curr) => 
                Math.abs(curr - photosNeeded) < Math.abs(prev - photosNeeded) ? curr : prev
              ) === count;
              
              // Defining explicit limits for guidance
              const maxPhotos = count === 20 ? 30 : count === 40 ? 60 : count === 60 ? 90 : 120;
              
              return (
                <button
                  key={count}
                  onClick={() => handlePageCountChange(count)}
                  className={`relative py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    requestedPageCount === count 
                      ? 'bg-brand-gold border-brand-gold text-black' 
                      : 'bg-black/40 border-white/10 text-gray-400 hover:border-brand-gold/50'
                  }`}
                >
                  <span className="text-[12px] font-bold">{count}</span>
                  <span className="text-[6px] uppercase tracking-tighter opacity-70">Lâminas</span>
                  {isRecommended && (
                    <div className="absolute -top-1.5 -right-1 bg-white text-black text-[5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight shadow-md border border-brand-gold/50 z-10">
                      Ideal
                    </div>
                  )}
                  {getPhotosTotalCapacity() < activePhotos.length && count === requestedPageCount && (
                    <div className="absolute -bottom-1 -right-1 bg-brand-gold text-black text-[5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight shadow-md z-10 animate-bounce">
                      Cheio
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[7px] text-gray-400 leading-relaxed uppercase tracking-widest flex items-start gap-2">
              <Sparkles size={10} className="text-brand-gold flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-brand-gold">Dica Noir:</strong> Para {requestedPageCount} páginas, recomendamos até <strong className="text-white">{requestedPageCount === 20 ? 30 : requestedPageCount === 40 ? 60 : requestedPageCount === 60 ? 90 : 120} fotos</strong> para uma diagramação limpa.
              </span>
            </p>
          </div>
        </div>

        <div className={purchaseType === 'LINK' ? 'opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all' : ''}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <Box size={14} /> 3. Personalização
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-2">Tamanho do Álbum</p>
              <div className="grid grid-cols-3 gap-2">
                {(['20x30', '30x30', '30x40'] as AlbumSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setAlbumSize(size)}
                    className={`py-2 rounded-lg border text-[9px] font-bold tracking-widest transition-all ${
                      albumSize === size 
                        ? 'bg-brand-gold border-brand-gold text-black' 
                        : 'bg-black/40 border-white/10 text-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-2">Acabamento da Capa</p>
              <div className="grid grid-cols-2 gap-2">
                {(['standard', 'premium', 'leather', 'acrylic', 'velvet', 'photo'] as MaterialType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMaterialType(type)}
                    className={`py-2 rounded-lg text-[8px] font-bold uppercase border transition-all ${
                      materialType === type ? 'bg-brand-gold border-brand-gold text-black' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {type === 'standard' ? 'Padrão' : 
                     type === 'premium' ? 'Premium' : 
                     type === 'leather' ? 'Couro' : 
                     type === 'acrylic' ? 'Acrílico' : 
                     type === 'velvet' ? 'Veludo' : 'Fotográfica'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!hasPurchasedAlbum && (
          <div>
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
              <Sparkles size={14} /> Vídeo de Capa (Opcional)
            </h3>
            <input 
              type="text" 
              placeholder="URL do vídeo (MP4)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-brand-gold transition-all"
            />
            <p className="text-[8px] text-gray-500 mt-2 uppercase tracking-widest">Adicione um vídeo para a primeira página do seu álbum premium.</p>
          </div>
        )}


        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
            <Palette size={14} /> Resumo de Investimento
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-400 font-bold border-b border-white/5 pb-2 mb-2">
              <span className="text-white uppercase tracking-widest flex items-center gap-1">
                {purchaseType === 'LINK' ? 'Top Line Link Studio (Digital)' : 'Álbum Físico Studio + Link'}
              </span>
              <span className="text-brand-gold">R$ {PRICES.edition[purchaseType === 'LINK' ? 'link' : 'album'].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-[10px] text-gray-400 leading-relaxed">
              <span>{activePhotos.length} Fotos sob Curadoria</span>
              <span>R$ {(activePhotos.length * PRICES.photo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            {purchaseType === 'FULL' && (
              <div className="space-y-1.5 py-2 border-t border-white/5 mt-2">
                <p className="text-[8px] text-brand-gold uppercase tracking-[0.2em] font-bold mb-1">Personalização do Álbum</p>
                
                {PRICES.size[albumSize] > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Upgrade Tamanho {albumSize}</span>
                    <span>+ R$ {PRICES.size[albumSize].toFixed(2)}</span>
                  </div>
                )}
                {PRICES.material[materialType] > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Capa {materialType.charAt(0).toUpperCase() + materialType.slice(1)}</span>
                    <span>+ R$ {PRICES.material[materialType].toFixed(2)}</span>
                  </div>
                )}
                {PRICES.pagePackage[requestedPageCount as keyof typeof PRICES.pagePackage] > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Pacote {requestedPageCount} Lâminas</span>
                    <span>+ R$ {PRICES.pagePackage[requestedPageCount as keyof typeof PRICES.pagePackage].toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {purchaseType === 'LINK' && (
              <div className="mt-2 p-3 bg-brand-gold/10 border border-brand-gold/30 rounded-xl space-y-2">
                <p className="text-[8px] text-gray-300 leading-relaxed">
                  ✨ <strong>Apenas Link Studio:</strong> Nossa equipe incluirá todas as suas fotos em alta resolução no seu login para download. Você pode montar o álbum à vontade para experimentar!
                </p>
                <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-bold text-brand-gold/80 pt-1 border-t border-brand-gold/20">
                  <span>Adicionar Álbum Físico</span>
                  <span>+ R$ {(totalPriceFull - totalPrice).toFixed(2)}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setPurchaseType('FULL')}
                  className="w-full py-2 bg-brand-gold text-black text-[8px] font-bold uppercase tracking-widest rounded-lg hover:bg-white transition-all shadow-md"
                >
                  + Incluir Álbum Físico de Luxo
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold text-white">
              <span className="uppercase tracking-widest">{purchaseType === 'LINK' ? 'Total Link Studio' : 'Total Álbum + Link'}</span>
              <span className="text-brand-gold">
                R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {purchaseType === 'FULL' && !hasPurchasedAlbum && (
              <div className="mt-2 p-3 bg-brand-gold/5 border border-brand-gold/20 rounded-xl">
                <p className="text-[8px] text-gray-400 leading-relaxed">
                  👑 O álbum físico inclui encadernação artesanal, lâminas panorâmicas de abertura 180° e o Link Studio vitalício integrado.
                </p>
              </div>
            )}
          </div>
        </div>

        {materialType === 'photo' && (
          <div>
            <h3 className="text-brand-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Foto da Capa
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {activePhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCoverPhotoId(photo.id)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden transition-all ${
                    coverPhotoId === photo.id ? 'border-brand-gold scale-110' : 'border-white/10 opacity-50'
                  }`}
                >
                  <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md rounded px-1.5 py-0.5 border border-white/10 z-10">
                    <span className="text-[7px] font-bold text-white uppercase tracking-tighter">#{index + 1}</span>
                  </div>
                  <img src={photo.url} alt="Cover option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
          {/* Auto-Save & Versions Status Pill */}
          <div className="px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                  Salvo Automaticamente
                </span>
                <span className="text-[7px] text-gray-400 font-mono">
                  {lastSavedTime ? `Última sincronização às ${lastSavedTime}` : 'Sincronizado na nuvem'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVersionsModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-brand-gold/20 text-brand-gold text-[8px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors border border-brand-gold/30"
              title="Ver e restaurar versões salvas"
            >
              <History size={11} />
              <span>Versões ({savedVersions.length})</span>
            </button>
          </div>

          <div className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-widest font-bold text-gray-500">Simetria Auto</span>
              <button 
                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                className={`w-8 h-4 rounded-full relative transition-all ${isAutoSyncEnabled ? 'bg-brand-gold' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isAutoSyncEnabled ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[7px] text-gray-600 uppercase tracking-tighter leading-tight italic">Remove páginas vazias automaticamente quando os layouts mudam.</p>
          </div>

          <button
            onClick={clearDraft}
            className="w-full bg-white/5 text-red-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all border border-white/5"
          >
            <RotateCcw size={14} />
            Limpar e Recomeçar
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full bg-white/5 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10"
          >
            {showPreview ? <ImageIcon size={16} /> : <Layers size={16} />}
            {showPreview ? 'Diagramação Detalhada' : 'Visualizar em 3D'}
          </button>
          
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={isGenerating}
            className="w-full bg-brand-gold text-black py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(212,175,55,0.4)]"
          >
            <MessageCircle size={16} />
            {purchaseType === 'LINK'
              ? 'Finalizar Pedido do Link Studio'
              : hasPurchasedAlbum
                ? 'Atualizar Diagramação'
                : 'Finalizar Pedido do Álbum + Link'}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative bg-[#030303] overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-h-0 relative"
            >
              <div className="absolute inset-0">
                <Album3D 
                  pages={pages} 
                  currentPage={currentPage} 
                  isOpen={true} 
                  zoom={1} 
                  videoUrl={videoUrl || undefined}
                  materialType={materialType}
                  albumSize={albumSize}
                  coverTextureUrl={activePhotos.find(p => p.id === coverPhotoId)?.url || activePhotos[0]?.url}
                  purchaseType={purchaseType}
                  onPageChange={(p) => setCurrentPage(p)}
                  onCheckout={() => setIsCheckoutOpen(true)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="2d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full p-8 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <Sparkles className="text-brand-gold" />
                    Diagramação Sugerida
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                    <Clock size={12} />
                    Gerado automaticamente
                  </div>
                </div>

                {/* Photo Order Curation Section */}
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[40px] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <ListOrdered className="text-brand-gold" size={18} />
                        Curadoria de Ordem ({activePhotos.length} fotos)
                      </h3>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                        Arraste ou use as setas para organizar a sequência narrativa do seu álbum.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-brand-gold/20 scrollbar-track-transparent">
                    {activePhotos.map((photo, index) => (
                      <div key={photo.id} className="group">
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-brand-gold/50 transition-all shadow-xl bg-black">
                          <img src={photo.thumbnail || photo.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-1.5 left-1.5 bg-brand-gold text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg z-10">
                            #{index + 1}
                          </div>
                          
                          {/* Reorder Controls Overlay */}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => movePhotoInOrder(index, 'up')}
                              disabled={index === 0}
                              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-brand-gold hover:text-black rounded-lg transition-all disabled:opacity-30"
                              title="Mover para trás"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <button 
                              onClick={() => movePhotoInOrder(index, 'down')}
                              disabled={index === activePhotos.length - 1}
                              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-brand-gold hover:text-black rounded-lg transition-all disabled:opacity-30"
                              title="Mover para frente"
                            >
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {activePhotos.length > getPhotosTotalCapacity() && (
                  <div className="bg-brand-gold/10 border border-brand-gold/30 p-6 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-black">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gold uppercase tracking-widest">Fotos fora do Álbum</p>
                        <p className="text-[10px] text-gray-400">Você tem {activePhotos.length - getPhotosTotalCapacity()} fotos que ainda não aparecem nas páginas.</p>
                      </div>
                    </div>
                    <button 
                      onClick={optimizeLayouts}
                      className="px-6 py-2 bg-brand-gold text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Otimizar Lâminas
                    </button>
                  </div>
                )}

                {isGenerating ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full"
                    />
                    <p className="text-xs uppercase tracking-widest text-gray-500">Otimizando diagramação...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-12">
                    {pages.map((page, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative"
                      >
                        <div className="flex flex-col lg:flex-row gap-12 bg-zinc-900/20 border border-white/5 p-12 rounded-[60px] hover:border-brand-gold/20 transition-all">
                          <button 
                            onClick={() => removePage(i)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20"
                            title="Remover Página"
                          >
                            <X size={20} />
                          </button>
                          <div className={`flex-1 studio-bg rounded-3xl overflow-hidden flex items-center justify-center p-8 lg:p-12 relative`}>
                            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
                            
                            <div 
                              className="relative album-page-depth bg-black rounded-lg overflow-hidden transition-all duration-500 group-hover:scale-[1.01] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]"
                              style={{ 
                                width: '100%',
                                maxWidth: albumSize === '30x30' ? '500px' : albumSize === '20x30' ? '333px' : '500px',
                                aspectRatio: albumSize === '30x30' ? '1/1' : albumSize === '20x30' ? '2/3' : '3/4'
                              }}
                            >
                              <img src={page} alt={`Página ${i+1}`} className="w-full h-full object-contain" />
                              {getPagePhotos(i).length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-6 text-center">
                                  <AlertTriangle size={32} className="text-zinc-700 mb-2" />
                                  <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">Página Excedente</span>
                                  <p className="text-[8px] text-zinc-600 mt-1 max-w-[150px]">Nenhuma foto restante para esta página. Remova ou mude layouts anteriores.</p>
                                  <button 
                                    onClick={() => removePage(i)}
                                    className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-colors"
                                  >
                                    Excluir Página
                                  </button>
                                </div>
                              )}
                              <div className="absolute inset-y-0 right-0 w-[4px] bg-gradient-to-l from-white/5 to-transparent border-r border-white/20" />
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                            </div>

                            {/* Lighting and Reflection on 'Floor' */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-[1px] bg-white/20 blur-[1px]" />
                            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[110%] h-40 bg-gradient-to-b from-white/5 to-transparent blur-3xl opacity-50 -z-10" />

                            <div className="absolute top-4 left-4 bg-brand-gold/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border border-brand-gold/20 text-brand-gold z-10">
                              Lâmina {Math.floor(i / 2) + 1} - Página {i + 1}
                            </div>
                          </div>
                          
                          <div className="w-full lg:w-64 space-y-8">
                            {pageLayouts[i] === 'panorama' && i % 2 !== 0 ? (
                              <div className="bg-brand-gold/5 border border-brand-gold/20 p-6 rounded-3xl space-y-4">
                                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold flex items-center gap-2">
                                  <Sparkles size={14} /> Lâmina Panorâmica
                                </h4>
                                <p className="text-[9px] text-gray-400 leading-relaxed italic">
                                  Esta página está integrada ao spread panorâmico anterior.
                                </p>
                                <div className="pt-4 border-t border-white/5">
                                  <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">Status: INTEGRADO</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                    <Layout size={14} className="text-brand-gold" /> Layout da Página
                                  </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'minimalist', label: 'Minimal' },
                                  { id: 'grid', label: 'Grade' },
                                  { id: 'vgrid', label: 'Vertical' },
                                  { id: 'panorama', label: 'Panorâmico' },
                                  { id: 'spread', label: 'Sangrado' }
                                ].map(l => (
                                  <button
                                    key={l.id}
                                    onClick={() => handlePageLayoutChange(i, l.id as LayoutType)}
                                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                                      pageLayouts[i] === l.id 
                                        ? 'bg-brand-gold border-brand-gold text-black' 
                                        : 'bg-black/40 border-white/10 text-white hover:border-brand-gold/50'
                                    }`}
                                  >
                                    {l.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Palette size={14} className="text-brand-gold" /> Efeito da Página
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'none', label: 'Original' },
                                  { id: 'bw', label: 'P&B' },
                                  { id: 'sepia', label: 'Sépia' },
                                  { id: 'vintage', label: 'Vintage' },
                                  { id: 'vibrant', label: 'Vibrante' }
                                ].map(e => (
                                  <button
                                    key={e.id}
                                    onClick={() => handlePageEffectChange(i, e.id as EffectType)}
                                    className={`py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                                      pageEffects[i] === e.id 
                                        ? 'bg-brand-gold border-brand-gold text-black' 
                                        : 'bg-black/40 border-white/10 text-white hover:border-brand-gold/50'
                                    }`}
                                  >
                                    {e.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <CropIcon size={14} className="text-brand-gold" /> Ajustar Enquadramento
                              </h4>
                              <div className="space-y-2">
                                    {getPagePhotos(i).map((photo, pIdx) => {
                                      const globalIndex = activePhotos.findIndex(p => p.id === photo.id);
                                      return (
                                        <button 
                                          key={photo.id}
                                          onClick={() => openCropModalForPagePhoto(photo, pageLayouts[i])}
                                          className="w-full flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 hover:border-brand-gold/50 transition-all group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black">
                                              <img src={photo.thumbnail || photo.url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                              <div className="absolute top-0 right-0 bg-brand-gold text-black text-[6px] font-bold px-1 rounded-bl">
                                                #{globalIndex + 1}
                                              </div>
                                            </div>
                                            <div className="flex flex-col items-start">
                                              <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 group-hover:text-white">Posição {pIdx + 1}</span>
                                              <span className="text-[7px] text-brand-gold/60 uppercase tracking-tighter">Na ordem global: #{globalIndex + 1}</span>
                                            </div>
                                          </div>
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-brand-gold/10 transition-colors">
                                            <CropIcon size={14} className="text-brand-gold" />
                                          </div>
                                        </button>
                                      );
                                    })}
                              </div>
                            </div>
                          </>
                        )}

                          <div className="pt-6 border-t border-white/5">
                              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <Palette size={14} className="text-brand-gold" /> Estilo Sugerido
                              </h4>
                              <p className="text-[9px] text-gray-400 leading-relaxed italic">
                                "Este layout foi otimizado para destacar a composição desta página específica."
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="pt-8 flex justify-center">
                      <button 
                        onClick={addPage}
                        className="px-12 py-6 rounded-[30px] bg-white/5 border border-white/10 text-brand-gold font-bold uppercase tracking-[0.3em] text-[11px] hover:bg-brand-gold hover:text-black transition-all flex items-center gap-4 group"
                      >
                        <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center group-hover:bg-black/10">
                          <Sparkles size={16} />
                        </div>
                        Adicionar Nova Página
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auto-Save Restored Toast */}
      <AnimatePresence>
        {draftRestoredToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[220] bg-zinc-900 border border-brand-gold/40 shadow-[0_0_30px_rgba(212,175,55,0.25)] rounded-2xl p-4 flex items-center gap-3 text-white max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
              <BookmarkCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Projeto Restaurado</p>
              <p className="text-[10px] text-gray-400">Você continuou exatamente de onde parou. Nenhuma alteração foi perdida.</p>
            </div>
            <button 
              onClick={() => setDraftRestoredToast(false)}
              className="text-gray-500 hover:text-white p-1 ml-auto"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Versions History Modal */}
      <AnimatePresence>
        {showVersionsModal && (
          <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-zinc-950 border border-brand-gold/30 rounded-3xl p-6 md:p-8 shadow-[0_0_80px_rgba(212,175,55,0.15)] space-y-6 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-white">Histórico de Versões</h3>
                    <p className="text-[10px] text-gray-400">Salve marcos do seu projeto e restaure quando quiser.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVersionsModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Create new version snapshot */}
              <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-gold block">
                  Criar Nova Versão deste Momento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVersionLabel}
                    onChange={(e) => setNewVersionLabel(e.target.value)}
                    placeholder="Ex: Diagramação com foco nos amigos, 40 fotos..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNewVersion();
                    }}
                  />
                  <button
                    onClick={() => handleSaveNewVersion()}
                    className="px-4 py-2 bg-brand-gold hover:bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    Salvar
                  </button>
                </div>
              </div>

              {/* Versions List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {savedVersions.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <History size={28} className="mx-auto text-gray-600" />
                    <p className="text-xs text-gray-400 font-medium">Nenhuma versão manual criada ainda.</p>
                    <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                      Seu projeto atual já está sendo salvo continuamente de forma automática. Use o campo acima para criar marcos nomeados.
                    </p>
                  </div>
                ) : (
                  savedVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-4 bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 hover:border-brand-gold/30 rounded-2xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{ver.label}</span>
                          <span className="text-[8px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded uppercase font-mono">
                            {ver.purchaseType === 'LINK' ? 'Link Studio' : 'Álbum Físico'}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400">
                          {ver.date} às {ver.timestamp} • {ver.pageCount} páginas • {ver.photoCount} fotos
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRestoreVersion(ver)}
                          className="px-3 py-1.5 rounded-lg bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-black border border-brand-gold/30 text-[9px] font-bold uppercase tracking-widest transition-all"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(ver.id)}
                          className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="Excluir versão"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowVersionsModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        purchaseType={purchaseType}
        albumSize={albumSize}
        materialType={materialType}
        requestedPageCount={requestedPageCount}
        photoCount={activePhotos.length}
        totalPrice={totalPrice}
        photos={activePhotos}
        coverPhotoUrl={activePhotos.find(p => p.id === coverPhotoId)?.url || activePhotos[0]?.url}
        videoUrl={videoUrl}
        onSwitchToFullAlbum={() => setPurchaseType('FULL')}
      />
    </div>
  );
};

export default AlbumEditor;

