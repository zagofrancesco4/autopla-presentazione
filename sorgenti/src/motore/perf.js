// Misura (?perf=1 badge, ?bench=1 orbita scriptata 10 s). I numeri validi vengono solo dal telefono reale.
// Nessuna allocazione per frame: buffer circolare preallocato, badge aggiornato 2 volte al secondo.
import { qualita } from './qualita.js';
const q = new URLSearchParams(location.search);
const TIER = 'tier ' + qualita.nome;
export const PERF = q.get('perf') === '1';
export const BENCH = q.get('bench') === '1';
// diagnosi da telefono (?diag=1, motore/diag.js): agganci chiamati da frame() solo se assegnati
export const DIAG = q.get('diag') === '1';
export const DIAG_H = { passo: null, fine: null };
// ?riposo3=1: a scena ferma da 0,4 s un frame a min(devicePixelRatio, 3), al primo pointerdown di nuovo al DPR di moto
export const RIPOSO3 = q.get('riposo3') === '1';
// stato del governor DPR (scritto da renderer.js, mostrato da ?perf=1)
export const GOV = { cambi: 0, ultimo: '—' };
// zoom della camera rispetto all'inquadratura (fattore, impostato dalla presentazione), mostrato da ?perf=1
export const VISTA_PERF = { fattore: null };
// flag on/off degli effetti (Modulo 5): attivi di default, spenti con ?<nome>=0 (es. ?perf=1&clearcoat=0)
export const FLAGS = { clearcoat: q.get('clearcoat') !== '0', a2c: q.get('a2c') !== '0', terracotta: q.get('terracotta') !== '0', contatto: q.get('contatto') !== '0', rim: q.get('rim') !== '0', aa: q.get('aa') !== '0' };   // aa: antialias del canvas (solo alla creazione del contesto)

const N = 1200, buf = new Float32Array(N), ord = new Float32Array(N);
let n = 0, i0 = 0, ultimo = 0, badge = null, prossimo = 0;

// intervallo di vsync misurato: mediana degli ultimi 64 intervalli rAF (anche dei frame non disegnati), ricalcolata
// al più una volta al secondo, senza allocazioni. Un frame è "lento" se supera 1,5 × vsync (≈ 25 ms a 60 Hz).
const NV = 64, bv = new Float32Array(NV), ov = new Float32Array(NV);
let nv = 0, iv = 0, vs = 1000 / 60, prossimoV = 0, ultimoV = 0;
function vsyncPasso(t) {
  const d = ultimoV ? t - ultimoV : 0; ultimoV = t;
  if (d > 4 && d < 60) { bv[iv] = d; iv = (iv + 1) % NV; if (nv < NV) nv++; }
  if (nv === NV && t >= prossimoV) { prossimoV = t + 1000; ov.set(bv); ov.sort(); vs = (ov[NV / 2 - 1] + ov[NV / 2]) / 2; }
}
export const vsync = () => vs;
export const sogliaLento = () => 1.5 * vs;

function percentile(cnt, p) {
  for (let k = 0; k < cnt; k++) ord[k] = buf[k];
  const s = ord.subarray(0, cnt).sort();
  return s[Math.min(cnt - 1, Math.floor(p * cnt))];
}
// t: timestamp del rAF; disegnato: il frame è stato disegnato
export function campiona(t, disegnato, renderer) {
  vsyncPasso(t);
  const dt = ultimo ? t - ultimo : 0; ultimo = t;
  if (!disegnato || !dt || dt > 250) return;
  buf[i0] = dt; i0 = (i0 + 1) % N; if (n < N) n++;
  if (!PERF || t < prossimo) return; prossimo = t + 500;
  if (!badge) creaBadge(renderer);
  const inf = renderer.info;
  badgeRiga1.textContent = `${dt.toFixed(1)} ms · p95 ${percentile(n, .95).toFixed(1)} · calls ${inf.render.calls} · tri ${inf.render.triangles} · geo ${inf.memory.geometries} · tex ${inf.memory.textures} · DPR ${renderer.getPixelRatio().toFixed(2)} · gov ${GOV.cambi}: ${GOV.ultimo}`;
  rigaVista();
}
// badge ?perf=1: riga 1 = frame (aggiornata solo dai frame disegnati), riga 2 = vista (zoom della PAGINA, orientamento,
// canvas): aggiornata anche a scena ferma da resize / visualViewport, per distinguere zoom della pagina da zoom della camera.
let badgeRiga1 = null, badgeRiga2 = null, badgeRiga3 = null, testoRiga3 = '', rendererB = null;
// riga 3 del badge: misure di ?riposo3=1 (scritta dalla presentazione quando una misura è completa)
export function rigaRiposo(t) { testoRiga3 = t; if (badgeRiga3) badgeRiga3.textContent = t; }
function creaBadge(renderer) {
  rendererB = renderer;
  badge = document.createElement('div'); badge.id = 'perfBadge';
  badgeRiga1 = document.createElement('div'); badgeRiga2 = document.createElement('div'); badgeRiga3 = document.createElement('div'); badge.append(badgeRiga1, badgeRiga2, badgeRiga3);
  badgeRiga3.textContent = testoRiga3;
  document.body.appendChild(badge);
  const vv = window.visualViewport;
  if (vv) { vv.addEventListener('resize', rigaVista); vv.addEventListener('scroll', rigaVista); }
  addEventListener('resize', rigaVista); addEventListener('orientationchange', rigaVista);
  rigaVista();
}
export function rigaVista() {
  if (!badgeRiga2) return;
  const vv = window.visualViewport, cv = rendererB.domElement;
  const or = (screen.orientation && screen.orientation.type) || (matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait');
  badgeRiga2.textContent = `pagina ×${vv ? vv.scale.toFixed(2) : '?'}${vv && Math.abs(vv.scale - 1) > .01 ? ' (ZOOM PAGINA)' : ''} · ${or} · finestra ${innerWidth}×${innerHeight}` +
    ` · zoom camera ×${VISTA_PERF.fattore ? VISTA_PERF.fattore().toFixed(2) : '?'} · canvas ${cv.clientWidth}×${cv.clientHeight} CSS → ${cv.width}×${cv.height} px · DPR ${rendererB.getPixelRatio()} (disp. ${devicePixelRatio}) · ${TIER}`;
}
export function p95() { return n ? percentile(n, .95) : 0; }
export function azzera() { n = 0; i0 = 0; }

// bench: orbita di 10 s attorno al target, redraw forzato; poi stampa p50/p95/max e % di frame lenti (> 1,5 × vsync)
let bench = null;
export function benchPasso(t, camera, controls, richiedi) {
  if (!BENCH) return false;
  if (!bench) { bench = { t0: t + 1000, fine: t + 11000, r: camera.position.distanceTo(controls.target), y: camera.position.y - controls.target.y, fatto: false }; }
  if (bench.fatto) return false;
  if (t < bench.t0) { richiedi(); return true; }
  if (!bench.avviato) { bench.avviato = true; azzera(); }
  const a = (t - bench.t0) / 10000 * Math.PI * 2 * .25 + .2, c = controls.target;
  camera.position.set(c.x + Math.sin(a) * bench.r * .8, c.y + bench.y, c.z + Math.cos(a) * bench.r * .8);
  richiedi();
  if (t >= bench.fine) {
    bench.fatto = true;
    const sl = sogliaLento(); let over = 0, lenti = 0, max = 0; for (let k = 0; k < n; k++) { if (buf[k] > 16.7) over++; if (buf[k] > sl) lenti++; if (buf[k] > max) max = buf[k]; }
    const r = { frame: n, vsync: +vs.toFixed(2), p50: +percentile(n, .5).toFixed(2), p95: +percentile(n, .95).toFixed(2), max: +max.toFixed(2), lenti: +(100 * lenti / Math.max(1, n)).toFixed(1) + '%', sogliaLento: +sl.toFixed(1), sopra16_7: +(100 * over / Math.max(1, n)).toFixed(1) + '%' };
    console.log('[bench]', JSON.stringify(r)); window.__bench = r;
    const b = document.createElement('div'); b.id = 'perfBadge'; b.style.top = '40px'; b.textContent = 'bench ' + JSON.stringify(r); document.body.appendChild(b);
  }
  return true;
}
