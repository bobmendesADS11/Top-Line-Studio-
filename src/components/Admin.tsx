import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { setAccessMode } from '../lib/accessMode';
import { fileToCompressedDataUrl } from '../lib/image';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Users, 
  Book, 
  ShoppingBag, 
  LogOut, 
  Search, 
  Trash2,
  LayoutDashboard,
  GraduationCap,
  MessageCircle,
  Menu,
  X,
  KeyRound,
  Upload,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setDoc, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

const TAB_TITLE: Record<string, string> = { dashboard: 'Painel', orders: 'Pedidos', albums: 'Álbuns', students: 'Alunos' };

// Status de pedido (os mesmos que o site e o assistente usam)
const ORDER_STATUS: { value: string; label: string }[] = [
  { value: 'aguardando_contato', label: 'Aguardando contato' },
  { value: 'pending', label: 'Recebido' },
  { value: 'em_producao', label: 'Em produção' },
  { value: 'pago', label: 'Pago' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];
const ROLE_LABEL: Record<string, string> = { admin: 'Admin', student: 'Aluno', pending: 'Aguardando' };

// Datas do Firestore podem vir como Timestamp, objeto {seconds}, texto ou vazias
const fmtDate = (v: any): string => {
  try {
    const d = v?.toDate ? v.toDate() : v?.seconds ? new Date(v.seconds * 1000) : v ? new Date(v) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '—';
  } catch {
    return '—';
  }
};
const fmtBRL = (n: any) => `R$ ${(Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const albumsQuery = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
    const studentsQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const onErr = (what: string) => (error: any) => {
      console.error(`Erro ao carregar ${what}:`, error);
      setLoadError(`Não foi possível carregar ${what}. Saia e entre de novo; se continuar, confira se esta conta é admin.`);
    };

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, onErr('os pedidos'));

    const unsubAlbums = onSnapshot(albumsQuery, (snapshot) => {
      setAlbums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, onErr('os álbuns'));

    const unsubStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, onErr('os alunos'));

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
        o.studentName?.toLowerCase().includes(term) ||
        o.studentEmail?.toLowerCase().includes(term) ||
        o.studentPhone?.includes(term) ||
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

  // Troca da senha do próprio admin (a senha fica no Firebase, nunca no código)
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ atual: '', nova: '', confirma: '' });
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const u = auth.currentUser;
    if (!u?.email) { setPwdMsg({ ok: false, text: 'Entre de novo e tente outra vez.' }); return; }
    if (pwd.nova.length < 6) { setPwdMsg({ ok: false, text: 'A nova senha precisa ter pelo menos 6 caracteres.' }); return; }
    if (pwd.nova !== pwd.confirma) { setPwdMsg({ ok: false, text: 'A confirmação não bate com a nova senha.' }); return; }
    setPwdBusy(true);
    try {
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, pwd.atual));
      await updatePassword(u, pwd.nova);
      setPwd({ atual: '', nova: '', confirma: '' });
      setPwdMsg({ ok: true, text: 'Senha alterada! Use a nova senha no próximo login.' });
    } catch (err: any) {
      const code = err?.code || '';
      setPwdMsg({ ok: false, text: code.includes('wrong-password') || code.includes('invalid-credential') ? 'Senha atual incorreta.' : code.includes('too-many-requests') ? 'Muitas tentativas. Espere alguns minutos.' : code.includes('weak-password') ? 'Senha muito fraca.' : 'Não foi possível alterar a senha agora.' });
    } finally {
      setPwdBusy(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string, label = 'este item') => {
    if (!window.confirm(`Tem certeza que quer excluir ${label}? Isso não pode ser desfeito.`)) return;
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
    if (!window.confirm('Excluir esta foto do aluno?')) return;
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
                <span className="font-script text-base gold-gradient leading-normal inline-block -my-1 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  Studio
                </span>
              </div>
              <span className="text-[8px] text-white/40 uppercase tracking-[0.4em] mt-1 pl-0.5">Formaturas</span>
            </div>

            {/* 20 Anos Badge */}
            <div className="flex flex-col items-center justify-center pl-2 border-l border-white/10 -mt-0.5">
              <GraduationCap className="text-brand-gold w-3 h-3 -mb-1 relative z-10 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
              <span className="font-script text-lg gold-gradient leading-normal inline-block px-1.5 pt-1 pb-0.5">
                20
              </span>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest ml-11">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
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

      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => { setShowPwd(true); setPwdMsg(null); setIsSidebarOpen(false); }}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all"
        >
          <KeyRound size={20} />
          Alterar senha
        </button>
        <button
          onClick={() => { setAccessMode('aluno'); navigate('/area-do-aluno'); }}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-brand-gold hover:bg-brand-gold/10 transition-all"
        >
          <Users size={20} />
          Ver como aluno
        </button>
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
            <h2 className="text-2xl md:text-3xl font-bold">{TAB_TITLE[activeTab]}</h2>
            <p className="text-gray-500 text-sm">Gerencie sua plataforma Top Line Studio</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {activeTab !== 'dashboard' && <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-brand-gold outline-none transition-all"
              />
            </div>}
          </div>
        </header>

        {loadError && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" /> {loadError}
          </div>
        )}

        {/* Dashboard Stats */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 mb-8 md:mb-12">
              {[
                { label: 'Total de Pedidos', value: orders.length, icon: ShoppingBag, color: 'text-blue-500' },
                { label: 'Pedidos de álbum', value: orders.filter(o => o.productType === 'album_studio_full' || o.package === 'album').length, icon: Book, color: 'text-brand-gold' },
                { label: 'Alunos', value: students.filter(s => s.role === 'student').length, icon: Users, color: 'text-green-500' },
                { label: 'Aguardando aprovação', value: students.filter(s => s.role === 'pending').length, icon: AlertCircle, color: 'text-yellow-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8 mb-8 md:mb-12">
              {[
                { label: 'Link Studio', count: students.filter(s => s.package === 'link').length, color: 'bg-blue-500', icon: ImageIcon },
                { label: 'Album Studio', count: students.filter(s => s.package === 'album').length, color: 'bg-brand-gold', icon: Check },
                { label: 'Demonstração', count: students.filter(s => s.role !== 'admin' && (s.package === 'prospect' || !s.package)).length, color: 'bg-gray-500', icon: Search },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Pedidos recentes</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-[10px] uppercase tracking-widest text-brand-gold hover:text-white">Ver todos</button>
                </div>
                {orders.length === 0 ? <p className="text-sm text-gray-500 py-6 text-center">Nenhum pedido ainda.</p> : (
                  <ul className="divide-y divide-white/5">
                    {orders.slice(0, 6).map(o => (
                      <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{o.studentName || `Pedido #${o.id.slice(0, 8).toUpperCase()}`}</p>
                          <p className="text-[11px] text-gray-500">{o.productName || (o.productType === 'link_studio' ? 'Link Studio' : 'Álbum Studio')} · {fmtDate(o.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-brand-gold">{fmtBRL(o.totalPrice)}</p>
                          <p className="text-[10px] text-gray-500">{ORDER_STATUS.find(st => st.value === (o.status || 'aguardando_contato'))?.label || o.status}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Aguardando aprovação</h3>
                  <button onClick={() => setActiveTab('students')} className="text-[10px] uppercase tracking-widest text-brand-gold hover:text-white">Ver alunos</button>
                </div>
                {students.filter(st => st.role === 'pending').length === 0 ? <p className="text-sm text-gray-500 py-6 text-center">Ninguém aguardando. 🎉</p> : (
                  <ul className="divide-y divide-white/5">
                    {students.filter(st => st.role === 'pending').slice(0, 6).map(st => (
                      <li key={st.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{st.displayName || 'Sem nome'}</p>
                          <p className="text-[11px] text-gray-500 truncate">{st.email || st.phoneNumber || '—'}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedStudentForApproval(st); setApprovalTier(st.package || 'prospect'); }}
                          className="shrink-0 bg-brand-gold text-black px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-white transition-all"
                        >
                          Aprovar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        {/* Data Tables */}
        {activeTab !== 'dashboard' && (
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">{activeTab === 'albums' ? 'Álbum' : 'Aluno'}</th>
                  <th className="p-4 md:p-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">{activeTab === 'albums' ? 'Fotos' : activeTab === 'students' ? 'Acesso' : 'Status'}</th>
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
                        {ORDER_STATUS.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                        {order.status && !ORDER_STATUS.some(st => st.value === order.status) && <option value={order.status}>{order.status}</option>}
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
                      {fmtBRL(order.totalPrice)}
                    </td>
                    <td className="p-4 md:p-6 text-xs md:text-sm text-gray-400">
                      {fmtDate(order.createdAt)}
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
                          onClick={() => handleDelete('orders', order.id, `o pedido de ${order.studentName || order.id.slice(0, 8)}`)}
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
                      {fmtDate(album.createdAt)}
                    </td>
                    <td className="p-4 md:p-6 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        <button 
                          onClick={() => handleDelete('albums', album.id, `o álbum ${album.title || ''}`)}
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
                        {ROLE_LABEL[student.role] || student.role || '—'}
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
                      {fmtDate(student.createdAt)}
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
                          student.role === 'student' && student.phoneNumber && (
                            <button 
                              onClick={() => sendWhatsApp(student.phoneNumber, student.displayName || 'Formando')}
                              className="bg-green-500/10 text-green-500 p-2 rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase"
                              title="Enviar confirmação via WhatsApp"
                            >
                              <MessageCircle size={14} className="md:w-4 md:h-4" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>
                          )
                        )}
                        <button 
                          onClick={() => handleDelete('users', student.id, `o aluno ${student.displayName || student.email || ''}`)}
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
            {filteredData().length === 0 && (
              <p className="text-center text-gray-500 text-sm py-12">
                {searchTerm ? 'Nada encontrado para essa busca.' : activeTab === 'orders' ? 'Nenhum pedido ainda.' : activeTab === 'albums' ? 'Nenhum álbum salvo ainda.' : 'Nenhum aluno cadastrado ainda.'}
              </p>
            )}
          </div>
        </div>
        )}
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
            className="bg-zinc-900 border border-white/10 rounded-3xl md:rounded-[40px] p-5 md:p-8 max-w-4xl w-full h-[85vh] flex flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h3 className="text-xl font-bold">Fotos de {selectedStudentForPhotos.displayName || 'aluno'}</h3>
                <p className="text-xs text-gray-500">{studentPhotos.length} fotos carregadas</p>
              </div>
              <div className="flex items-center gap-4">
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
                  {photo.source === 'student' && <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] uppercase tracking-wider text-gray-300">do aluno</span>}
                  <div className="absolute top-2 right-2 md:inset-0 md:bg-black/60 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex md:items-center md:justify-center">
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      title="Excluir foto"
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
      {showPwd && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPwd(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleChangePassword} className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><KeyRound size={18} className="text-brand-gold" /> Alterar senha</h3>
              <button type="button" onClick={() => setShowPwd(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-xs text-gray-500">Vale para o login no painel e na Área do Aluno.</p>
            {(['atual', 'nova', 'confirma'] as const).map((k) => (
              <input
                key={k}
                type="password"
                autoComplete={k === 'atual' ? 'current-password' : 'new-password'}
                placeholder={k === 'atual' ? 'Senha atual' : k === 'nova' ? 'Nova senha (mín. 6 caracteres)' : 'Repita a nova senha'}
                value={pwd[k]}
                onChange={(e) => setPwd({ ...pwd, [k]: e.target.value })}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-gold outline-none"
                required
              />
            ))}
            {pwdMsg && <p className={`text-sm ${pwdMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg.text}</p>}
            <button type="submit" disabled={pwdBusy} className="w-full bg-brand-gold text-black font-bold py-3 rounded-xl hover:bg-white transition-all disabled:opacity-60">
              {pwdBusy ? 'Alterando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
