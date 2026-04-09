import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { LogOut, Book, Image as ImageIcon, Clock, User, GraduationCap, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import Gallery from './Gallery';
import Album3D from './Album3D';
import AlbumEditor from './AlbumEditor';

const WelcomeOverlay: React.FC<{ userTier: string; studentData: any; user: any; setShowWelcome: (show: boolean) => void }> = ({ userTier, studentData, user, setShowWelcome }) => (
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
        <div className="flex items-center gap-6 mb-10">
          <div className="flex flex-col items-center leading-none">
            <div className="flex gap-2">
              <h1 className="font-serif text-4xl md:text-6xl text-white uppercase tracking-[0.2em] leading-none">Top</h1>
              <h1 className="font-serif text-4xl md:text-6xl text-white uppercase tracking-[0.2em] leading-none">Line</h1>
            </div>
            <span className="text-white/40 text-xs md:text-sm uppercase tracking-[0.8em] font-light mt-4">Formaturas</span>
          </div>

          <div className="flex flex-col items-center -mt-2">
            <GraduationCap className="text-brand-gold w-8 h-8 md:w-12 md:h-12 mb-[-10px] drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
            <span className="font-script text-6xl md:text-8xl gold-gradient leading-none">20</span>
            <span className="font-script text-xl md:text-2xl gold-gradient -mt-4">anos</span>
          </div>
          
          <span className="font-script text-6xl md:text-8xl gold-gradient leading-none pt-4">edition</span>
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

const Dashboard: React.FC<{ 
  userTier: string; 
  studentData: any; 
  user: any; 
  myOrders: any[]; 
  hasPurchasedAlbum: boolean;
  navigate: (path: string) => void;
}> = ({ userTier, studentData, user, myOrders, hasPurchasedAlbum, navigate }) => (
  <main className="max-w-7xl mx-auto px-6 py-12">
    {/* Welcome Section - Editorial Style */}
    <section className="mb-16">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group"
      >
        <div className="absolute -inset-4 bg-brand-gold/5 blur-[60px] rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 md:p-16 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.08),transparent_70%)]" />
          
          <div className="flex-1 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-12 bg-brand-gold/40" />
              <span className="text-brand-gold text-[10px] uppercase tracking-[0.4em] font-bold">Studio Edition • 2026</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-none tracking-tight">
              Olá, <span className="font-script gold-gradient">{studentData?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Formando'}</span>
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed font-light">
              {userTier === 'ALBUM' 
                ? 'Sua jornada de excelência continua. Suas fotos estão prontas para serem eternizadas em seu álbum exclusivo.'
                : userTier === 'LINK'
                  ? 'Explore o poder da Edition. Suas fotos digitais já estão disponíveis, mas a experiência física aguarda por você.'
                  : 'Sua formatura está sendo preparada com o requinte que você merece. Enquanto aguardamos os registros, planeje seu legado.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link to="galeria" className="gold-button px-10 py-5 text-sm">
                {userTier === 'PROSPECT' ? 'Subir Minhas Fotos' : 'Acessar Galeria Edition'}
              </Link>
              {userTier !== 'ALBUM' && (
                <button className="px-10 py-5 rounded-full border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
                  {userTier === 'PROSPECT' ? 'Adquirir Link Edition' : 'Upgrade para Álbum'}
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-72 aspect-[3/4] relative group/img">
            <div className="absolute inset-0 border border-brand-gold/20 rounded-3xl translate-x-4 translate-y-4 group-hover/img:translate-x-6 group-hover/img:translate-y-6 transition-transform duration-500" />
            <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10">
              <img 
                src="https://picsum.photos/seed/graduation_ceremony_luxury/600/800" 
                alt="Premium Experience" 
                className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-script text-2xl text-brand-gold">Sonhe, acredite, realize!</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>

    {/* Bento Grid Layout */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
      {/* Main Action: Gallery */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-8 bg-zinc-900/30 border border-white/5 rounded-[40px] p-8 relative overflow-hidden group cursor-pointer"
        onClick={() => navigate('galeria')}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
            <ImageIcon size={24} />
          </div>
          <ArrowRight className="text-white/20 group-hover:text-brand-gold group-hover:translate-x-2 transition-all" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Galeria de Fotos</h3>
        <p className="text-gray-500 text-sm max-w-md">Gerencie seus registros, selecione seus favoritos e prepare seu álbum com a curadoria Top Line.</p>
        
        <div className="mt-8 flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-32 rounded-xl overflow-hidden border border-white/5 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-700">
              <img src={`https://picsum.photos/seed/graduation_moment_${i}/200/300`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Studio Concierge */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-4 bg-brand-gold/5 border border-brand-gold/10 rounded-[40px] p-8 flex flex-col justify-between"
      >
        <div>
          <div className="w-12 h-12 bg-brand-gold/20 rounded-2xl flex items-center justify-center text-brand-gold mb-8">
            <Sparkles size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-brand-gold">Concierge Edition</h3>
          <p className="text-gray-400 text-sm">Suporte personalizado para a criação do seu legado. Fale com nossos especialistas em design de álbuns.</p>
        </div>
        <button className="w-full py-4 bg-brand-gold text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all mt-8">
          Falar com Especialista
        </button>
      </motion.div>

      {/* Order Tracking */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-4 bg-zinc-900/30 border border-white/5 rounded-[40px] p-8"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <Clock size={20} className="text-brand-gold" />
          Status de Produção
        </h3>
        
        {myOrders.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 text-sm italic">Nenhum álbum em produção no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.slice(0, 2).map(order => (
              <div key={order.id} className="relative pl-6 border-l border-brand-gold/30">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand-gold" />
                <p className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-1">{order.status}</p>
                <p className="text-sm font-medium text-white mb-1">Álbum de Formatura</p>
                <p className="text-[10px] text-gray-500">#{order.id.slice(0, 8)}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 3D Editor Preview */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="md:col-span-8 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] p-8 relative overflow-hidden group cursor-pointer"
        onClick={() => navigate('editor')}
      >
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-opacity">
          <img src="https://picsum.photos/seed/album_3d_render_preview/800/600" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-8">
            <Book size={24} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Editor 3D de Álbuns</h3>
          <p className="text-gray-500 text-sm max-w-xs">Visualize seu álbum em tempo real com nossa tecnologia de renderização 3D exclusiva.</p>
          <button className="mt-8 flex items-center gap-2 text-brand-gold font-bold text-xs uppercase tracking-widest">
            Abrir Estúdio Digital <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>

    {/* Luxury Catalog Section */}
    {!hasPurchasedAlbum && (
      <section className="pt-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-3xl font-serif mb-2">Catálogo <span className="italic gold-gradient">Edition</span></h3>
            <p className="text-gray-500 text-sm">Modelos exclusivos desenvolvidos para eternizar sua história.</p>
          </div>
          <div className="h-[1px] flex-1 bg-white/5 mx-12 hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Leather Edition',
              desc: 'Couro legítimo com costura artesanal e gravação a laser.',
              img: 'leather-bound-book',
              tag: 'Clássico'
            },
            {
              title: 'Acrylic Edition',
              desc: 'Capa em acrílico cristal de alta transparência e brilho.',
              img: 'glass-cube-art',
              tag: 'Moderno'
            },
            {
              title: 'Velvet Edition',
              desc: 'Toque aveludado com detalhes em hot-stamping dourado.',
              img: 'velvet-curtain-texture',
              tag: 'Sofisticado'
            },
            {
              title: 'Video Edition',
              desc: 'Tecnologia de ponta com tela de vídeo integrada na capa.',
              img: 'tablet-display-screen',
              tag: 'Tecnológico'
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
              onClick={() => navigate('editor')}
            >
              <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 border border-white/5">
                <img 
                  src={`https://picsum.photos/seed/${item.img}/800/1000`} 
                  alt={item.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-6 right-6">
                  <span className="bg-brand-gold text-black text-[8px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                    {item.tag}
                  </span>
                </div>
              </div>
              <h4 className="text-xl font-bold mb-2 group-hover:text-brand-gold transition-colors">{item.title}</h4>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{item.desc}</p>
              <div className="flex items-center gap-2 text-brand-gold text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Explorar Modelo <ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    )}
  </main>
);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay 
            userTier={userTier} 
            studentData={studentData} 
            user={user} 
            setShowWelcome={setShowWelcome} 
          />
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/area-do-aluno" className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-brand-gold w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="flex items-center gap-3 relative group">
                <div className="flex flex-col items-center leading-none">
                  <div className="flex gap-1">
                    <span className="font-serif text-xs md:text-sm text-white uppercase tracking-[0.2em]">Top</span>
                    <span className="font-serif text-xs md:text-sm text-white uppercase tracking-[0.2em]">Line</span>
                  </div>
                  <span className="text-[6px] md:text-[8px] text-white/40 uppercase tracking-[0.4em] mt-1.5">Formaturas</span>
                </div>

                {/* 20 Anos Badge - Vertical Stack */}
                <div className="flex flex-col items-center -mt-1">
                  <GraduationCap className="text-brand-gold w-3 h-3 mb-[-4px] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                  <span className="font-script text-2xl md:text-3xl gold-gradient leading-none">20</span>
                  <span className="font-script text-[10px] md:text-xs gold-gradient -mt-1.5">anos</span>
                </div>

                <span className="font-script text-3xl md:text-5xl gold-gradient leading-none pt-2 pb-1 ml-1">edition</span>
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
        <Route path="/" element={
          <Dashboard 
            userTier={userTier} 
            studentData={studentData} 
            user={user} 
            myOrders={myOrders} 
            hasPurchasedAlbum={hasPurchasedAlbum}
            navigate={navigate}
          />
        } />
        <Route path="galeria" element={
          <div className="relative">
            {/* Premium Back Button */}
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/area-do-aluno')}
              className="fixed top-28 left-6 z-50 group flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:border-brand-gold group-hover:text-brand-gold transition-all shadow-2xl">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 group-hover:text-brand-gold transition-colors hidden md:block">Voltar ao Estúdio</span>
            </motion.button>
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
