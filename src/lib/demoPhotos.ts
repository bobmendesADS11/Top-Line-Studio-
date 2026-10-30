// Fotos de DEMONSTRAÇÃO usadas antes da compra (o formando ainda não tem as fotos oficiais).
// Para usar fotos próprias da Top Line, troque as URLs abaixo (podem ser de qualquer endereço público).
export interface DemoPhoto { id: string; url: string; thumbnail: string; aspectRatio: number }

const img = (id: string, portrait = false) => {
  const [w, h] = portrait ? [1000, 1500] : [1500, 1000];
  const base = `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80`;
  return { url: `${base}&w=${w}&h=${h}`, thumbnail: `${base}&w=${portrait ? 240 : 360}&h=${portrait ? 360 : 240}`, aspectRatio: w / h };
};

// Sequência narrativa: colação -> turma -> jantar -> baile
const LIST: [string, boolean][] = [
  ['photo-1627556704290-2b1f5853ff78', false], // turma jogando os capelos
  ['photo-1623461487986-9400110de28e', true],  // formanda com capelo
  ['photo-1525921429624-479b6a26d84d', true],  // formando de beca
  ['photo-1590012314607-cda9d9b699ae', false], // capelos na cerimônia
  ['photo-1559223607-a43c990c692c', false],    // auditório da colação
  ['photo-1541339907198-e08756dedf3f', false], // capelos ao alto
  ['photo-1607237138185-eedd9c632b0b', false], // campus
  ['photo-1591123120675-6f7f1aae0e5b', true],  // campus
  ['photo-1576267423445-b2e0074d68a4', false], // turma reunida
  ['photo-1543269865-cbf427effbad', true],     // amigas
  ['photo-1523580494863-6f3031224c94', false], // amigos
  ['photo-1511632765486-a01980e01a18', false], // amigos no pôr do sol
  ['photo-1529156069898-49953e39b3ac', true],  // turma abraçada
  ['photo-1511795409834-ef04bbd61622', false], // jantar de formatura
  ['photo-1519671482749-fd09be7ccebf', true],  // brinde
  ['photo-1464366400600-7168b8af9bc3', false], // salão do baile
  ['photo-1530103862676-de8c9debad1d', true],  // balões
  ['photo-1517457373958-b7bdd4587205', false], // festa
  ['photo-1470229722913-7c0e2dbbafd3', false], // show do baile
  ['photo-1505236858219-8359eb29e329', true],  // confete
  ['photo-1492684223066-81342ee5ff30', false], // pista de dança
];

export const DEMO_PHOTOS: DemoPhoto[] = LIST.map(([id, portrait], i) => ({ id: `demo${i + 1}`, ...img(id, portrait) }));
