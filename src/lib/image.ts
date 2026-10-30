// Converte uma foto em JPEG redimensionado (data URL) que cabe num documento do Firestore.
// Antes, fotos maiores que ~650 KB eram descartadas em silêncio — quase toda foto de celular.
const MAX_DATA_URL_CHARS = 900_000; // limite do documento do Firestore é ~1 MB

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Não foi possível ler a imagem ${file.name}`)); };
    img.src = url;
  });

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  for (const maxSide of [2000, 1600, 1280, 1024, 800]) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.65]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
    }
  }
  throw new Error(`A imagem ${file.name} é grande demais mesmo após compressão.`);
}
