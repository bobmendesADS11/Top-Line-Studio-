import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, BookOpen, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, MoreVertical, Eye, Settings, 
  ArrowUpRight, BarChart3, LogOut, ChevronLeft
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

interface Album {
  id: string;
  name: string;
  status: 'editing' | 'finished' | 'approved';
  total_pages: number;
  created_at: string;
  user_id: string;
  profiles?: {
    phone: string;
  };
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          profiles:user_id (phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (err) {
      console.error('Erro ao buscar álbuns:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setAlbums(albums.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         album.profiles?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || album.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: albums.length,
    editing: albums.filter(a => a.status === 'editing').length,
    finished: albums.filter(a => a.status === 'finished').length,
    approved: albums.filter(a => a.status === 'approved').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-brand-black border-r border-white/5 p-6 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-brand-gold flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-brand-navy" />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-tight">Admin</h1>
            <p className="text-[10px] text-brand-gold uppercase tracking-widest font-bold">Top Line Studio</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-gold/10 text-brand-gold font-bold transition-all">
            <BookOpen className="w-5 h-5" /> Álbuns
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Users className="w-5 h-5" /> Usuários
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Settings className="w-5 h-5" /> Configurações
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 p-8">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif mb-2">Painel de Controle</h2>
            <p className="text-gray-500">Gerencie os álbuns e formandos da Top Line.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold">Gabriel Mestrelli</p>
              <p className="text-xs text-brand-gold uppercase tracking-widest">Administrador</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold">
              GM
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total de Álbuns', value: stats.total, icon: <BookOpen />, color: 'blue' },
            { label: 'Em Edição', value: stats.editing, icon: <Clock />, color: 'yellow' },
            { label: 'Finalizados', value: stats.finished, icon: <CheckCircle2 />, color: 'green' },
            { label: 'Aprovados', value: stats.approved, icon: <Sparkles />, color: 'gold' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/5 text-brand-gold">
                  {stat.icon}
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-serif">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Table Section */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-serif text-xl">Lista de Álbuns</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-brand-gold transition-colors text-sm w-64"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full py-2 px-4 focus:outline-none focus:border-brand-gold transition-colors text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="editing">Em Edição</option>
                <option value="finished">Finalizado</option>
                <option value="approved">Aprovado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-gray-500 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-bold">Formando</th>
                  <th className="px-6 py-4 font-bold">Álbum</th>
                  <th className="px-6 py-4 font-bold">Páginas</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Carregando álbuns...
                    </td>
                  </tr>
                ) : filteredAlbums.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Nenhum álbum encontrado.
                    </td>
                  </tr>
                ) : filteredAlbums.map((album) => (
                  <tr key={album.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold text-xs font-bold">
                          {album.profiles?.phone?.slice(-2) || '??'}
                        </div>
                        <p className="font-bold">{album.profiles?.phone || 'Sem Telefone'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{album.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {album.total_pages} páginas
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        album.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        album.status === 'finished' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {album.status === 'approved' ? 'Aprovado' :
                         album.status === 'finished' ? 'Finalizado' : 'Em Edição'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(album.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative group/menu">
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/10 py-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50">
                            <button 
                              onClick={() => updateStatus(album.id, 'approved')}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-green-500/10 hover:text-green-500"
                            >
                              Aprovar Álbum
                            </button>
                            <button 
                              onClick={() => updateStatus(album.id, 'finished')}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-brand-gold/10 hover:text-brand-gold"
                            >
                              Marcar como Finalizado
                            </button>
                            <button 
                              onClick={() => updateStatus(album.id, 'editing')}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-yellow-500/10 hover:text-yellow-500"
                            >
                              Voltar para Edição
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
