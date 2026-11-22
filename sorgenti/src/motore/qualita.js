// Un solo livello di qualità: dettaglio pieno sul balcone, costi fissi e prevedibili.
export const PRESET = {
  Alta: { nome: 'Alta', prMax: 2, ombra: 2048, tex: 2048, render: { segmenti: 64, spigolo: 6, evolvente: 16 }, piante: 2, trasmissione: false }
};
export const TEST = new URLSearchParams(location.search).get('test') === '1';
export const qualita = { nome: 'Alta', p: PRESET.Alta };
