import { GoogleGenAI } from '@google/genai';

// Função de servidor (Vercel): a chave do Gemini fica só aqui, nunca vai pro navegador.
const SYSTEM_INSTRUCTION = `Você é o Especialista Concierge da Top Line Studio, uma empresa de luxo focada em formaturas premium. 
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
          - Seja breve mas impactante.`;

type ChatMessage = { role: 'user' | 'model'; text: string };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY não configurada' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const message = String(body.message || '').slice(0, 2000).trim();
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-20) : [];
  if (!message) {
    res.status(400).json({ error: 'Mensagem vazia' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: [
        ...history
          .filter(m => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
          .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 2000) }] })),
        { role: 'user', parts: [{ text: message }] },
      ],
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.7 },
    });
    res.status(200).json({ text: response.text || '' });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(502).json({ error: 'Falha ao gerar resposta' });
  }
}
