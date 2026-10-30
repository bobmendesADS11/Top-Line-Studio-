import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Check, 
  MessageCircle, 
  Layers, 
  BookOpen, 
  User, 
  Phone, 
  GraduationCap, 
  MapPin, 
  FileText,
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COMPANY_WHATSAPP } from '../lib/contact';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseType: 'LINK' | 'FULL';
  albumSize: string;
  materialType: string;
  requestedPageCount: number;
  photoCount: number;
  totalPrice: number;
  photos: { id: string; url: string; thumbnail?: string }[];
  coverPhotoUrl?: string;
  videoUrl?: string;
  onSwitchToFullAlbum?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  purchaseType,
  albumSize,
  materialType,
  requestedPageCount,
  photoCount,
  totalPrice,
  photos,
  coverPhotoUrl,
  videoUrl,
  onSwitchToFullAlbum
}) => {
  const currentUser = auth.currentUser;
  
  const [studentName, setStudentName] = useState(currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [course, setCourse] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState<any>(null);

  const materialNames: Record<string, string> = {
    standard: 'Padrão Nobre',
    premium: 'Premium Luxo',
    leather: 'Couro Studio Legítimo',
    acrylic: 'Acrílico Cristalino Studio',
    velvet: 'Veludo Studio Soft',
    photo: 'Fotográfica em Alta Definição'
  };

  const formattedMaterial = materialNames[materialType] || materialType;

  // WhatsApp company contact

  const handleSendWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        studentUid: currentUser?.uid || 'guest',
        studentEmail: currentUser?.email || '',
        studentName: studentName || 'Formando',
        studentPhone: phoneNumber || '',
        course: course || 'Formando 2026',
        deliveryAddress: purchaseType === 'FULL' ? deliveryAddress : 'Digital (Link Vitalício)',
        productType: purchaseType === 'LINK' ? 'link_studio' : 'album_studio_full',
        type: purchaseType === 'LINK' ? 'link' : 'album',
        package: purchaseType === 'LINK' ? 'link' : 'album',
        productName: purchaseType === 'LINK' ? 'Top Line Link Studio (Digital)' : 'Top Line Studio (Álbum Físico + Link)',
        albumSpecs: purchaseType === 'FULL' ? {
          size: albumSize,
          material: formattedMaterial,
          materialKey: materialType,
          pageCount: requestedPageCount,
          photoCount,
          videoUrl: videoUrl || null,
          coverPhotoUrl: coverPhotoUrl || null
        } : null,
        photoCount,
        totalPrice,
        notes: notes || '',
        status: 'aguardando_contato',
        createdAt: serverTimestamp()
      };

      // Save order in Firestore
      let orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      try {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        orderId = docRef.id.slice(0, 8).toUpperCase();
      } catch (err) {
        console.warn('Could not save order directly to Firestore, proceeding with WhatsApp:', err);
      }

      // Generate polished WhatsApp Message
      let msg = '';
      if (purchaseType === 'LINK') {
        msg = 
`🎓 *NOVO PEDIDO - TOP LINE LINK STUDIO* 🎓
------------------------------------------
📋 *ID do Pedido:* #${orderId}
👤 *Formando(a):* ${studentName || 'Formando'}
📱 *WhatsApp/Contato:* ${phoneNumber || 'Informado no app'}
${course ? `🏛 *Curso:* ${course}\n` : ''}
✨ *PRODUTO SELECIONADO:*
💎 *Top Line Link Studio (Acesso Digital Vitalício)*
• Acesso total à galeria exclusiva para visualização e download
• Todas as fotos oficiais em alta definição
• Fotos sob curadoria no pedido: ${photoCount} fotos

💰 *Investimento Total:* R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${notes ? `📝 *Observações:* ${notes}\n` : ''}
Olá! Acabei de configurar meu pedido do *Link Studio* pela Área do Aluno e gostaria de receber a confirmação e dados para pagamento/PIX.`;
      } else {
        msg = 
`🎓 *NOVO PEDIDO - TOP LINE STUDIO (ÁLBUM FÍSICO)* 🎓
--------------------------------------------------
📋 *ID do Pedido:* #${orderId}
👤 *Formando(a):* ${studentName || 'Formando'}
📱 *WhatsApp/Contato:* ${phoneNumber || 'Informado no app'}
${course ? `🏛 *Curso:* ${course}\n` : ''}
👑 *PRODUTO SELECIONADO:*
💎 *Top Line Studio (Álbum Físico Premium + Link Digital)*
• Formato do Álbum: ${albumSize} cm
• Acabamento da Capa: ${formattedMaterial}
• Lâminas Panorâmicas: ${requestedPageCount} páginas
• Fotos sob curadoria diagramadas: ${photoCount} fotos
${videoUrl ? `• Vídeo na Capa: Sim (Integrado)\n` : ''}${deliveryAddress ? `📍 *Endereço de Entrega:* ${deliveryAddress}\n` : ''}
💰 *Investimento Total:* R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${notes ? `📝 *Observações:* ${notes}\n` : ''}
Olá! Finalizei a diagramação do meu álbum pelo Top Line Studio e gostaria de confirmar o pedido e combinar os detalhes de pagamento e produção!`;
      }

      const whatsappUrl = `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(msg)}`;

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#FFF', '#996515']
        });
      } catch (e) {
        // ignore confetti errors
      }

      setOrderCompleted({
        orderId,
        whatsappUrl
      });

      // Try opening WhatsApp in a new tab; if iframe popup blocker intercepts, user has direct button
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked by browser/iframe, user can click button:', e);
      }

    } catch (error) {
      console.error('Error generating order:', error);
      setFormError('Houve um erro ao processar seu pedido. Por favor tente novamente ou entre em contato diretamente pelo WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-zinc-950 border border-brand-gold/30 rounded-[36px] shadow-[0_0_80px_rgba(212,175,55,0.2)] overflow-hidden relative my-8"
      >
        {/* Glow header accents */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              {purchaseType === 'LINK' ? <Sparkles size={20} /> : <BookOpen size={20} />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold flex items-center gap-1.5">
                Top Line Studio • Finalização
              </span>
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {purchaseType === 'LINK' ? 'Contratação do Link Studio' : 'Pedido do Álbum Físico Studio'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {orderCompleted ? (
            /* Success confirmation screen */
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-full bg-brand-gold/20 border-2 border-brand-gold flex items-center justify-center mx-auto text-brand-gold shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                <Check size={36} />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">
                  Pedido Registrado com Sucesso
                </span>
                <h3 className="text-2xl md:text-3xl font-serif text-white">
                  Parabéns, {studentName || 'Formando'}!
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  Seu pedido <strong className="text-brand-gold">#{orderCompleted.orderId}</strong> foi encaminhado para nossa equipe.
                  {purchaseType === 'LINK' 
                    ? ' Vamos incluir todas as suas fotos em alta resolução no seu acesso exclusivo para você baixar e guardar para sempre.' 
                    : ' Nossa equipe de encadernação e design cuidará de cada detalhe do seu álbum físico com o máximo requinte.'}
                </p>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl max-w-md mx-auto flex items-center justify-between text-left">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Total do Investimento</p>
                  <p className="text-xl font-serif font-bold text-brand-gold">
                    R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Status</p>
                  <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Aguardando Contato
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a 
                  href={orderCompleted.whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <MessageCircle size={18} />
                  Reabrir WhatsApp
                </a>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Concluir e Fechar
                </button>
              </div>
            </div>
          ) : (
            /* Order review & WhatsApp send form */
            <form onSubmit={handleSendWhatsAppOrder} className="space-y-6">
              {/* Product Card Summary */}
              <div className="bg-zinc-900/70 border border-brand-gold/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-brand-gold text-black">
                        {purchaseType === 'LINK' ? 'Digital Studio' : 'Físico + Digital Studio'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {photoCount} fotos sob curadoria
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-white">
                      {purchaseType === 'LINK' 
                        ? 'Link Studio (Galeria Digital Vitalícia)' 
                        : `Álbum Físico Studio (${albumSize} cm)`}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-md">
                      {purchaseType === 'LINK'
                        ? 'Acesso permanente a todas as fotos tratadas em resolução máxima para você baixar, compartilhar e guardar para a posteridade.'
                        : `Acabamento ${formattedMaterial} com ${requestedPageCount} lâminas panorâmicas e papel fotográfico de alta gramatura.`}
                    </p>
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Total do Pedido</span>
                    <span className="text-2xl font-serif font-bold text-brand-gold">
                      R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* If selected LINK, show option to add physical album right here! */}
                {purchaseType === 'LINK' && onSwitchToFullAlbum && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-gold/5 -mx-5 -mb-5 p-4 rounded-b-2xl">
                    <div className="flex items-center gap-2 text-xs text-brand-gold font-medium">
                      <Sparkles size={16} className="shrink-0" />
                      <span>Deseja receber também o Álbum Físico encadernado de luxo em sua casa?</span>
                    </div>
                    <button
                      type="button"
                      onClick={onSwitchToFullAlbum}
                      className="px-4 py-2 bg-brand-gold text-black rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-white transition-all shrink-0"
                    >
                      + Adicionar Álbum Físico
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                  <User size={14} className="text-brand-gold" />
                  Dados do Formando para o Pedido
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ex: Gabriel Mestrelli"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                      WhatsApp para Contato
                    </label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(48) 99176-4001"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                    Curso e Turma
                  </label>
                  <input 
                    type="text" 
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Ex: Medicina UFSC 2026 / Direito"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-colors"
                  />
                </div>

                {purchaseType === 'FULL' && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1 flex items-center gap-1.5">
                      <MapPin size={12} className="text-brand-gold" />
                      Endereço Completo de Entrega (para o Álbum Físico)
                    </label>
                    <input 
                      type="text" 
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, complemento, bairro, cidade - CEP"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                    Observações / Pedidos Especiais (Opcional)
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Alguma foto prioritária, gravação especial na capa ou dúvida..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-brand-gold outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Guarantees & Process */}
              <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                  <ShieldCheck size={16} className="text-brand-gold" />
                  <span>Como funciona após enviar o pedido:</span>
                </div>
                <ul className="text-[11px] text-gray-400 space-y-1.5 pl-6 list-disc">
                  <li>O pedido é recebido diretamente pela diretoria da Top Line no WhatsApp.</li>
                  <li>Você recebe o espelho do pedido com as opções de pagamento (PIX ou Cartão em até 12x).</li>
                  {purchaseType === 'LINK' ? (
                    <li>Sua galeria é liberada para download imediato em alta definição na sua área exclusiva.</li>
                  ) : (
                    <li>O projeto gráfico entra na fila de encadernação de luxo e você acompanha o status de produção.</li>
                  )}
                </ul>
              </div>

              {/* Inline Error Message */}
              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <span className="shrink-0 font-bold">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 px-6 bg-brand-gold hover:bg-white text-black font-bold text-xs uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                  {isSubmitting 
                    ? 'Preparando WhatsApp...' 
                    : purchaseType === 'LINK'
                      ? 'Enviar Pedido do Link via WhatsApp'
                      : 'Enviar Pedido do Álbum via WhatsApp'}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
