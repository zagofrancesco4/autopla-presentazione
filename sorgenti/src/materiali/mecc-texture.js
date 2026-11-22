// Micro-dettaglio del meccanismo come MAPPE (sez. 4): generate una volta sola sulla CPU (DataTexture, valide per
// entrambi i renderer), ripetibili, in millimetri: una piastrella di texture = 25,6 mm, 512 px → 20 px/mm.
// Le UV dei pezzi sono rifatte in mm per proiezione sull'asse dominante della normale (uvMillimetri).
import * as THREE from 'three';

export const PASSO_MM = 25.6;
const N = 512;

// rumore di valore periodico (si ripete esattamente sul bordo della texture)
function rumore(per, seme) {
  const g = new Float32Array(per * per); let s = seme * 9301 + 49297;
  for (let i = 0; i < g.length; i++) { s = (s * 9301 + 49297) % 233280; g[i] = s / 233280; }
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = g[((yi % per + per) % per) * per + ((xi % per + per) % per)], b = g[((yi % per + per) % per) * per + (((xi + 1) % per + per) % per)];
    const c = g[(((yi + 1) % per + per) % per) * per + ((xi % per + per) % per)], d = g[(((yi + 1) % per + per) % per) * per + (((xi + 1) % per + per) % per)];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}
// altezza h(u,v) in [0,1] su [0,1)² → normale (forza k) e ruvidità (1 ± var)
function genera(h, k, varR = 0, hr = null) {
  const H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) H[y * N + x] = h(x / N, y / N);
  const nd = new Uint8Array(N * N * 4), rd = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, dx = H[y * N + (x + 1) % N] - H[y * N + (x - 1 + N) % N], dy = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x];
    let nx = -dx * k, ny = -dy * k, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    nd[i * 4] = (nx * .5 + .5) * 255; nd[i * 4 + 1] = (ny * .5 + .5) * 255; nd[i * 4 + 2] = (nz * .5 + .5) * 255; nd[i * 4 + 3] = 255;
    const r = Math.max(0, Math.min(1, (1 - varR / 2) + varR * (hr ? hr(x / N, y / N) : H[i]))) * 255;
    rd[i * 4] = rd[i * 4 + 1] = rd[i * 4 + 2] = r; rd[i * 4 + 3] = 255;
  }
  const tex = d => { const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true; return t; };
  return { n: tex(nd), r: tex(rd) };
}

let LIB = null;
export function libreria() {
  if (LIB) return LIB;
  const r1 = rumore(64, 1), r2 = rumore(256, 2), r3 = rumore(32, 3), r4 = rumore(128, 4);
  const fbm = (f, x, y, o = 4) => { let s = 0, a = .5, m = 1; for (let i = 0; i < o; i++) { s += a * f(x * m, y * m); m *= 2; a *= .5; } return s; };
  LIB = {
    // alluminio spazzolato lungo u (asse del tubo)
    // (F10: righe a 0,2 mm invece di 0,1 mm e rilievo più basso: a incidenza radente, vista Lato, diventavano rumore)
    spazzolato: genera((u, v) => r2(u * 4, v * 128) * .7 + r4(u * 8, v * 64) * .3, 1.1, .22),
    // acciaio / zincato: segni di tornitura e grana fine
    tornito: genera((u, v) => .5 + .5 * Math.sin(v * Math.PI * 2 * 96) * .25 + fbm(r2, u * 64, v * 64, 3) * .6, .9, .22),
    // strati di stampa PETG: 0,2 mm → 128 strati in 25,6 mm, con leggera irregolarità
    strati: genera((u, v) => { const s = (v * 128) % 1; return Math.pow(Math.abs(Math.sin(Math.PI * s)), .6) * .85 + r1(u * 24, v * 128) * .15; }, 2.4, .25),
    // plastica stampata / nylon / gomma: grana opaca
    grana: genera((u, v) => fbm(r2, u * 96, v * 96, 3), 1.2, .3),
    // vernice: buccia d'arancia
    buccia: genera((u, v) => fbm(r1, u * 12, v * 12, 4), 2.2, .18),
    // anodizzato nero del motore: grana finissima
    anodizzato: genera((u, v) => fbm(r2, u * 160, v * 160, 2), .6, .2),
    // filetto: creste perpendicolari all'asse (passo 0,5 mm nel sistema UV del gambo)
    filetto: genera((u, v) => .5 + .5 * Math.sin(v * Math.PI * 2 * 51.2), 4.0, .15)
  };
  return LIB;
}

// tipo di materiale (REALE) → mappa e forza della normale
const PER_TIPO = {
  alluminio: ['spazzolato', .3], zincato: ['tornito', .35], acciaio: ['tornito', .45], cuscinetto: ['tornito', .2], ottone: ['tornito', .4],
  pom: ['grana', .25], pomNero: ['grana', .35], nema: ['anodizzato', .4], petg: ['strati', .35], petgPieno: ['strati', .6],
  verniciato: ['buccia', .35], nylon: ['grana', .5], morsetto: ['grana', .35], servo: ['grana', .3], scuro: ['grana', .45]
};
export function applicaTexture(m) {
  const t = m.userData && PER_TIPO[m.userData.tipo]; if (!t) return;
  const L = libreria()[t[0]];
  m.normalMap = L.n; m.normalScale = new THREE.Vector2(t[1], t[1]); m.roughnessMap = L.r; m.needsUpdate = true;
}
export function applicaFiletto(m) { const L = libreria().filetto; m.normalMap = L.n; m.normalScale = new THREE.Vector2(.9, .9); m.roughnessMap = L.r; m.needsUpdate = true; }

// UV in mm (diviso PASSO_MM) per proiezione sull'asse dominante della normale, in coordinate locali della geometria
export function uvMillimetri(geo) {
  if (!geo || geo.userData.uvmm || !geo.attributes.position) return;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let u, v; if (ay >= ax && ay >= az) { u = x; v = z; } else if (ax >= az) { u = z; v = y; } else { u = x; v = y; }
    uv[i * 2] = u / PASSO_MM; uv[i * 2 + 1] = v / PASSO_MM;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.userData.uvmm = true;
}
