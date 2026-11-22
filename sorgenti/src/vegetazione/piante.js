// Vasi, terriccio e piante (sez. 9). Unità: mm (gruppo 'ambiente', scala 0,1).
// - vasi: profili FORME_VASO invariati; terracotta porosa (foto CC0 Clay005) con bordo più scuro ed efflorescenze lievi,
//   plastica satinata con linea di stampo; spessore della parete visibile sul bordo;
// - terriccio: zolle (dischi deformati), foto CC0 Ground048, sassolini; si scurisce e diventa lucido con i ml ricevuti;
// - piante: una specie diversa per vaso, foglie fotografiche CC0 (ambientCG LeafSet) instanziate, 3 LOD,
//   vento nel vertex shader (solo rasterizzatore; il path tracer usa la posa ferma), traslucenza controluce in Ultra.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { qualita } from '../motore/qualita.js';
import { caricaTerna } from '../materiali/generatori.js';

const base = import.meta.env.BASE_URL + 'asset/tex/';
const TL = new THREE.TextureLoader();
let seme = 11; const rnd = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
export const VENTO = { tempo: { value: 0 }, ampiezza: { value: 7 }, traslucenza: { value: qualita.p.piante >= 3 ? .55 : .25 } };
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RIDOTTO) VENTO.ampiezza.value = 0;

// ---------- materiali ----------
function segnaposto(r, g, b, a = 255, srgb = false) { const d = new THREE.DataTexture(new Uint8Array([r, g, b, a]), 1, 1); d.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; d.needsUpdate = true; return d; }
function materialeFoglie(nome) {
  const m = new THREE.MeshStandardMaterial({ map: segnaposto(90, 130, 60, 255, true), normalMap: segnaposto(128, 128, 255), roughnessMap: segnaposto(200, 200, 200), roughness: .85, metalness: 0, alphaTest: .5, side: THREE.DoubleSide });
  m.name = 'foglie-' + nome;
  Promise.all(['c', 'n', 'r'].map(k => TL.loadAsync(`${base}foglie-${nome}-${k}.webp`))).then(([c, n, r]) => {
    c.colorSpace = THREE.SRGBColorSpace; for (const t of [c, n, r]) t.anisotropy = 8;
    m.map = c; m.normalMap = n; m.roughnessMap = r; m.needsUpdate = false;
  });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { ventoTempo: VENTO.tempo, ventoAmp: VENTO.ampiezza, traslucenza: VENTO.traslucenza });
    sh.vertexShader = 'uniform float ventoTempo, ventoAmp;\n' + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      // vento: spostamento orizzontale che cresce con il quadrato dell'altezza sopra il terriccio, raffiche lente
      float hv = clamp(mvPosition.y / 170., 0., 1.);
      float fase = mvPosition.x * .011 + mvPosition.z * .007;
      vec2 sv = vec2(sin(ventoTempo * 1.1 + fase) * .7 + sin(ventoTempo * 2.7 + fase * 3.) * .3, cos(ventoTempo * .8 + fase * 1.7) * .4);
      mvPosition.xz += sv * ventoAmp * (.35 + .65 * (.5 + .5 * sin(ventoTempo * .31))) * hv * hv;
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = 'uniform float traslucenza;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      #if NUM_DIR_LIGHTS > 0
        // traslucenza controluce: il sole dietro la foglia la illumina attraverso (colore della foglia, verde più caldo)
        float bl = max(0., dot(-normal, directionalLights[0].direction));
        reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(.9, 1., .55) * directionalLights[0].color * bl * traslucenza * .35;
      #endif`);
  };
  return m;
}

// ---------- geometrie delle foglie: carta curva con UV in una cella dell'atlante ----------
// cella: [u0, v0, u1, v1]; la base della foglia (picciolo) sta in y = 0, la punta in y = 1
function cartaFoglia(cella, piega = .18, curva = .22, orizzontale = false) {
  const g = new THREE.PlaneGeometry(1, 1, 2, 4); g.translate(0, .5, 0);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.abs(x) * piega + y * y * curva);                   // piega sulla nervatura e curvatura verso il basso
    let u = uv.getX(i), v = uv.getY(i);
    if (orizzontale) { const t = u; u = v; v = t; u = 1 - u; }         // atlante con i rametti in orizzontale
    uv.setXY(i, cella[0] + u * (cella[2] - cella[0]), cella[1] + v * (cella[3] - cella[1]));
  }
  g.computeVertexNormals(); return g;
}
const griglia3 = () => { const c = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) c.push([k / 3 + .01, r / 3 + .01, (k + 1) / 3 - .01, (r + 1) / 3 - .01]); return c; };

// ---------- specie ----------
// ogni funzione restituisce { foglie: [{ cella, m: Matrix4 }], steli: [BufferGeometry] } in coordinate del vaso (origine al centro del terriccio)
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function foglia(lista, cella, pos, yaw, incl, rollio, scala) {
  _e.set(incl, yaw, rollio, 'YXZ'); _q.setFromEuler(_e); lista.push({ cella, m: new THREE.Matrix4().compose(pos.clone(), _q.clone(), new THREE.Vector3(scala * .62, scala, scala)) });
}
function stelo(steli, punti, r) { steli.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(punti), Math.max(4, punti.length * 3), r, 5, false)); }

function basilico(hMax, rMax, dens) {
  const F = [], S = [], celle = griglia3(), nSteli = 7 + Math.round(dens * 3);
  for (let s = 0; s < nSteli; s++) {
    const a = s / nSteli * Math.PI * 2 + rnd() * .5, lean = .15 + rnd() * .25, h = hMax * (.6 + rnd() * .4);
    const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push(new THREE.Vector3(Math.cos(a) * (8 + t * h * lean), t * h, Math.sin(a) * (8 + t * h * lean))); }
    stelo(S, pts, 2.2);
    const nodi = 4 + Math.round(dens * 2);
    for (let n = 1; n <= nodi; n++) {
      const t = .2 + .8 * n / nodi, c = new THREE.CatmullRomCurve3(pts).getPoint(t), sc = (66 - 22 * t) * (.85 + rnd() * .3);
      for (const lato of [0, Math.PI]) foglia(F, celle[Math.floor(rnd() * 9)], c, a + lato + n * Math.PI / 2 + (rnd() - .5) * .4, 1.05 + rnd() * .3 - t * .35, (rnd() - .5) * .3, sc);
    }
    // ciuffo apicale
    const top = pts[5]; for (let k = 0; k < 3; k++) foglia(F, celle[Math.floor(rnd() * 9)], top, rnd() * 6.28, .25 + rnd() * .3, 0, 26 + rnd() * 10);
  }
  return { foglie: F, steli: S };
}
function rosmarino(hMax, rMax, dens) {
  const F = [], S = [], celle = [[0, .03, 1, .3], [0, .36, 1, .66], [0, .69, 1, .97]], n = 22 + Math.round(dens * 16);
  for (let k = 0; k < n; k++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * rMax * .55, L = hMax * (.6 + rnd() * .4);
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), yaw = rnd() * 6.28, incl = .08 + r / rMax * .45 + rnd() * .1;
    const c = celle[Math.floor(rnd() * 3)];
    foglia(F, c, p, yaw, incl, 0, L); foglia(F, c, p, yaw + Math.PI / 2, incl, 0, L);       // carte incrociate: volume
    const tip = new THREE.Vector3(0, L * .95, 0).applyEuler(new THREE.Euler(incl, yaw, 0, 'YXZ')).add(p);
    stelo(S, [p, p.clone().lerp(tip, .5), tip], 1.6);
  }
  return { foglie: F, steli: S, larghe: .34 };
}
function edera(hMax, rMax, dens, rBordo, hBordo) {
  // cespo compatto: tralci che salgono e si incurvano verso il bordo, sempre dentro il vaso e sopra il terriccio
  const F = [], S = [], celle = griglia3(), n = 6 + Math.round(dens * 2), rL = Math.min(rMax, rBordo * .82);
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + rnd() * .4, h = hMax * (.55 + rnd() * .3), pts = [];
    for (const [fr, fy] of [[.1, 0], [.4, .55], [.75, .95], [1, .7]]) pts.push(new THREE.Vector3(Math.cos(a) * rL * fr, h * fy, Math.sin(a) * rL * fr));
    const cv = new THREE.CatmullRomCurve3(pts); stelo(S, cv.getPoints(10), 1.4);
    const nf = 7 + Math.round(dens * 4);
    for (let i = 1; i <= nf; i++) { const t = i / (nf + 1), c = cv.getPoint(t), tg = cv.getTangent(t); foglia(F, celle[Math.floor(rnd() * 9)], c, Math.atan2(tg.x, tg.z) + (i % 2 ? 1.2 : -1.2), .7 + rnd() * .4, (rnd() - .5) * .4, 34 + rnd() * 12); }
  }
  // ciuffo centrale basso
  for (let k = 0; k < 12 + dens * 6; k++) foglia(F, celle[Math.floor(rnd() * 9)], new THREE.Vector3((rnd() - .5) * rL, 6 + rnd() * 20, (rnd() - .5) * rL), rnd() * 6.28, .5 + rnd() * .4, 0, 36 + rnd() * 12);
  return { foglie: F, steli: S };
}
export const SPECIE = [
  { nome: 'basilico', foglie: 'basilico', fn: basilico, steloColore: 0x5d7a35 },
  { nome: 'rosmarino', foglie: 'rosmarino', fn: rosmarino, steloColore: 0x5b5236 },
  { nome: 'edera', foglie: 'edera', fn: edera, steloColore: 0x4e5a2c }
];

// costruisce la pianta del vaso i: LOD con 3 livelli (tutte le foglie, metà, un quarto)
export function creaPianta(i, { hMax, rMax, rBordo, hBordo }) {
  const sp = SPECIE[i % SPECIE.length], dens = [.4, .7, 1, 1][qualita.p.piante] ?? 1;
  seme = 11 + i * 97;
  const d = sp.fn(hMax, rMax, dens, rBordo, hBordo), mat = materialeFoglie(sp.foglie);
  const lod = new THREE.LOD(); lod.name = 'pianta-' + sp.nome;
  const steli = mergeGeometries(d.steli.map(g => { const q = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(q.attributes)) if (!['position', 'normal'].includes(k)) q.deleteAttribute(k); return q; }));
  const mStelo = new THREE.MeshStandardMaterial({ color: sp.steloColore, roughness: .8, metalness: 0 });
  const geoCelle = new Map();
  const geoPer = c => { const k = c.join(); if (!geoCelle.has(k)) geoCelle.set(k, cartaFoglia(c, d.larghe ? .05 : .18, d.larghe ? .05 : .22)); return geoCelle.get(k); };
  [1, .5, .25].forEach((frazione, liv) => {
    const g = new THREE.Group();
    // foglie raggruppate per cella dell'atlante → una InstancedMesh per cella
    const per = new Map();
    d.foglie.forEach((f, j) => { if (frazione < 1 && (j * 7919 % 100) / 100 >= frazione) return; const k = f.cella.join(); if (!per.has(k)) per.set(k, []); per.get(k).push(f); });
    for (const [k, lista] of per) {
      const im = new THREE.InstancedMesh(geoPer(lista[0].cella), mat, lista.length);
      lista.forEach((f, j) => im.setMatrixAt(j, f.m)); im.castShadow = liv < 2; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
    }
    if (liv < 2) { const st = new THREE.Mesh(steli, mStelo); st.castShadow = true; st.receiveShadow = true; g.add(st); }
    lod.addLevel(g, [0, 3200, 6500][liv]);
  });
  // dati per T-PIANTE: tutti i vertici delle foglie e degli steli (livello pieno)
  lod.userData.campioni = () => {
    const out = [], v = new THREE.Vector3();
    for (const f of d.foglie) for (const [x, y] of [[-.5, 0], [.5, 0], [-.5, 1], [.5, 1], [0, 1], [0, .5]]) { v.set(x, y, 0).applyMatrix4(f.m); out.push(v.x, v.y, v.z); }
    const p = steli.attributes.position; for (let j = 0; j < p.count; j += 3) out.push(p.getX(j), p.getY(j), p.getZ(j));
    return out;
  };
  return lod;
}

// ---------- vaso ----------
export function materialeVaso(F) {
  const terracotta = /terracotta/.test(F.nome);
  const m = terracotta
    ? new THREE.MeshStandardMaterial({ color: F.colore, roughness: 1, metalness: 0, normalMap: segnaposto(128, 128, 255), roughnessMap: segnaposto(220, 220, 220) })
    : new THREE.MeshStandardMaterial({ color: F.colore, roughness: .5, metalness: 0 });   // plastica satinata: nessuna mappa
  if (terracotta) caricaTerna('terracotta', '1k').then(T => { for (const [k, t] of [['normalMap', T.n], ['roughnessMap', T.r]]) { const c = t.clone(); c.repeat.set(3, 2); c.needsUpdate = true; m[k] = c; } });
  else m.normalScale = new THREE.Vector2(.3, .3);
  return m;
}
// colori per vertice: bordo un po' più scuro (terracotta), efflorescenze appena percettibili verso la base
export function coloraVaso(geo, F) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3), terracotta = /terracotta/.test(F.nome);   // RGB
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
    let k = 1;
    if (terracotta) {
      if (y > F.h - F.bordo - 4) k *= .86;                                              // bordo più scuro (mani, acqua)
      const eff = Math.max(0, 1 - y / 90) * (.5 + .5 * Math.sin(a * 5 + y * .05)) * .07;  // velo chiaro di sali verso la base
      c[i * 3] = k + eff; c[i * 3 + 1] = k + eff * 1.05; c[i * 3 + 2] = k + eff * 1.1;
    } else { c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
  }
  // (colori per vertice non usati: il path tracer non li gestisce; il bordo scuro è nella mappa di colore)
  return c;
}
// linea di stampo della plastica: filo sottile in rilievo lungo il profilo, a 45° (fuori dagli estremi dell'ingombro)
export function lineaStampo(F, rI, rS) {
  const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, y = 4 + t * (F.h - F.bordo - 8), r = rI + (rS - rI) * (y / (F.h - F.bordo)) + .15; pts.push(new THREE.Vector3(r * Math.SQRT1_2, y, r * Math.SQRT1_2)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .35, 4, false);
}

// ---------- terriccio ----------
export function geometriaTerriccio(r) {
  const anelli = 10, settori = 56, pos = [], uv = [], idx = [];
  const z = (x, y) => (Math.sin(x * .13) * Math.cos(y * .11) + Math.sin(x * .41 + y * .37) * .5 + Math.sin(x * .9 - y * .7) * .25) * 1.8;
  pos.push(0, z(0, 0) + 2, 0); uv.push(.5, .5);
  for (let a = 1; a <= anelli; a++) for (let s = 0; s < settori; s++) {
    const rr = r * a / anelli, t = s / settori * Math.PI * 2, x = Math.cos(t) * rr, y = Math.sin(t) * rr, bordo = a === anelli ? 0 : 1;
    pos.push(x, (z(x, y) + 2 * (1 - a / anelli)) * bordo, y); uv.push(x / 200, y / 200);
  }
  for (let s = 0; s < settori; s++) idx.push(0, 1 + (s + 1) % settori, 1 + s);
  for (let a = 1; a < anelli; a++) for (let s = 0; s < settori; s++) {
    const i0 = 1 + (a - 1) * settori + s, i1 = 1 + (a - 1) * settori + (s + 1) % settori, j0 = i0 + settori, j1 = i1 + settori;
    idx.push(i0, i1, j1, i0, j1, j0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export function materialeTerriccio() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, map: segnaposto(70, 52, 38, 255, true), normalMap: segnaposto(128, 128, 255), roughnessMap: segnaposto(240, 240, 240) });
  caricaTerna('terriccio', '1k').then(T => { for (const [k, t] of [['map', T.c], ['normalMap', T.n], ['roughnessMap', T.r]]) { const c = t.clone(); c.needsUpdate = true; m[k] = c; } });
  m.userData.base = new THREE.Color(0xffffff);
  return m;
}
// w: 0 asciutto → 1 bagnato (scuro e lucido, senza pozze)
export function bagnaTerriccio(m, w) {
  m.color.copy(m.userData.base).multiplyScalar(1 - .48 * w);
  m.roughness = 1 - .4 * w;
}
export function sassolini(r, n) {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + Math.sin(i * 1.7) * .15), p.getY(i) * .6, p.getZ(i) * (1 + Math.cos(i * 2.3) * .15));
  g.computeVertexNormals();
  const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0x8d877d, roughness: .7, metalness: 0 }), n);
  for (let k = 0; k < n; k++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * r * .85, s = 2.5 + rnd() * 3.5; im.setMatrixAt(k, _m.compose(_p.set(Math.cos(a) * rr, 1.5, Math.sin(a) * rr), _q.setFromEuler(_e.set(rnd(), rnd() * 6, rnd())), _s.set(s, s, s))); }
  im.castShadow = false; im.receiveShadow = true; return im;
}
