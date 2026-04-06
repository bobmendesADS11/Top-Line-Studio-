import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { LogOut, Book, Image as ImageIcon, Clock, User, GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import Gallery from './Gallery';
import Album3D from './Album3D';

const Student: React.FC = () => {
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const albumPages = [
    'https://picsum.photos/seed/grad1/800/1200',
    'https://picsum.photos/seed/grad2/800/1200',
    'https://picsum.photos/seed/grad3/800/1200',
    'https://picsum.photos/seed/grad4/800/1200',
    'https://picsum.photos/seed/grad5/800/1200',
    'https://picsum.photos/seed/grad6/800/1200',
  ];

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'), 
      where('studentUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const Dashboard = () => (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Welcome Section */}
      <section className="mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-brand-gold/20 rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Olá, {user?.displayName?.split(' ')[0] || 'Formando'}! 👋</h2>
            <p className="text-gray-400 text-base md:text-lg mb-8">
              Bem-vindo à sua jornada de memórias. Aqui você pode acompanhar seus pedidos, selecionar fotos e visualizar seu álbum 3D.
            </p>
            <Link to="galeria" className="inline-block bg-brand-gold text-black px-8 py-4 rounded-xl font-bold hover:bg-brand-gold/90 transition-all hover:scale-105">
              Começar Seleção de Fotos
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Orders Status */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-brand-gold" />
            Meus Pedidos
          </h3>
          
          {myOrders.length === 0 ? (
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">Você ainda não tem pedidos ativos.</p>
              <button className="mt-4 text-brand-gold hover:underline">Ver álbuns disponíveis</button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map(order => (
                <div key={order.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center">
                      <Book size={24} className="text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-bold">Álbum de Formatura</p>
                      <p className="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold uppercase">
                      {order.status}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-2">Atualizado em {order.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Acesso Rápido</h3>
          <div className="space-y-4">
            <Link to="galeria" className="w-full bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-left group">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="font-medium">Galeria de Fotos</p>
                <p className="text-xs text-gray-500">Ver fotos do evento</p>
              </div>
            </Link>
            
            <Link to="album" className="w-full bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-left group">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Book size={20} />
              </div>
              <div>
                <p className="font-medium">Meu Álbum 3D</p>
                <p className="text-xs text-gray-500">Visualizar prévia</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/area-do-aluno" className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-brand-gold w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-base md:text-lg text-white uppercase tracking-[0.1em] leading-none">Top Line</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[4px] md:text-[5px] uppercase tracking-[0.4em] font-light text-white/60">Formaturas</span>
                  <span className="text-[4px] md:text-[5px] uppercase tracking-[0.1em] font-bold text-brand-gold">Black</span>
                </div>
              </div>
            </Link>
            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
            <span className="text-xs md:text-sm text-gray-400 hidden sm:block">Área do Aluno</span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs md:text-sm font-medium">{user?.displayName || 'Aluno'}</p>
                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest">Formando 2026</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-brand-gold" />
                )}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <LogOut size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="galeria" element={
          <div className="relative">
            <button 
              onClick={() => navigate('/area-do-aluno')}
              className="fixed top-24 left-4 z-50 bg-brand-gold text-black p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <Gallery onSelect={(photos) => {
              setSelectedPhotos(photos);
              navigate('/area-do-aluno/album');
            }} />
          </div>
        } />
        <Route path="album" element={
          <div className="relative h-[calc(100vh-80px)]">
            <button 
              onClick={() => navigate('/area-do-aluno')}
              className="absolute top-4 left-4 z-50 bg-brand-gold text-black p-2 rounded-full shadow-xl hover:scale-110 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-full pt-12">
              <Album3D 
                pages={selectedPhotos.length > 0 ? selectedPhotos.map(p => p.url) : albumPages} 
                currentPage={0} 
                zoom={1} 
                isOpen={true} 
              />
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default Student;
