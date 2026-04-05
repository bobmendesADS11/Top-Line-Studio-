import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Users, 
  Book, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Search, 
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'albums' | 'students'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const albumsQuery = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
    const studentsQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAlbums = onSnapshot(albumsQuery, (snapshot) => {
      setAlbums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubAlbums();
      unsubStudents();
    };
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role: 'student' });
    } catch (error) {
      console.error("Error approving student:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-brand-gold w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm text-white uppercase tracking-[0.1em] leading-none">Top Line</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[4px] uppercase tracking-[0.4em] font-light text-white/60">Formaturas</span>
                <span className="text-[4px] uppercase tracking-[0.1em] font-bold text-brand-gold">Black</span>
              </div>
            </div>
          </div>
          <p className="text-[8px] text-gray-500 uppercase tracking-widest ml-11">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'orders', icon: ShoppingBag, label: 'Pedidos' },
            { id: 'albums', icon: Book, label: 'Álbuns' },
            { id: 'students', icon: Users, label: 'Alunos' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-gold text-black font-bold' 
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-500">Gerencie sua plataforma Top Line Black</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-brand-gold outline-none transition-all w-64"
              />
            </div>
            <button className="bg-brand-gold text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-gold/90 transition-all">
              <Plus size={20} />
              Novo Item
            </button>
          </div>
        </header>

        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Total de Pedidos', value: orders.length, icon: ShoppingBag, color: 'text-blue-500' },
              { label: 'Álbuns Ativos', value: albums.length, icon: Book, color: 'text-brand-gold' },
              { label: 'Alunos Cadastrados', value: students.length, icon: Users, color: 'text-green-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Este Mês</span>
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-4xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Data Tables */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Item</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Status / Info</th>
                {activeTab === 'students' && (
                  <>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Curso</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Semestre</th>
                  </>
                )}
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Data</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'orders' && orders.map(order => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <p className="font-bold">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{order.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-gray-400">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button 
                        onClick={() => handleDelete('orders', order.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'albums' && albums.map(album => (
                <tr key={album.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold">
                        <Book size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{album.title}</p>
                        <p className="text-xs text-gray-500">{album.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-medium">{album.photosCount || 0} Fotos</p>
                  </td>
                  <td className="p-6 text-sm text-gray-400">
                    {album.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ExternalLink size={18} /></button>
                      <button 
                        onClick={() => handleDelete('albums', album.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'students' && students.map(student => (
                <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                        {student.photoURL ? (
                          <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={20} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{student.displayName || 'Sem Nome'}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      student.role === 'admin' ? 'bg-brand-gold/10 text-brand-gold' : 
                      student.role === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {student.role}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-gray-400">
                    {student.course || '-'}
                  </td>
                  <td className="p-6 text-sm text-gray-400">
                    {student.semester || '-'}
                  </td>
                  <td className="p-6 text-sm text-gray-400">
                    {student.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {student.role === 'pending' && (
                        <button 
                          onClick={() => handleApprove(student.id)}
                          className="bg-brand-gold text-black px-3 py-1 rounded-lg text-[10px] font-bold uppercase hover:bg-brand-gold/90 transition-all"
                        >
                          Aprovar
                        </button>
                      )}
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Admin;
