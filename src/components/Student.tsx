import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { LogOut, Book, Image as ImageIcon, Clock, User, GraduationCap, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import Gallery from './Gallery';
import Album3D from './Album3D';
import AlbumEditor from './AlbumEditor';

const Student: React.FC = () => {
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
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

    // Fetch student data for package info
    const unsubStudent = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      const data = doc.data();
      setStudentData(data);
      
      // Show welcome message only once per session
      const hasSeenWelcome = sessionStorage.getItem(`welcome_${user.uid}`);
      if (!hasSeenWelcome && data?.role === 'student') {
        setShowWelcome(true);
        sessionStorage.setItem(`welcome_${user.uid}`, 'true');
      }
    });

    // Safety redirect for admins who end up here
    const isAdminEmail = user.email?.toLowerCase() === 'gabrielmestrelli@gmail.com' || 
                       user.email?.toLowerCase().endsWith('@admin.topline.com');
    const isAdminPhone = user.phoneNumber === '+5548991764001';
    
    if (isAdminEmail || isAdminPhone) {
      navigate('/admin');
      return;
    }

    const q = query(
      collection(db, 'orders'), 
      where('studentUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch student photos from sub-collection
    const photosRef = collection(db, 'users', user.uid, 'photos');
    const unsubPhotos = onSnapshot(photosRef, (snapshot) => {
      setSelectedPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubStudent();
      unsubPhotos();
    };
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const hasPurchasedAlbum = studentData?.package === 'black' || myOrders.some(order => 
    (order.type === 'album' || order.type === 'premium' || order.type === 'black_edition') && 
    (order.status === 'pago' || order.status === 'concluido')
  );

  const hasPurchasedLink = studentData?.package === 'link' || studentData?.package === 'black' || myOrders.some(order => 
    (order.type === 'link' || order.type === 'album') && 
    (order.status === 'pago' || order.status === 'concluido')
  );

  const userTier = hasPurchasedAlbum ? 'ALBUM' : (hasPurchasedLink ? 'LINK' : 'PROSPECT');

  const WelcomeOverlay = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-zinc-900/40 border border-brand-gold/30 rounded-[40px] p-10 text-center backdrop-blur-xl shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-gold/10 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-gold/10 blur-[80px] rounded-full" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-brand-gold/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-zinc-900 border border-brand-gold/30 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group">
                <GraduationCap className="text-brand-gold w-10 h-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
              </div>
            </div>
            
            <h1 className="font-serif text-3xl text-white uppercase tracking-[0.2em] mb-2">Top Line</h1>
            <div className="flex items-center gap-3">
              <span className="text-[8px] uppercase tracking-[0.6em] font-light text-white/60">Formaturas</span>
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-brand-gold">Edition</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
            {userTier === 'ALBUM' 
              ? 'Sua Jornada Premium Começa Agora' 
              : userTier === 'LINK'
                ? 'Suas Recordações em Alta Definição'
                : 'Bem-vindo à Experiência Top Line'}
          </h2>
          
          <p className="text-gray-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            {userTier === 'ALBUM'
              ? 'Prepare-se para eternizar seus melhores momentos. Explore seu álbum em 3D, personalize cada detalhe e receba uma obra de arte em sua casa.'
              : userTier === 'LINK'
                ? 'Acesse sua galeria exclusiva, baixe suas fotos e experimente como elas ficariam no nosso álbum físico de luxo.'
                : 'Conheça o futuro das recordações! Experimente nosso editor 3D, explore os materiais nobres e descubra o poder da Edition.'}
          </p>

          <button 
            onClick={() => setShowWelcome(false)}
            className="w-full bg-brand-gold text-black py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] group flex items-center justify-center gap-3"
          >
            Começar Experiência
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

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
              {userTier === 'ALBUM' 
                ? 'Suas fotos estão prontas! Agora é hora de criar seu álbum eterno e eternizar seus melhores momentos.'
                : userTier === 'LINK'
                  ? 'Suas fotos estão disponíveis! Explore nossas opções premium e veja como elas ficariam no seu álbum físico.'
                  : 'Sua formatura está sendo preparada com todo carinho. Enquanto as fotos não chegam, explore nossas opções premium e planeje seu álbum.'}
            </p>
            {userTier !== 'ALBUM' ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="galeria" className="inline-block bg-brand-gold text-black px-8 py-4 rounded-xl font-bold hover:bg-brand-gold/90 transition-all hover:scale-105">
                  {userTier === 'PROSPECT' ? 'Subir Minhas Fotos' : 'Ver Minhas Fotos no Álbum'}
                </Link>
                <button 
                  onClick={() => navigate('/area-do-aluno')} // In a real app, this would open a checkout
                  className="inline-block bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all"
                >
                  {userTier === 'PROSPECT' ? 'Adquirir Link Edition' : 'Upgrade para Album Edition'}
                </button>
              </div>
            ) : (
              <Link to="galeria" className="inline-block bg-brand-gold text-black px-8 py-4 rounded-xl font-bold hover:bg-brand-gold/90 transition-all hover:scale-105">
                Começar Seleção de Fotos
              </Link>
            )}
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

          {/* Premium Showcase Section */}
          {!hasPurchasedAlbum && (
            <div className="space-y-6 pt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="text-brand-gold" size={20} /> Modelos Premium Edition
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-brand-gold/20 p-6 rounded-[40px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-brand-gold text-black text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Mais Vendido</span>
                  </div>
                  <div className="w-full aspect-video bg-black rounded-2xl mb-4 overflow-hidden border border-white/5">
                    <img 
                      src="https://picsum.photos/seed/leather/800/450" 
                      alt="Leather Edition" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-brand-gold font-bold text-lg mb-2">Leather Edition</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Acabamento em couro legítimo com costura artesanal e gravação a laser. O clássico que nunca sai de moda.
                  </p>
                  <button 
                    onClick={() => navigate('editor')}
                    className="text-brand-gold text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Testar Modelo <ArrowRight size={14} />
                  </button>
                </div>

                <div className="bg-zinc-900/50 border border-brand-gold/20 p-6 rounded-[40px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-white/10 text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Exclusivo</span>
                  </div>
                  <div className="w-full aspect-video bg-black rounded-2xl mb-4 overflow-hidden border border-white/5">
                    <img 
                      src="https://picsum.photos/seed/acrylic/800/450" 
                      alt="Acrylic Edition" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="text-brand-gold font-bold text-lg mb-2">Acrylic & Video Edition</h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Capa em acrílico cristal de alta resistência com tela de vídeo integrada na primeira página. Tecnologia e luxo.
                  </p>
                  <button 
                    onClick={() => navigate('editor')}
                    className="text-brand-gold text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Testar Modelo <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Acesso Rápido</h3>
          <div className="space-y-4">
            <Link 
              to="galeria" 
              className="w-full bg-zinc-900/50 border border-brand-gold/20 p-6 rounded-3xl flex items-center gap-6 hover:bg-brand-gold/5 transition-all text-left group"
            >
              <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <ImageIcon size={28} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Escolher Minhas Fotos</p>
                <p className="text-xs text-gray-500">Acesse sua galeria e selecione suas favoritas</p>
              </div>
              <ArrowRight className="text-brand-gold group-hover:translate-x-2 transition-transform" />
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

            <Link to="editor" className="w-full bg-zinc-900/50 border border-brand-gold/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-brand-gold/5 transition-colors text-left group border-dashed">
              <div className="w-10 h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-black transition-colors">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-medium">Editor de Diagramação</p>
                <p className="text-xs text-gray-500">Criar layout automático</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence>
        {showWelcome && <WelcomeOverlay />}
      </AnimatePresence>
      
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
                  <span className="text-[4px] md:text-[5px] uppercase tracking-[0.1em] font-bold text-brand-gold">Edition</span>
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
              navigate('/area-do-aluno/editor');
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
        <Route path="editor" element={
          <div className="h-[calc(100vh-80px)]">
            <AlbumEditor 
              photos={selectedPhotos} 
              onBack={() => navigate('/area-do-aluno')}
              hasPurchasedAlbum={hasPurchasedAlbum}
              userTier={userTier}
              onSave={(finalPages) => {
                console.log('Saving album...', finalPages);
                navigate('/area-do-aluno/album');
              }}
            />
          </div>
        } />
      </Routes>
    </div>
  );
};

export default Student;
