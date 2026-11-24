// Livelli di qualità: desktop pieno, mobile (pointer coarse o schermo < 768 px) più leggero.
// Fase 3: su mobile DPR fisso = min(devicePixelRatio, prMax), uguale a riposo e in movimento (renderer.js).
// prMax 2 DEFINITIVO (?diag=1 su iPhone 16e: DPR 2 tutto acceso 0 % frame lenti; 2,5 → 7,3 %; 3 → 17 %, CPU invariata 5 ms
// → limite GPU). 2,5 e 3 restano solo come righe P/Q della diagnosi; il DPR 3 a scena ferma si prova con ?riposo3=1.
export const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
export const PRESET = {
  Alta: { nome: 'Alta', prMax: 2, ombra: 2048, tex: 2048, pxM: 1024, render: { segmenti: 64, spigolo: 6, evolvente: 16 }, piante: 2, trasmissione: false },
  Mobile: { nome: 'Mobile', prMax: 2, ombra: 2048, tex: 2048, pxM: 1024, render: { segmenti: 64, spigolo: 6, evolvente: 16 }, piante: 2, trasmissione: false }
};
export const TEST = new URLSearchParams(location.search).get('test') === '1';
const nome = MOBILE ? 'Mobile' : 'Alta';
export const qualita = { nome, p: PRESET[nome] };
