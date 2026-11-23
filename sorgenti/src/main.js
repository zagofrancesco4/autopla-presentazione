// Avvio di Autopla v2: presentazione → meccanismo → ambiente.
import './ui/stile/stile.css';
import * as THREE from 'three';
import { $ } from './util.js';
import * as CFG from './dati/config.js';
import { CONFIG } from './dati/config.js';
import * as PARTI from './dati/parti.js';
import { scene, camera, controls, renderer, pipeline } from './motore/renderer.js';
import * as BAL from './scene/balcone.js';
import * as UI from './ui/presentazione.js';
import * as Mecc from './meccanismo/mecc.js';
import { integra } from './meccanismo/integrazione.js';
import * as AMBI from './ambiente/ambiente.js';
import { qualita, TEST } from './motore/qualita.js';
import { Fuoco } from './focus/selezione.js';
import { FLAGS } from './motore/perf.js';
import { aggiungiRim } from './materiali/rim.js';
import { renderables } from './ui/presentazione.js';

// qualità grafica del gemello (CONFIG.render: solo segmenti, spigolo, evolvente)
Object.assign(CONFIG.render, qualita.p.render);

UI.initPresentazione();
UI.avvia();

// vista di dettaglio del gemello: chunk separato, caricato al primo uso
let G = null, caricamento = null;
export function gemello() { return caricamento || (caricamento = import('./scene/gemello.js').then(m => (G = m))); }

Mecc.build();
const AUTOPLA = window.AUTOPLA = {
  CONFIG, rebuild: Mecc.build,
  open: () => gemello().then(g => g.open()),
  close: () => { if (G) G.close(); else { $('mech').hidden = true; if (location.hash === '#meccanismo') history.replaceState(null, '', location.pathname + location.search); } },
  view: (n, i) => gemello().then(g => g.view(n, i)),
  colori: Mecc.setModo, braccetto: Mecc.setArm, animazione: Mecc.toggleAnim, esploso: Mecc.toggleEsploso,
  sezione: () => gemello().then(g => g.toggleSezione()), eccentrico: () => gemello().then(g => g.toggleEcc()), reset: () => gemello().then(g => g.reset()),
  get risultati() { return Mecc.results; }, get quote() { return Mecc.quote(); }, get stato() { return Mecc.ST; }
};
if (location.hash === '#meccanismo') AUTOPLA.open();
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('mech').hidden) AUTOPLA.close(); });
addEventListener('hashchange', () => { if (location.hash === '#meccanismo') AUTOPLA.open(); });

integra();
AMBI.initAmbiente();
// luce di contorno della parte selezionata: presente dal primo fotogramma (intensità 0)
// v3: con il rim fresnel (default, ?rim=0 per tornare alla luce) la luce di contorno non entra nella scena
const luceContorno = new THREE.DirectionalLight(0xffffff, 0); if (!FLAGS.rim) scene.add(luceContorno, luceContorno.target);
if (FLAGS.rim) for (const o of renderables) if (o.isMesh) { const ms = Array.isArray(o.userData.orig) ? o.userData.orig : [o.userData.orig]; ms.forEach(aggiungiRim); }
UI.impostaFuoco(new Fuoco(renderer, scene, camera, luceContorno, FLAGS.rim));
UI.richiedi();

window.__tempi = window.__tempi || {};
requestAnimationFrame(() => requestAnimationFrame(() => {
  window.__tempi.interattiva = performance.now();
  const pb = document.getElementById('posterBox'); if (pb) { pb.style.transition = 'opacity .4s'; pb.style.opacity = '0'; setTimeout(() => pb.remove(), 450); }
  // gemello: chunk precaricato quando il browser è inattivo
  (window.requestIdleCallback || setTimeout)(() => gemello());
}));

// verifica: fotogrammi disegnati dalla presentazione e piante dentro i vasi
window.__verifica = { get fotogrammi() { return pipeline.fotogrammi; }, piante: () => AMBI.verificaPiante() };

// modalità test (?test=1): interni esposti per gli script di verifica
if (TEST) {
  const cost = {};
  for (const k of ['RAIL_Y', 'RAIL_Z', 'RAIL_X0', 'RAIL_X1', 'PUL_Y', 'PUL_R', 'MOT_X', 'IDL_X', 'WIRE_Y', 'WIRE_Z', 'HOSE_Y', 'POT_Z', 'POTS', 'GHOST_X', 'HOME', 'PIVOT_Y', 'PIVOT_Z',
    'ARM_L', 'ARM_DEG', 'CLAMPS', 'SECTION_X', 'RAIL_BAR_R', 'ML_VASO', 'N_RINGS', 'DROPS', 'MURO', 'SOLETTA', 'PIANTE', 'FORME_VASO', 'CIELO']) cost[k] = CFG[k];
  window.__int = Object.assign({
    scene, camera, controls, renderer, CONFIG, BALCONE: AMBI.BALCONE,
    PARTS: PARTI.PARTS, STEPS: PARTI.STEPS, TAP_ORDER: PARTI.TAP_ORDER, EXTRA_TAP: PARTI.EXTRA_TAP, BOXKEYS: PARTI.BOXKEYS, GENERAL: PARTI.GENERAL, SW: PARTI.SW, INQ: AMBI.INQ,
    compsByKey: BAL.compsByKey, labels: BAL.labels, Mecc, S: UI.S, select: UI.select, inquadratura: AMBI.inquadratura, MOBILE: AMBI.MOBILE, AMB: AMBI.AMB, DEV: PARTI.DEV,
    flyTo: UI.flyTo, fitDist: UI.fitDist, updateCycle: UI.updateCycle, startCycle: UI.startCycle,
    get current() { return UI.current; }, get tween() { return UI.statoInterno.tween; }, get explodeT() { return UI.statoInterno.explodeT; },
    pipeline, qualita, gemello, ghostMat: UI.ghostMat
  }, cost);
}
