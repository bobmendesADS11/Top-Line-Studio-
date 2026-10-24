import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ConciergeChatProps {
  onClose: () => void;
  studentName?: string;
  initialMessage?: string;
}

const ConciergeChat: React.FC<ConciergeChatProps> = ({ onClose, studentName, initialMessage }) => {
  console.log('DEBUG: ConciergeChat rendering, studentName:', studentName, 'initialMessage:', initialMessage);
  useEffect(() => {
    console.log('DEBUG: ConciergeChat mounted');
    // Prevent body scroll when chat is open
    document.body.style.overflow = 'hidden';
    return () => {
      console.log('DEBUG: ConciergeChat unmounting');
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Olá ${studentName || 'Formando'}, sou seu Especialista Concierge da Top Line Studio. Como posso ajudar a tornar seu legado ainda mais extraordinário hoje?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialSentRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialMessage && messages.length === 1 && !initialSentRef.current) {
      console.log('DEBUG: Auto-sending initial message:', initialMessage);
      initialSentRef.current = true;
      handleSend(initialMessage);
    }
  }, [initialMessage, messages.length]);

  const handleSend = async (overrideMessage?: string) => {
    const userMessage = (overrideMessage || input).trim();
    if (!userMessage || isLoading) return;

    if (!overrideMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `Você é o Especialista Concierge da Top Line Studio, uma empresa de luxo focada em formaturas premium. 
          Seu tom de voz é extremamente sofisticado, atencioso, profissional e inspirador. 
          Você é um expert em:
          1. Design de Álbuns: Layouts, curadoria de fotos e narrativa visual.
          2. Materiais Nobres e Modelos Studio: 
             - Link Studio: Galeria digital premium com acesso vitalício e compartilhamento instantâneo.
             - Leather Studio: Couro legítimo trabalhado artesanalmente, um clássico atemporal.
             - Acrylic Studio: Capa em acrílico cristalino de alta espessura, que traz profundidade e brilho às fotos.
             - Velvet Studio: Toque aveludado e sofisticado com detalhes em hot-stamping.
             - Video Studio: Um álbum físico de luxo com uma tela de alta definição embutida na capa, que reproduz seus vídeos de formatura automaticamente ao ser aberto.
          3. Experiência do Formando: Como eternizar o legado da conquista.
          
          Regras:
          - Nunca mencione que você é uma IA, a menos que seja estritamente necessário. Aja como um concierge humano de alto nível.
          - Use termos como "Legado", "Excelência", "Extraordinário", "Eternizar".
          - Se o aluno perguntar sobre preços, pacotes ou como adquirir seu álbum, oriente-o a explorar o **Catálogo Studio** ao final da sua página principal ou acessar o **Estúdio Digital 3D**. Nessas seções, ele poderá visualizar cada modelo em detalhes, escolher seu modelo Studio favorito e conferir as condições exclusivas para eternizar seu momento.
          - Seja breve mas impactante.`,
          temperature: 0.7,
        }
      });

      const modelText = response.text || "Desculpe, tive um pequeno contratempo técnico. Como posso ajudar?";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "No momento estou em atendimento exclusivo. Por favor, tente novamente em instantes ou entre em contato via telefone." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 w-full h-full z-[9999] flex items-center justify-center p-4 md:p-6">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
      />
      
      <div 
        className="relative w-full max-w-2xl h-[80vh] bg-zinc-950 border border-brand-gold/40 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
      >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif gold-gradient">Concierge Studio</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Atendimento Exclusivo AI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {messages.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-brand-gold text-black' : 'bg-white/5 text-brand-gold border border-white/10'}`}>
                      {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-brand-gold text-black font-medium rounded-tr-none' 
                        : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 items-center text-brand-gold/50 text-xs italic">
                    <Loader2 size={14} className="animate-spin" />
                    O Concierge está redigindo...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-white/5 bg-zinc-900/30">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Como posso ajudar com seu álbum hoje?"
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-brand-gold/30 transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-gold text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-[0.2em]">
                Top Line Studio • Inteligência Artificial de Design
              </p>
            </div>
      </div>
    </div>
  );
};

export default ConciergeChat;
