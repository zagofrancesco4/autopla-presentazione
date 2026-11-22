// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import { V } from '../util.js';
import { RAIL_Z, POT_Z, WIRE_Z, ARM_DEG, POTS, HOME } from '../dati/config.js';

// righe 783-851
/* Le parti */
export const BOXKEYS = ['box', 'involucro', 'coperchio', 'guarnizione', 'attacco_rotaia', 'attacco_cinghia', 'valvola', 'servo', 'pressacavi', 'braccetto'];
export const SW = { ringhiera: '#3b4047', rotaia: '#e8771c', box: '#ffffff', acqua: '#2a7de1', cavo: '#16181b', elet: '#1fa45a', vaso: '#c4683f', grigio: '#8b929b' };
export const PARTS = [
  {
    id: 'rotaia', n: 1, chip: 'Rotaia', title: 'Rotaia',
    sub: 'Tubo quadro 40×40 con cremagliera, fissato sui ferri della ringhiera con staffe e fascette, senza fori.',
    keys: ['tubo_al', 'cremagliera', 'staffe', 'fc0', 'fc1', 'ringhiera'], ctx: ['pavimento'], mode: 'ghost',
    cam: { t: V(62, 74, 3), d: V(.5, .38, .82), w: 64, h: 42 }, dot: V(158, 76.5, RAIL_Z),
    pz: [['tubo_al', SW.grigio, 'Tubo 40×40'], ['cremagliera', SW.rotaia, 'Cremagliera'], ['staffe', SW.grigio, 'Staffe e fascette'], ['fc0', SW.elet, 'Finecorsa 1'], ['fc1', SW.elet, 'Finecorsa 2'], ['ringhiera', SW.ringhiera, 'Ringhiera']]
  },
  {
    id: 'cinghia', n: 2, chip: 'Cremagliera', title: 'Cremagliera e motore',
    sub: 'Il motore sulla box fa girare un pignone sulla cremagliera: 62,8 mm di corsa per giro.',
    keys: ['carrello', 'cremagliera'], ctx: ['tubo_al', 'staffe'], mode: 'ghost',
    cam: { t: V(107, 78, 3), d: V(.22, .18, 1), w: 168, h: 34 }, dot: V(120, 85.5, RAIL_Z),
    pz: [['carrello', '#e8771c', 'Box con motore e pignone'], ['cremagliera', SW.rotaia, 'Cremagliera']]
  },
  {
    id: 'box', n: 3, chip: 'Box', title: 'Box',
    sub: 'Piccola scatola stagna che porta l\'acqua sopra ogni vaso.',
    keys: BOXKEYS, ctx: [], mode: 'solo', pose: [100, 0], explode: true,
    cam: { t: null, d: V(.25, .22, .95), w: 44, h: 46 }, dotObj: 'box',
    pz: [['involucro', '#ffffff', 'Involucro'], ['coperchio', '#ffffff', 'Coperchio'], ['guarnizione', '#4c525b', 'Guarnizione'], ['attacco_rotaia', SW.grigio, 'Attacco rotaia'], ['attacco_cinghia', SW.grigio, 'Attacco cinghia'], ['valvola', SW.acqua, 'Valvola'], ['servo', SW.elet, 'Servo'], ['pressacavi', SW.cavo, 'Pressacavi'], ['braccetto', SW.acqua, 'Braccetto']]
  },
  {
    id: 'braccetto', n: 4, chip: 'Braccetto', title: 'Braccetto',
    sub: 'Si abbassa e versa l\'acqua al centro del vaso.',
    keys: ['braccetto', 'servo'], ctx: [], mode: 'section', pose: [100, ARM_DEG],
    cam: { t: V(100, 56, 12), d: V(1, .02, 0), w: 60, h: 104 }, dotObj: 'arm',
    pz: [['braccetto', SW.acqua, 'Braccetto'], ['servo', SW.elet, 'Servo']]
  },
  {
    id: 'filo', n: 5, chip: 'Filo e tubo', title: 'Filo, tubo e cavo',
    sub: 'Tubo e cavo seguono la box appesi ad anelli su un filo.',
    keys: ['cavetto', 'tubo', 'cavo', 'avvolgitubo'], ctx: ['ringhiera', 'rotaia', 'cinghia', 'pavimento', ...BOXKEYS], mode: 'ghost', pose: [130, 0],
    cam: { t: V(78, 58, 5), d: V(.45, .3, .9), w: 104, h: 46 }, dot: V(95, 52, WIRE_Z),
    pz: [['cavetto', SW.grigio, 'Filo e anelli'], ['tubo', SW.acqua, 'Tubo'], ['cavo', SW.cavo, 'Cavo'], ['avvolgitubo', SW.grigio, 'Avvolgitubo']]
  },
  {
    id: 'stazione', n: 6, chip: 'Stazione', title: 'Stazione base',
    sub: 'Acqua in basso, elettronica in alto.',
    keys: ['stazione', 'serbatoio', 'pompa', 'vano', 'centralina', 'driver', 'alimentatore', 'fusibile', 'presa', 'avvolgitubo'],
    ctx: ['pavimento', 'porta', 'ringhiera', 'tubo', 'cavo'], mode: 'ghost',
    cam: { t: V(19, 52, 16), d: V(.78, .32, .8), w: 58, h: 112 }, dot: V(19, 102, 16),
    pz: [['serbatoio', SW.acqua, 'Serbatoio'], ['pompa', SW.acqua, 'Pompa'], ['avvolgitubo', SW.grigio, 'Avvolgitubo'], ['vano', '#e6ecf1', 'Vano elettronica'], ['centralina', SW.elet, 'Centralina'], ['driver', SW.elet, 'Driver motore'], ['alimentatore', SW.elet, 'Alimentatore'], ['fusibile', SW.elet, 'Fusibile'], ['presa', '#f7f7f5', 'Presa']]
  },
  {
    id: 'vasi', n: 7, chip: 'Vasi', title: 'Vasi',
    sub: 'Tre vasi lungo la ringhiera, con posto per un quarto.',
    keys: ['vaso1', 'vaso2', 'vaso3', 'ghost'], ctx: [], mode: 'top',
    cam: { t: V(108, 0, 24), d: V(0, 1, .55), w: 150, h: 72 }, dot: V(100, 34, POT_Z),
    pz: [['vaso1', SW.vaso, 'Vaso 1'], ['vaso2', SW.vaso, 'Vaso 2'], ['vaso3', SW.vaso, 'Vaso 3'], ['ghost', '#f3d8cc', 'Vaso in più']]
  }
];
// presentazione (senza ?dev=1): la vecchia box non compare; "Box" apre il dettaglio 3D del meccanismo nuovo
export const DEV = new URLSearchParams(location.search).get('dev') === '1';
if (!DEV) {
  PARTS.splice(PARTS.findIndex(p => p.id === 'braccetto'), 1);
  Object.assign(PARTS.find(p => p.id === 'box'), { apri: true, title: 'Box', sub: 'Apre il dettaglio 3D del meccanismo.' });
  PARTS.forEach((p, i) => { p.n = i + 1; });
}
export function pzHtml(list) {
  return '<div class="pzs">' + list.map(([key, color, name]) =>
    `<button class="pz" data-k="${key}"><span class="sw" style="background:${color}"></span>${name}</button>`).join('') + '</div>';
}
export const PART = Object.fromEntries(PARTS.map(p => [p.id, p]));
export const TAP_ORDER = ['braccetto', 'rotaia', 'cinghia', 'box', 'filo', 'stazione', 'vasi'].filter(id => PART[id]);
export const EXTRA_TAP = { porta: 'stazione', pavimento: null };

// righe 903-913
export const STEPS = [{ t: 'home', dur: 1.6, title: 'Partenza' }];
POTS.forEach((x, i) => {
  const n = i + 1;
  STEPS.push({ t: 'move', to: x, title: `Verso il vaso ${n}` });
  STEPS.push({ t: 'stop', dur: .8, title: `Al vaso ${n}` });
  STEPS.push({ t: 'down', dur: 1.2, title: 'Braccetto giù', pot: i });
  STEPS.push({ t: 'water', dur: 4, title: `Acqua al vaso ${n}`, pot: i });
  STEPS.push({ t: 'up', dur: 1, title: 'Braccetto su', pot: i });
});
STEPS.push({ t: 'move', to: HOME, title: 'Ritorno alla base' });
STEPS.push({ t: 'done', dur: .01, title: 'Ciclo completato' });

// riga 971
export const GENERAL = { t: V(100, 52, 30), d: V(.75, .5, .85), w: 175, h: 140 };
