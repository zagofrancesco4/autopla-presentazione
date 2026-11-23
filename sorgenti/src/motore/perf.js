// Misura (?perf=1 badge, ?bench=1 orbita scriptata 10 s). I numeri validi vengono solo dal telefono reale.
// Nessuna allocazione per frame: buffer circolare preallocato, badge aggiornato 2 volte al secondo.
const q = new URLSearchParams(location.search);
export const PERF = q.get('perf') === '1';
export const BENCH = q.get('bench') === '1';
// flag on/off degli effetti (Modulo 5): attivi di default, spenti con ?<nome>=0 (es. ?perf=1&clearcoat=0)
export const FLAGS = { clearcoat: q.get('clearcoat') !== '0', a2c: q.get('a2c') !== '0', terracotta: q.get('terracotta') !== '0', contatto: q.get('contatto') !== '0', rim: q.get('rim') !== '0' };

const N = 1200, buf = new Float32Array(N), ord = new Float32Array(N);
let n = 0, i0 = 0, ultimo = 0, badge = null, prossimo = 0;

function percentile(cnt, p) {
  for (let k = 0; k < cnt; k++) ord[k] = buf[k];
  const s = ord.subarray(0, cnt).sort();
  return s[Math.min(cnt - 1, Math.floor(p * cnt))];
}
// t: timestamp del rAF; disegnato: il frame è stato disegnato
export function campiona(t, disegnato, renderer) {
  const dt = ultimo ? t - ultimo : 0; ultimo = t;
  if (!disegnato || !dt || dt > 250) return;
  buf[i0] = dt; i0 = (i0 + 1) % N; if (n < N) n++;
  if (!PERF || t < prossimo) return; prossimo = t + 500;
  if (!badge) { badge = document.createElement('div'); badge.id = 'perfBadge'; document.body.appendChild(badge); }
  const inf = renderer.info;
  badge.textContent = `${dt.toFixed(1)} ms · p95 ${percentile(n, .95).toFixed(1)} · calls ${inf.render.calls} · tri ${inf.render.triangles} · geo ${inf.memory.geometries} · tex ${inf.memory.textures} · DPR ${renderer.getPixelRatio().toFixed(2)}`;
}
export function p95() { return n ? percentile(n, .95) : 0; }
export function azzera() { n = 0; i0 = 0; }

// bench: orbita di 10 s attorno al target, redraw forzato; poi stampa p50/p95/max e % > 16,7 ms
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
    let over = 0, max = 0; for (let k = 0; k < n; k++) { if (buf[k] > 16.7) over++; if (buf[k] > max) max = buf[k]; }
    const r = { frame: n, p50: +percentile(n, .5).toFixed(2), p95: +percentile(n, .95).toFixed(2), max: +max.toFixed(2), sopra16_7: +(100 * over / Math.max(1, n)).toFixed(1) + '%' };
    console.log('[bench]', JSON.stringify(r)); window.__bench = r;
    const b = document.createElement('div'); b.id = 'perfBadge'; b.style.top = '40px'; b.textContent = 'bench ' + JSON.stringify(r); document.body.appendChild(b);
  }
  return true;
}
