import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { fileToCompressedDataUrl } from '../lib/image';
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
  GraduationCap,
  MessageCircle,
  Menu,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setDoc, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'albums' | 'students'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentForPhotos, setSelectedStudentForPhotos] = useState<any>(null);
  const [selectedStudentForApproval, setSelectedStudentForApproval] = useState<any>(null);
  const [studentPhotos, setStudentPhotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [approvalTier, setApprovalTier] = useState('prospect');
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

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'orders') {
      return orders.filter(o => 
        o.id.toLowerCase().includes(term) || 
        o.studentEmail?.toLowerCase().includes(term) ||
        o.status?.toLowerCase().includes(term)
      );
    }
    if (activeTab === 'albums') {
      return albums.filter(a => 
        a.title?.toLowerCase().includes(term) || 
        a.category?.toLowerCase().includes(term)
      );
    }
    if (activeTab === 'students') {
      return students.filter(s => 
        s.displayName?.toLowerCase().includes(term) || 
        s.email?.toLowerCase().includes(term) ||
        s.course?.toLowerCase().includes(term) ||
        s.institution?.toLowerCase().includes(term)
      );
    }
    return [];
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const handleDelete = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedStudentForApproval) return;
    try {
      await updateDoc(doc(db, 'users', selectedStudentForApproval.id), { 
        role: 'student',
        package: approvalTier
      });
      
      // Optional: Send WhatsApp automatically after approval
      if (selectedStudentForApproval.phoneNumber) {
        sendWhatsApp(selectedStudentForApproval.phoneNumber, selectedStudentForApproval.displayName || 'Formando');
      }
      
      setSelectedStudentForApproval(null);
    } catch (error) {
      console.error("Error approving student:", error);
    }
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}! Seu acesso ao Top Line Studio foi aprovado. 🎓\n\nAgora você já pode acessar o site, conferir suas fotos e criar o seu álbum 3D exclusivo! ✨\n\nAcesse aqui: ${window.location.origin}/login`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleUpdatePackage = async (id: string, newPackage: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { package: newPackage });
    } catch (error) {
      console.error("Error updating package:", error);
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const sendOrderWhatsApp = (order: any) => {
    const phone = order.studentPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const name = order.studentName || 'Formando';
    const msg = encodeURIComponent(`Olá ${name}! Aqui é da equipe Top Line Studio. Estamos acompanhando seu pedido #${order.id.slice(0, 8).toUpperCase()} (${order.productName || 'Top Line Studio'}) e gostaríamos de confirmar os detalhes.`);
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    }
  };

  const handleAddStudentInfo = () => {
    // No-op or custom modal
  };

  const handleManagePhotos = async (student: any) => {
    setSelectedStudentForPhotos(student);
    const photosRef = collection(db, 'users', student.id, 'photos');
    const snapshot = await getDocs(photosRef);
    setStudentPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedStudentForPhotos) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      for (const file of files) {
        // Comprime/redimensiona para caber no Firestore (antes fotos grandes eram ignoradas)
        let dataUrl: string;
        try {
          dataUrl = await fileToCompressedDataUrl(file);
        } catch (err) {
          console.warn(err);
          continue;
        }

        await addDoc(collection(db, 'users', selectedStudentForPhotos.id, 'photos'), {
          url: dataUrl,
          name: file.name,
          source: 'admin',
          createdAt: serverTimestamp()
        });
      }
      // Refresh photos
      handleManagePhotos(selectedStudentForPhotos);
    } catch (error) {
      console.error("Error uploading photos:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedStudentForPhotos) return;
    try {
      await deleteDoc(doc(db, 'users', selectedStudentForPhotos.id, 'photos', photoId));
      setStudentPhotos(studentPhotos.filter(p => p.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-brand-gold w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 relative group">
            {/* Brand: TOP LINE STUDIO */}
            <div className="flex flex-col items-start leading-none">
              <div className="flex items-baseline gap-1.5">
                <div className="flex gap-1 font-serif text-xs text-white uppercase tracking-[0.2em]">
                  <span>Top</span>
                  <span>Line</span>
                </div>
                <span className="font-script text-base gold-gradient leading-none inline-block pr-1 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  Studio
                </span>
              </div>
              <span className="text-[8px] text-white/40 uppercase tracking-[0.4em] mt-1 pl-0.5">Formaturas</span>
            </div>

            {/* 20 Anos Badge */}
            <div className="flex flex-col items-center justify-center pl-2 border-l border-white/10 -mt-0.5">
              <GraduationCap className="text-brand-gold w-2.5 h-2.5 mb-[-2px] drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
              <span className="font-script text-sm gold-gradient leading-tight inline-block px-1 py-0.5">
                20
              </span>
              <span className="font-script text-[9px] gold-gradient -mt-1.5 inline-block px-0.5">
                anos
              </span>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest ml-11">Admin Panel</p>
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
            onClick={() => {
              setActiveTab(item.id as any);
              setIsSidebarOpen(false);
            }}
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
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-zinc-950 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 border border-brand-gold/30 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-brand-gold w-4 h-4" />
          </div>
          <span className="font-serif text-sm text-white uppercase tracking-[0.1em]">Top Line Admin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-white/5 bg-zinc-950 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}>
        <aside 
          className={`w-64 h-full bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <SidebarContent />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-500 text-sm">Gerencie sua plataforma Top Line Studio</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-brand-gold outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => activeTab === 'students' ? handleAddStudentInfo() : null}
              className="bg-brand-gold text-black px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-gold/90 transition-all"
            >
              <Plus size={20} />
              {activeTab === 'students' ? 'Info Cadastro' : 'Novo Item'}
            </button>
          </div>
        </header>

        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
              {[
                { label: 'Total de Pedidos', value: orders.length, icon: ShoppingBag, color: 'text-blue-500' },
                { label: 'Álbuns Ativos', value: albums.length, icon: Book, color: 'text-brand-gold' },
                { label: 'Alunos Ativos', value: students.filter(s => s.role === 'student').length, icon: Users, color: 'text-green-500' },
                { label: 'Pendentes', value: students.filter(s => s.role === 'pending').length, icon: AlertCircle, color: 'text-yellow-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 md:p-8 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Este Mês</span>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {[
                { label: 'Link Studio', count: students.filter(s => s.package === 'link').length, color: 'bg-blue-500', icon: ImageIcon },
                { label: 'Album Studio', count: students.filter(s => s.package === 'album').length, color: 'bg-brand-gold', icon: Check },
                { label: 'Demonstração', count: students.filter(s => s.package === 'prospect' || !s.package).length, color: 'bg-gray-500', icon: Search },
              ].map((pkg, i) => (
                <div key={i} className="bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl ${pkg.color} flex items-center justify-center text-black`}>
                    <pkg.icon size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{pkg.label}</p>
                    <p className="text-2xl font-bold">{pkg.count} Alunos</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Data Tables */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Item / Aluno</th>
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                  {activeTab === 'orders' && (
                    <>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Produto</th>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Valor</th>
                    </>
                  )}
                  {activeTab === 'students' && (
                    <>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Pacote</th>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Instituição</th>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Curso</th>
                      <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Semestre</th>
                    </>
                  )}
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Data</th>
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'orders' && filteredData().map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 md:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold shrink-0">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm md:text-base text-white">
                            {order.studentName || `Pedido #${order.id.slice(0, 8).toUpperCase()}`}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-400">
                            {order.studentEmail || order.studentPhone || `ID: ${order.id.slice(0, 8)}`}
                          </p>
                          {order.course && (
                            <span className="text-[9px] text-brand-gold/80 block mt-0.5">
                              {order.course}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <select
                        value={order.status || 'aguardando_contato'}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-black/60 border border-white/10 text-white rounded-lg px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider outline-none focus:border-brand-gold"
                      >
                        <option value="aguardando_contato">Aguardando Contato</option>
                        <option value="em_producao">Em Produção</option>
                        <option value="pago">Pago</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4 md:p-6">
                      <div>
                        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/20 inline-block">
                          {order.productName || (order.productType === 'link_studio' ? 'Link Studio' : 'Álbum Studio')}
                        </span>
                        {order.albumSpecs?.size && (
                          <p className="text-[9px] text-gray-500 mt-1">
                            {order.albumSpecs.size} cm • {order.albumSpecs.material}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-brand-gold">
                      R$ {(order.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        {order.studentPhone && (
                          <button
                            onClick={() => sendOrderWhatsApp(order)}
                            title="Conversar no WhatsApp com o aluno"
                            className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/30"
                          >
                            <MessageCircle size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete('orders', order.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          title="Excluir pedido"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'albums' && filteredData().map(album => (
                  <tr key={album.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 md:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-gold/10 rounded-lg flex items-center justify-center text-brand-gold">
                          <Book size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm md:text-base">{album.title}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">{album.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <p className="text-xs md:text-sm font-medium">{album.photosCount || 0} Fotos</p>
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {album.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ExternalLink size={16} /></button>
                        <button 
                          onClick={() => handleDelete('albums', album.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'students' && filteredData().map(student => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 md:p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={16} className="text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm md:text-base">{student.displayName || 'Sem Nome'}</p>
                          <p className="text-[10px] md:text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase ${
                        student.role === 'admin' ? 'bg-brand-gold/10 text-brand-gold' : 
                        student.role === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {student.role}
                      </span>
                    </td>
                    <td className="p-4 md:p-6">
                      <select 
                        value={student.package || 'prospect'} 
                        onChange={(e) => handleUpdatePackage(student.id, e.target.value)}
                        className={`bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase transition-all outline-none ${
                          student.package === 'album' ? 'text-brand-gold border-brand-gold/30' : 
                          student.package === 'link' ? 'text-blue-400 border-blue-400/30' :
                          'text-gray-400 border-white/10'
                        }`}
                      >
                        <option value="prospect">Demonstração</option>
                        <option value="link">Link Studio</option>
                        <option value="album">Album Studio</option>
                      </select>
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-brand-gold/90">
                      {student.institution || '-'}
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {student.course || '-'}
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {student.semester || '-'}
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {student.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button 
                          onClick={() => handleManagePhotos(student)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-gold"
                          title="Gerenciar Fotos"
                        >
                          <ImageIcon size={16} />
                        </button>
                        {student.role === 'pending' ? (
                          <button 
                            onClick={() => {
                              setSelectedStudentForApproval(student);
                              setApprovalTier(student.package || 'prospect');
                            }}
                            className="bg-brand-gold text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2"
                          >
                            <CheckCircle2 size={14} />
                            Aprovar Acesso
                          </button>
                        ) : (
                          student.role === 'student' && (
                            <button 
                              onClick={() => sendWhatsApp(student.phoneNumber || '', student.displayName || 'Formando')}
                              className="bg-green-500/10 text-green-500 p-2 rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase"
                              title="Enviar confirmação via WhatsApp"
                            >
                              <MessageCircle size={14} className="md:w-4 md:h-4" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>
                          )
                        )}
                        <button 
                          onClick={() => handleDelete('users', student.id)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          title="Excluir Aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Approve Student Modal */}
      {selectedStudentForApproval && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-brand-gold/30 rounded-[40px] p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.1)]"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Aprovar Cadastro</h3>
              <button onClick={() => setSelectedStudentForApproval(null)} className="p-2 hover:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="mb-8">
              <p className="text-gray-400 text-sm mb-2">Aluno:</p>
              <p className="text-white font-bold text-lg">{selectedStudentForApproval.displayName}</p>
              <p className="text-gray-500 text-xs">{selectedStudentForApproval.email}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 block">Selecione o Pacote de Acesso</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'prospect', label: 'Demonstração (Prospect)', desc: 'Acesso limitado para visualização' },
                    { id: 'link', label: 'Link Studio', desc: 'Acesso às fotos digitais' },
                    { id: 'album', label: 'Album Studio', desc: 'Acesso completo + Álbum Físico' }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setApprovalTier(tier.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        approvalTier === tier.id 
                          ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' 
                          : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <p className="font-bold text-sm">{tier.label}</p>
                      <p className="text-[10px] opacity-60">{tier.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setSelectedStudentForApproval(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleApprove}
                  className="flex-1 bg-brand-gold text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  Confirmar e Aprovar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Photos View */}
      {selectedStudentForPhotos && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-4xl w-full h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold">Fotos de {selectedStudentForPhotos.displayName}</h3>
                <p className="text-xs text-gray-500">{studentPhotos.length} fotos carregadas</p>
              </div>
              <div className="flex items-center gap-4">
                {auth.currentUser?.email?.toLowerCase() === 'gabrielmestrelli@gmail.com' && (
                  <button 
                    onClick={async () => {
                      setIsUploading(true);
                      try {
                        const demoPhotos = [
                          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800',
                          'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&q=80&w=800',
                          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
                          'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800',
                          'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800'
                        ];
                        for (const [index, url] of demoPhotos.entries()) {
                          await addDoc(collection(db, 'users', selectedStudentForPhotos.id, 'photos'), {
                            url,
                            name: `demo-photo-${index + 1}.jpg`,
                            createdAt: serverTimestamp()
                          });
                        }
                        handleManagePhotos(selectedStudentForPhotos);
                      } catch (error) {
                        console.error("Error loading demo photos:", error);
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={isUploading}
                    className="bg-white/5 text-white/60 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                  >
                    Demo Photos
                  </button>
                )}
                <label className="bg-brand-gold text-black px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all cursor-pointer flex items-center gap-2">
                  <Upload size={16} />
                  {isUploading ? 'Enviando...' : 'Subir Fotos'}
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleUploadPhoto}
                    disabled={isUploading}
                  />
                </label>
                <button onClick={() => setSelectedStudentForPhotos(null)} className="p-2 hover:bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
              {studentPhotos.map((photo) => (
                <div key={photo.id} className="aspect-[2/3] bg-black rounded-xl overflow-hidden relative group">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {studentPhotos.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                  <ImageIcon size={48} className="mb-4 opacity-20" />
                  <p>Nenhuma foto encontrada para este aluno.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
