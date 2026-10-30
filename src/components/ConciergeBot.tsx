import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, MessageCircle, RotateCcw, Bot } from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import { openWhatsApp } from '../lib/contact';
import {
  PRICES,
  SIZE_OPTIONS,
  MATERIAL_OPTIONS,
  PAGE_OPTIONS,
  MATERIAL_INFO,
  RECOMMENDED_PHOTOS,
  calcTotal,
  formatBRL,
} from '../lib/pricing';

// ----------------------------------------------------------------------
// Robô de ajuda guiado (sem IA): tira dúvidas frequentes e conduz o aluno
// até o pedido completo, usando a mesma tabela de preços do editor.
// ----------------------------------------------------------------------

export type ConciergeIntent = 'menu' | 'order' | 'order_full' | 'order_link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  intent?: ConciergeIntent;
  studentName?: string;
  userId?: string;
  /** PROSPECT = ainda não comprou (usa fotos de demonstração, não sobe fotos) */
  userTier?: 'PROSPECT' | 'LINK' | 'ALBUM';
  photos: { id: string; url: string; thumbnail?: string }[];
  orders: any[];
  onNavigate: (path: string) => void;
}

type Option = { label: string; onSelect: () => void; primary?: boolean };
type Message = { id: number; from: 'bot' | 'user'; content: React.ReactNode; options?: Option[] };
type Draft = { type: 'LINK' | 'FULL'; size: string; material: string; pages: number; photos: number | null };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Recebido — aguardando confirmação',
  aguardando_contato: 'Recebido — a equipe vai te chamar no WhatsApp',
  processing: 'Em produção',
  pago: 'Pagamento confirmado',
  concluido: 'Concluído',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const DEFAULT_DRAFT: Draft = { type: 'FULL', size: '30x30', material: 'standard', pages: 20, photos: null };

const sizeLabel = (s: string) => s.replace('x', ' × ') + ' cm';
const plus = (v: number) => (v > 0 ? `+ ${formatBRL(v)}` : 'incluso');

export default function ConciergeBot({ isOpen, onClose, intent = 'menu', studentName, userId, userTier = 'PROSPECT', photos, orders, onNavigate }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [checkout, setCheckout] = useState<Draft | null>(null);
  const draftRef = useRef<Draft>({ ...DEFAULT_DRAFT });
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = (studentName || '').split(' ')[0] || 'formando(a)';
  const isBuyer = userTier !== 'PROSPECT';
  // Antes da compra o formando não tem fotos próprias (recebe as oficiais depois)
  const photoCount = isBuyer ? photos.length : 0;

  // ---------- helpers de conversa ----------
  const push = (from: Message['from'], content: React.ReactNode, options?: Option[]) =>
    setMessages(prev => [
      // opções antigas deixam de ser clicáveis quando chega mensagem nova
      ...prev.map(m => (m.options ? { ...m, options: undefined } : m)),
      { id: ++idRef.current, from, content, options },
    ]);

  const botSay = (content: React.ReactNode, options?: Option[]) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      push('bot', content, options);
    }, 450);
  };

  const userSay = (text: string) => push('user', text);

  const choose = (label: string, next: () => void) => () => {
    userSay(label);
    next();
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // ---------- menu principal ----------
  const menuOptions = (): Option[] => [
    { label: '🛒 Fazer meu pedido', onSelect: choose('Quero fazer meu pedido', startOrder), primary: true },
    { label: '💎 Conhecer os produtos', onSelect: choose('Quero conhecer os produtos', showProducts) },
    { label: '📐 Tamanhos e capas', onSelect: choose('Tamanhos e capas', showSizes) },
    { label: '💳 Pagamento e prazos', onSelect: choose('Pagamento e prazos', showPayment) },
    isBuyer
      ? { label: '📸 Enviar minhas fotos', onSelect: choose('Como envio minhas fotos?', showUpload) }
      : { label: '📸 Quando recebo minhas fotos?', onSelect: choose('Quando recebo minhas fotos?', showUpload) },
    ...(userTier !== 'ALBUM' ? [{ label: '📖 Como comprar o álbum depois', onSelect: choose('Como compro o álbum depois?', showAlbumLaterGuide) }] : []),
    { label: '🎨 Montar meu álbum', onSelect: choose('Como monto meu álbum?', showEditor) },
    { label: '📦 Acompanhar pedido', onSelect: choose('Quero acompanhar meu pedido', showOrders) },
    { label: '💬 Falar com uma pessoa', onSelect: choose('Quero falar com uma pessoa', showHuman) },
  ];

  const backOptions = (extra: Option[] = []): Option[] => [
    ...extra,
    { label: '↩ Outras dúvidas', onSelect: choose('Outras dúvidas', showMenu) },
  ];

  function showMenu() {
    botSay('Em que mais posso te ajudar?', menuOptions());
  }

  // ---------- dúvidas frequentes ----------
  function showProducts() {
    botSay(
      <div className="space-y-3">
        <p>Temos duas opções:</p>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="font-bold text-white">Link Studio (digital) — {formatBRL(PRICES.edition.link)}</p>
          <p className="text-gray-400">Galeria digital premium com acesso vitalício, download em alta definição e compartilhamento instantâneo.</p>
        </div>
        <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-3">
          <p className="font-bold text-brand-gold">Álbum + Link — a partir de {formatBRL(PRICES.edition.album)}</p>
          <p className="text-gray-400">Álbum físico que abre 180° (lâminas panorâmicas), com o Link Studio incluso.</p>
        </div>
        <p className="text-gray-400">Nos dois casos soma {formatBRL(PRICES.photo)} por foto escolhida para o álbum/galeria.</p>
      </div>,
      backOptions([{ label: '🛒 Montar meu pedido', onSelect: choose('Quero montar meu pedido', startOrder), primary: true }]),
    );
  }

  function showSizes() {
    botSay(
      <div className="space-y-3">
        <p><b>Tamanhos</b> (largura × altura de cada página):</p>
        <ul className="space-y-1">
          {SIZE_OPTIONS.map(s => (
            <li key={s} className="flex justify-between gap-3"><span>{sizeLabel(s)}</span><span className="text-brand-gold">{plus(PRICES.size[s])}</span></li>
          ))}
        </ul>
        <p><b>Capas</b>:</p>
        <ul className="space-y-1.5">
          {MATERIAL_OPTIONS.map(m => (
            <li key={m}>
              <div className="flex justify-between gap-3"><span className="text-white">{MATERIAL_INFO[m].label}</span><span className="text-brand-gold">{plus(PRICES.material[m])}</span></div>
              <p className="text-gray-500 text-[11px]">{MATERIAL_INFO[m].description}</p>
            </li>
          ))}
        </ul>
        <p className="text-gray-400">Dica: no visualizador 3D, o botão <b>Medidas</b> mostra o tamanho real do álbum aberto.</p>
      </div>,
      backOptions([
        { label: '🛒 Montar meu pedido', onSelect: choose('Quero montar meu pedido', startOrder), primary: true },
        { label: '📖 Ver em 3D', onSelect: () => { onClose(); onNavigate('/area-do-aluno/album'); } },
      ]),
    );
  }

  function showPayment() {
    botSay(
      <div className="space-y-2">
        <p>O pagamento pode ser feito por <b>PIX</b> ou <b>cartão em até 12x</b>.</p>
        <p>Quando você envia o pedido por aqui, a equipe Top Line recebe tudo no WhatsApp e te manda o <b>espelho do pedido</b>, com as opções de pagamento e o <b>prazo de produção</b> confirmado para a sua turma.</p>
        <p className="text-gray-400">No Link Studio, a galeria é liberada na sua área assim que o pagamento é confirmado.</p>
      </div>,
      backOptions([{ label: '🛒 Fazer meu pedido', onSelect: choose('Quero fazer meu pedido', startOrder), primary: true }]),
    );
  }

  function showUpload() {
    if (!isBuyer) {
      botSay(
        <div className="space-y-2">
          <p>Você não precisa enviar fotos agora. 😊</p>
          <p><b>Depois da compra</b>, suas <b>fotos oficiais</b> da formatura são liberadas aqui na sua área. A partir daí você também pode <b>subir as suas próprias fotos</b>.</p>
          <p className="text-gray-400">Enquanto isso, você pode montar e ver o álbum em 3D com <b>fotos de demonstração</b>.</p>
        </div>,
        backOptions([
          { label: '🎨 Montar álbum de demonstração', onSelect: () => { onClose(); onNavigate('/area-do-aluno/editor'); }, primary: true },
          { label: '🛒 Fazer meu pedido', onSelect: choose('Quero fazer meu pedido', startOrder) },
        ]),
      );
      return;
    }
    botSay(
      <div className="space-y-2">
        <p>É só abrir <b>Minhas fotos</b> na sua área e tocar em enviar. Pode mandar várias de uma vez.</p>
        <p className="text-gray-400">Fotos grandes do celular são ajustadas automaticamente. Você tem <b>{photoCount}</b> {photoCount === 1 ? 'foto' : 'fotos'} enviadas até agora.</p>
      </div>,
      backOptions([{ label: '📸 Abrir minhas fotos', onSelect: () => { onClose(); onNavigate('/area-do-aluno/galeria'); }, primary: true }]),
    );
  }

  function showEditor() {
    botSay(
      <div className="space-y-2">
        <p>No <b>Editor de Lâminas</b> você escolhe tamanho, capa e número de lâminas, organiza a ordem das fotos e escolhe o layout de cada página.</p>
        <p>Depois é só tocar em <b>Ver em 3D</b> para folhear o álbum como ele vai ficar.</p>
        {!isBuyer && <p className="text-gray-400">Antes da compra o editor usa <b>fotos de demonstração</b>; depois, suas fotos oficiais entram no lugar delas.</p>}
      </div>,
      backOptions([{ label: '🎨 Abrir o editor', onSelect: () => { onClose(); onNavigate('/area-do-aluno/editor'); }, primary: true }]),
    );
  }

  function showOrders() {
    if (!orders.length) {
      botSay('Você ainda não tem pedidos. Quer montar o seu agora?', backOptions([{ label: '🛒 Fazer meu pedido', onSelect: choose('Quero fazer meu pedido', startOrder), primary: true }]));
      return;
    }
    botSay(
      <div className="space-y-2">
        <p>Seus pedidos:</p>
        {orders.slice(0, 5).map(o => (
          <div key={o.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-bold text-white">{o.productName || (o.type === 'link' ? 'Link Studio' : 'Álbum + Link')}</p>
            <p className="text-brand-gold text-[11px]">{STATUS_LABEL[o.status] || o.status}</p>
            <p className="text-gray-500 font-mono text-[10px]">#{String(o.id).slice(0, 8).toUpperCase()}{o.totalPrice ? ` · ${formatBRL(o.totalPrice)}` : ''}</p>
          </div>
        ))}
      </div>,
      backOptions([{ label: '💬 Falar sobre meu pedido', onSelect: choose('Quero falar sobre meu pedido', showHuman) }]),
    );
  }

  function albumLaterSteps() {
    return (
      <div className="space-y-2">
        <p><b>Como comprar o álbum físico depois</b> 📖</p>
        <ol className="list-decimal pl-5 space-y-1.5 text-[12px]">
          <li>Depois da compra do Link Studio, suas <b>fotos oficiais</b> aparecem na sua área.</li>
          <li>Abra o <b>Editor de Lâminas</b>: suas fotos já entram no álbum com uma diagramação sugerida.</li>
          <li>Escolha <b>tamanho, capa e lâminas</b> e veja tudo em <b>3D</b>.</li>
          <li>No painel, toque em <b>Upgrade para Álbum</b> — ou fale comigo e escolha <b>Fazer meu pedido → Álbum + Link</b>.</li>
          <li>Confirme o pedido: a equipe te chama no WhatsApp para pagamento e produção.</li>
        </ol>
      </div>
    );
  }

  function showAlbumLaterGuide() {
    botSay(albumLaterSteps(), backOptions([
      ...(isBuyer ? [{ label: '📖 Montar o pedido do álbum agora', onSelect: choose('Quero montar o pedido do álbum', () => startOrder('FULL')), primary: true }] : []),
      { label: '🎨 Abrir o editor', onSelect: () => { onClose(); onNavigate('/area-do-aluno/editor'); } },
    ]));
  }

  function showHuman() {
    botSay('Claro! Vou te levar para o WhatsApp da equipe Top Line.', backOptions([
      { label: '💬 Abrir WhatsApp', onSelect: () => openWhatsApp(`Olá! Sou ${studentName || 'formando(a)'} e gostaria de ajuda com meu álbum Top Line Studio.`), primary: true },
    ]));
  }

  // ---------- passo a passo do pedido ----------
  function startOrder(preset?: 'LINK' | 'FULL') {
    draftRef.current = { ...DEFAULT_DRAFT };
    if (preset) {
      draftRef.current.type = preset;
      return preset === 'LINK' ? askPhotos() : askSize();
    }
    botSay(
      <p>Vamos montar seu pedido em poucos passos. <b>Qual produto você quer?</b></p>,
      [
        { label: `📖 Álbum + Link · desde ${formatBRL(PRICES.edition.album)}`, onSelect: choose('Álbum + Link', () => { draftRef.current.type = 'FULL'; askSize(); }), primary: true },
        { label: `💎 Só o Link Studio · ${formatBRL(PRICES.edition.link)}`, onSelect: choose('Só o Link Studio', () => { draftRef.current.type = 'LINK'; askPhotos(); }) },
        { label: '❓ Qual a diferença?', onSelect: choose('Qual a diferença?', showProducts) },
      ],
    );
  }

  function askSize() {
    botSay(
      <p><b>Passo 1 de 4 · Tamanho.</b> Qual tamanho de álbum?</p>,
      SIZE_OPTIONS.map(s => ({
        label: `${sizeLabel(s)} · ${plus(PRICES.size[s])}`,
        onSelect: choose(sizeLabel(s), () => { draftRef.current.size = s; askMaterial(); }),
        primary: s === '30x30',
      })),
    );
  }

  function askMaterial() {
    botSay(
      <p><b>Passo 2 de 4 · Capa.</b> Qual acabamento você prefere?</p>,
      MATERIAL_OPTIONS.map(m => ({
        label: `${MATERIAL_INFO[m].label} · ${plus(PRICES.material[m])}`,
        onSelect: choose(MATERIAL_INFO[m].label, () => { draftRef.current.material = m; askPages(); }),
      })),
    );
  }

  function askPages() {
    botSay(
      <p><b>Passo 3 de 4 · Lâminas.</b> Quantas lâminas (páginas duplas)? Recomendamos ~1,5 foto por lâmina.</p>,
      PAGE_OPTIONS.map(n => ({
        label: `${n} lâminas · ${plus(PRICES.pagePackage[n])} · até ${RECOMMENDED_PHOTOS[n]} fotos`,
        onSelect: choose(`${n} lâminas`, () => { draftRef.current.pages = n; askPhotos(); }),
        primary: n === 20,
      })),
    );
  }

  function askPhotos() {
    const d = draftRef.current;
    const step = d.type === 'FULL' ? 'Passo 4 de 4 · Fotos.' : 'Fotos.';
    const rec = d.type === 'FULL' ? RECOMMENDED_PHOTOS[d.pages] : undefined;
    const setPhotos = (n: number | null, label: string) => choose(label, () => { draftRef.current.photos = n; showSummary(); });

    // Já comprou e tem fotos próprias
    if (isBuyer && photoCount > 0) {
      botSay(
        <div className="space-y-1">
          <p><b>{step}</b> Você tem <b>{photoCount}</b> {photoCount === 1 ? 'foto' : 'fotos'} na sua área ({formatBRL(PRICES.photo)} cada).</p>
          {rec && photoCount > rec && <p className="text-amber-300 text-[11px]">Para {d.pages} lâminas recomendamos até {rec} fotos. Se quiser usar todas, escolha mais lâminas.</p>}
        </div>,
        [
          { label: `Usar minhas ${photoCount} fotos`, onSelect: setPhotos(photoCount, `Usar minhas ${photoCount} fotos`), primary: true },
          ...(rec && photoCount > rec ? [{ label: `Usar ${rec} fotos`, onSelect: setPhotos(rec, `Usar ${rec} fotos`) }] : []),
          ...(rec && photoCount > rec ? [{ label: '⬆ Escolher mais lâminas', onSelect: choose('Escolher mais lâminas', askPages) }] : []),
        ],
      );
      return;
    }

    // Antes da compra: escolhe só a QUANTIDADE (as fotos oficiais chegam depois)
    const opts = d.type === 'FULL'
      ? Array.from(new Set([Math.round((rec || 30) * 0.66), rec || 30, Math.round((rec || 30) * 1.33)]))
      : [20, 40, 60, 100];
    botSay(
      <div className="space-y-1">
        <p><b>{step}</b> Quantas fotos você quer {d.type === 'FULL' ? 'no álbum' : 'no Link Studio'}? ({formatBRL(PRICES.photo)} cada)</p>
        <p className="text-gray-400 text-[11px]">Você escolhe <b>quais</b> fotos depois, quando receber as fotos oficiais da formatura.</p>
      </div>,
      [
        ...opts.map(n => ({
          label: `${n} fotos · + ${formatBRL(n * PRICES.photo)}${n === rec ? ' · recomendado' : ''}`,
          onSelect: setPhotos(n, `${n} fotos`),
          primary: n === rec || (d.type === 'LINK' && n === 40),
        })),
        { label: 'Ainda não sei — definir com a equipe', onSelect: setPhotos(null, 'Ainda não sei quantas fotos') },
      ],
    );
  }

  function showSummary() {
    const d = draftRef.current;
    const t = calcTotal({ ...d, photoCount: d.photos ?? 0 });
    const row = (label: string, value: string) => (
      <div className="flex justify-between gap-3"><span className="text-gray-400">{label}</span><span className="text-white text-right">{value}</span></div>
    );
    botSay(
      <div className="space-y-3">
        <p><b>Resumo do seu pedido</b></p>
        <div className="rounded-xl border border-brand-gold/30 bg-black/40 p-3 space-y-1.5 text-[12px]">
          {row('Produto', d.type === 'LINK' ? 'Link Studio (digital)' : 'Álbum + Link')}
          {row(d.type === 'LINK' ? 'Link Studio' : 'Álbum + Link', formatBRL(t.base))}
          {d.type === 'FULL' && row(`Tamanho ${sizeLabel(d.size)}`, plus(t.size))}
          {d.type === 'FULL' && row(`Capa ${MATERIAL_INFO[d.material].label}`, plus(t.material))}
          {d.type === 'FULL' && row(`${d.pages} lâminas`, plus(t.pages))}
          {d.photos === null
            ? row('Fotos', `a definir (${formatBRL(PRICES.photo)} cada)`)
            : row(`${d.photos} ${d.photos === 1 ? 'foto' : 'fotos'}`, plus(t.photos))}
          <div className="border-t border-white/10 pt-2 mt-1 flex justify-between font-bold">
            <span className="text-white">{d.photos === null ? 'Total (a partir de)' : 'Total'}</span><span className="text-brand-gold">{formatBRL(t.total)}</span>
          </div>
        </div>
        <p className="text-gray-400 text-[11px]">Na próxima tela você confirma seus dados{d.type === 'FULL' ? ' e o endereço de entrega' : ''}, e o pedido vai direto para a equipe no WhatsApp.</p>
        {!isBuyer && <p className="text-gray-400 text-[11px]">Depois da compra, suas fotos oficiais são liberadas na sua área.</p>}
      </div>,
      [
        { label: '✅ Confirmar e enviar pedido', onSelect: () => { userSay('Confirmar pedido'); setCheckout({ ...d }); }, primary: true },
        ...(d.type === 'FULL' ? [{ label: '🎨 Montar as páginas no editor antes', onSelect: () => openInEditor(d) }] : []),
        ...(d.type === 'LINK' ? [{ label: '📖 Como comprar o álbum depois', onSelect: choose('Como compro o álbum depois?', showAlbumLaterGuide) }] : []),
        { label: '✏️ Mudar algo', onSelect: choose('Quero mudar algo', () => startOrder()) },
        { label: '💬 Falar com uma pessoa', onSelect: choose('Falar com uma pessoa', showHuman) },
      ],
    );
  }

  // Leva as escolhas para o editor (ele lê o rascunho salvo no aparelho)
  function openInEditor(d: Draft) {
    try {
      const key = `topline_album_draft_${userId || 'guest'}`;
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...prev, albumSize: d.size, materialType: d.material, requestedPageCount: d.pages, purchaseType: d.type }));
    } catch {
      /* sem armazenamento: o editor abre com o padrão */
    }
    onClose();
    onNavigate('/area-do-aluno/editor');
  }

  // ---------- pergunta digitada (direciona por palavras-chave) ----------
  const routes: { words: string[]; run: () => void }[] = [
      // acompanhar vem antes de "pedido" para "status do meu pedido" não abrir um pedido novo
      { words: ['status', 'acompanhar', 'andamento', 'chegou', 'produção', 'producao', 'rastre', 'onde está', 'onde esta'], run: showOrders },
      { words: ['pedido', 'comprar', 'contratar', 'fechar', 'finalizar', 'quero o album', 'quero o álbum', 'adquirir'], run: () => startOrder() },
      { words: ['pagamento', 'pagar', 'pix', 'cartão', 'cartao', 'parcel', 'prazo', 'entrega', 'demora', 'quando'], run: showPayment },
      { words: ['tamanho', 'medida', 'cm', 'capa', 'couro', 'veludo', 'acrílico', 'acrilico', 'linho', 'acabamento'], run: showSizes },
      { words: ['preço', 'preco', 'valor', 'quanto', 'custa', 'link', 'diferença', 'diferenca', 'produto'], run: showProducts },
      { words: ['álbum depois', 'album depois', 'upgrade', 'físico depois', 'fisico depois'], run: showAlbumLaterGuide },
      { words: ['foto', 'enviar', 'upload', 'subir', 'galeria', 'receb'], run: showUpload },
      { words: ['editor', 'montar', 'layout', 'diagram', 'lâmina', 'lamina', 'página', 'pagina', '3d'], run: showEditor },
      { words: ['pessoa', 'humano', 'atendente', 'whatsapp', 'falar', 'ligar', 'telefone'], run: showHuman },
  ];

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    userSay(text);
    const lower = text.toLowerCase();
    const hit = routes.find(r => r.words.some(w => lower.includes(w)));
    if (hit) hit.run();
    else botSay('Não entendi bem 🤔. Posso te ajudar com um destes assuntos — ou te passo para uma pessoa da equipe:', menuOptions());
  };

  // ---------- abertura ----------
  const start = () => {
    setMessages([]);
    idRef.current = 0;
    push('bot', <p>Olá, <b>{firstName}</b>! 👋 Sou o assistente da <b>Top Line Studio</b>. Posso tirar suas dúvidas e te ajudar a fazer seu pedido completo.</p>);
    if (intent === 'order') startOrder();
    else if (intent === 'order_full') { botSay('Vamos montar seu Álbum + Link.'); startOrder('FULL'); }
    else if (intent === 'order_link') { botSay('Vamos montar seu Link Studio.'); startOrder('LINK'); }
    else botSay('Como posso te ajudar?', menuOptions());
  };

  useEffect(() => {
    if (isOpen) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, intent]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !checkout && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, checkout, onClose]);

  const lastBot = [...messages].reverse().find(m => m.from === 'bot');
  const summaryTotal = checkout ? calcTotal({ ...checkout, photoCount: checkout.photos ?? 0 }).total : 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              role="dialog"
              aria-label="Assistente Top Line"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative w-full sm:max-w-lg h-[88dvh] sm:h-[78vh] bg-zinc-950 border border-brand-gold/25 rounded-t-3xl sm:rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-brand-gold/10 to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-gold text-black flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                    <Bot size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">Assistente Top Line</p>
                    <p className="text-[10px] uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online agora
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={start} className="p-2 rounded-xl text-gray-400 hover:text-brand-gold hover:bg-white/5" title="Recomeçar" aria-label="Recomeçar conversa">
                    <RotateCcw size={16} />
                  </button>
                  <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5" title="Fechar" aria-label="Fechar assistente">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Conversa */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 overscroll-contain">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] ${m.from === 'user' ? '' : 'space-y-2'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                          m.from === 'user'
                            ? 'bg-brand-gold text-black font-medium rounded-br-md'
                            : 'bg-zinc-900 text-gray-200 border border-white/5 rounded-bl-md'
                        }`}
                      >
                        {m.content}
                      </div>
                      {m.options && m === lastBot && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          {m.options.map((o, i) => (
                            <button
                              key={i}
                              onClick={o.onSelect}
                              className={`text-left px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all border ${
                                o.primary
                                  ? 'bg-brand-gold/15 border-brand-gold/50 text-brand-gold hover:bg-brand-gold hover:text-black'
                                  : 'bg-white/5 border-white/10 text-gray-200 hover:border-brand-gold/40 hover:text-white'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-zinc-900 border border-white/5 flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-gold/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Campo de pergunta */}
              <div className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-zinc-950">
                <form
                  onSubmit={e => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Digite sua dúvida (ex.: prazo, capa, preço)…"
                    className="flex-1 min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-gold"
                    aria-label="Sua dúvida"
                  />
                  <button type="submit" disabled={!input.trim()} className="p-3 rounded-xl bg-brand-gold text-black disabled:opacity-30" aria-label="Enviar">
                    <Send size={16} />
                  </button>
                </form>
                <button
                  onClick={() => openWhatsApp(`Olá! Sou ${studentName || 'formando(a)'} e gostaria de ajuda com meu álbum Top Line Studio.`)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-brand-gold"
                >
                  <MessageCircle size={12} /> Prefere falar com uma pessoa? WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {checkout && (
        <CheckoutModal
          isOpen={!!checkout}
          onClose={() => {
            const wasLink = checkout.type === 'LINK';
            setCheckout(null);
            if (wasLink) {
              botSay(<p>Pronto! E quando quiser transformar suas fotos em um álbum físico, é assim: <Sparkles size={12} className="inline text-brand-gold" /></p>);
              botSay(albumLaterSteps(), menuOptions());
              return;
            }
            botSay(
              <p>Pronto! Se precisar de mais alguma coisa, é só chamar. <Sparkles size={12} className="inline text-brand-gold" /></p>,
              menuOptions(),
            );
          }}
          purchaseType={checkout.type}
          albumSize={checkout.size}
          materialType={checkout.material}
          requestedPageCount={checkout.pages}
          photoCount={checkout.photos ?? 0}
          totalPrice={summaryTotal}
          photos={isBuyer ? photos : []}
          coverPhotoUrl={isBuyer ? photos[0]?.url : undefined}
        />
      )}
    </>
  );
}
