// Tabela de preços única do site (usada pelo editor e pelo robô de ajuda).
export const PRICES = {
  edition: {
    link: 1200.0, // Link Studio (Digital)
    album: 1850.0, // Álbum físico + Link
  },
  photo: 45.0, // por foto sob curadoria
  size: {
    '20x30': 0,
    '30x30': 150,
    '30x40': 300,
  } as Record<string, number>,
  material: {
    standard: 0,
    premium: 350,
    leather: 550,
    acrylic: 950,
    velvet: 750,
    photo: 500,
  } as Record<string, number>,
  pagePackage: {
    20: 0,
    40: 400,
    60: 750,
    80: 1100,
  } as Record<number, number>,
};

export const SIZE_OPTIONS = ['20x30', '30x30', '30x40'] as const;
export const MATERIAL_OPTIONS = ['standard', 'premium', 'leather', 'acrylic', 'velvet', 'photo'] as const;
export const PAGE_OPTIONS = [20, 40, 60, 80] as const;

export const MATERIAL_INFO: Record<string, { label: string; description: string }> = {
  standard: { label: 'Padrão', description: 'Capa dura laminada fosca, clássica e resistente.' },
  premium: { label: 'Premium (linho)', description: 'Textura de linho com toque sofisticado.' },
  leather: { label: 'Couro', description: 'Couro trabalhado artesanalmente, um clássico atemporal.' },
  acrylic: { label: 'Acrílico', description: 'Capa em acrílico cristalino que dá profundidade e brilho à foto.' },
  velvet: { label: 'Veludo', description: 'Toque aveludado com detalhes em hot-stamping.' },
  photo: { label: 'Fotográfica', description: 'Sua foto impressa na capa inteira, em alta definição.' },
};

export const RECOMMENDED_PHOTOS: Record<number, number> = { 20: 30, 40: 60, 60: 90, 80: 120 };

export const formatBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function calcTotal(opts: { type: 'LINK' | 'FULL'; size: string; material: string; pages: number; photoCount: number }) {
  const photos = opts.photoCount * PRICES.photo;
  if (opts.type === 'LINK') {
    return { base: PRICES.edition.link, photos, size: 0, material: 0, pages: 0, total: PRICES.edition.link + photos };
  }
  const size = PRICES.size[opts.size] || 0;
  const material = PRICES.material[opts.material] || 0;
  const pages = PRICES.pagePackage[opts.pages] || 0;
  return { base: PRICES.edition.album, photos, size, material, pages, total: PRICES.edition.album + photos + size + material + pages };
}
