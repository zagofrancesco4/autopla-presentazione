// Livelli di qualità: desktop pieno, mobile (pointer coarse o schermo < 768 px) più leggero.
export const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
export const PRESET = {
  Alta: { nome: 'Alta', prMax: 2, ombra: 2048, tex: 2048, pxM: 1024, render: { segmenti: 64, spigolo: 6, evolvente: 16 }, piante: 2, trasmissione: false },
  Mobile: { nome: 'Mobile', prMax: 1.5, ombra: 1024, tex: 1024, pxM: 512, render: { segmenti: 64, spigolo: 6, evolvente: 16 }, piante: 2, trasmissione: false }
};
export const TEST = new URLSearchParams(location.search).get('test') === '1';
const nome = MOBILE ? 'Mobile' : 'Alta';
export const qualita = { nome, p: PRESET[nome] };
