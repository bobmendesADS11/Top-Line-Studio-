import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { LogOut, Book, Image as ImageIcon, Clock, User, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Student: React.FC = () => {
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-brand-gold w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg text-white uppercase tracking-[0.1em] leading-none">Top Line</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[5px] uppercase tracking-[0.4em] font-light text-white/60">Formaturas</span>
                  <span className="text-[5px] uppercase tracking-[0.1em] font-bold text-brand-gold">Black</span>
                </div>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <span className="text-sm text-gray-400">Área do Aluno</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user?.displayName || 'Aluno'}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Formando 2026</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-brand-gold" />
                )}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

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
              <h2 className="text-4xl font-bold mb-4">Olá, {user?.displayName?.split(' ')[0] || 'Formando'}! 👋</h2>
              <p className="text-gray-400 text-lg mb-8">
                Bem-vindo à sua jornada de memórias. Aqui você pode acompanhar seus pedidos, selecionar fotos e visualizar seu álbum 3D.
              </p>
              <button className="bg-brand-gold text-black px-8 py-4 rounded-xl font-bold hover:bg-brand-gold/90 transition-all hover:scale-105">
                Começar Seleção de Fotos
              </button>
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
              <button className="w-full bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <p className="font-medium">Galeria de Fotos</p>
                  <p className="text-xs text-gray-500">Ver fotos do evento</p>
                </div>
              </button>
              
              <button className="w-full bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors text-left group">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Book size={20} />
                </div>
                <div>
                  <p className="font-medium">Meu Álbum 3D</p>
                  <p className="text-xs text-gray-500">Visualizar prévia</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Student;
