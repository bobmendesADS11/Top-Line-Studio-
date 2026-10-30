// Contato oficial da Top Line (WhatsApp). Usado no lugar do antigo chat de IA.
export const COMPANY_WHATSAPP = '5548991764001';

export const openWhatsApp = (message?: string) => {
  const text = message || 'Olá! Gostaria de falar com a equipe da Top Line Studio.';
  window.open(`https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};
