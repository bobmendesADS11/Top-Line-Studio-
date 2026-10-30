import React, { Suspense, lazy } from 'react';
import type { Album3DProps } from './Album3D';

// O 3D (three.js) é a parte mais pesada do site: só é baixado quando o álbum aparece na tela.
const Album3D = lazy(() => import('./Album3D'));

const Placeholder = () => (
  <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center gap-3 rounded-3xl bg-[#0a0a0c] border border-white/5">
    <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    <span className="text-[10px] uppercase tracking-widest text-gray-400">Preparando o álbum 3D…</span>
  </div>
);

export default function LazyAlbum3D(props: Album3DProps) {
  return (
    <Suspense fallback={<Placeholder />}>
      <Album3D {...props} />
    </Suspense>
  );
}
