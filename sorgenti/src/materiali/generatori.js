// Texture generate sulla GPU al caricamento (render-to-texture): il micro-dettaglio sta nelle MAPPE, non negli shader
// dei materiali, così rasterizzatore e path tracer vedono la stessa cosa (sez. 4).
import * as THREE from 'three';
import { qualita } from '../motore/qualita.js';

const base = import.meta.env.BASE_URL + 'asset/tex/';
const loader = new THREE.TextureLoader();
const cache = new Map();
export function risTex() { return qualita.p.tex >= 2048 ? '2k' : '1k'; }
// carica una terna colore/normale/ruvidità (ambientCG, CC0)
export function caricaTerna(nome, ris = risTex()) {
  const k = nome + ris; if (cache.has(k)) return cache.get(k);
  const t = (suff, srgb) => loader.loadAsync(`${base}${nome}-${ris}-${suff}.webp`).then(x => { x.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; x.wrapS = x.wrapT = THREE.RepeatWrapping; x.anisotropy = 8; return x; });
  const p = Promise.all([t('c', true), t('n', false), t('r', false)]).then(([c, n, r]) => ({ c, n, r }));
  cache.set(k, p); return p;
}

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const scenaQ = new THREE.Scene(); scenaQ.add(quad);
const camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function rtNuovo(w, h, srgb) {
  const rt = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
  rt.texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; rt.texture.anisotropy = 8;
  return rt;
}
// disegna con un fragment shader; 'uscita' sceglie quale mappa scrivere (0 colore, 1 normale, 2 ruvidità)
export function disegna(renderer, w, h, fragment, uniforms, mappe = ['c', 'n', 'r']) {
  const out = {};
  const mat = new THREE.ShaderMaterial({ uniforms: { ...uniforms, uscita: { value: 0 } }, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: fragment });
  quad.material = mat;
  const prec = renderer.getRenderTarget();
  mappe.forEach((m, i) => { const rt = rtNuovo(w, h, m === 'c'); mat.uniforms.uscita.value = i; renderer.setRenderTarget(rt); renderer.render(scenaQ, camQ); out[m] = rt.texture; out[m].rt = rt; });
  renderer.setRenderTarget(prec); mat.dispose();
  return out;
}

const COMUNE = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= .5; } return s; }
vec3 srgb2lin(vec3 c){ return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(.04045, c)); }
`;

// Pavimento in gres 50×50 (allineato al reticolo originale ogni 50 cm), fughe 3 mm con colore e rilievo propri,
// variazione per piastrella (rotazione 0/90/180/270°, spostamento, tinta, ruvidità), macro-variazione, polvere nelle fughe e negli angoli.
export async function texPavimento(renderer, { lx = 300, lz = 100, piastrella = 50, fuga = .3, pxPerM }) {
  const T = await caricaTerna('gres');
  const w = Math.round(lx / 100 * pxPerM), h = Math.round(lz / 100 * pxPerM);
  const frag = `${COMUNE}
    uniform sampler2D tc, tn, tr; uniform float uscita, lx, lz, piastrella, fuga; varying vec2 vUv;
    void main(){
      vec2 p = vec2(vUv.x * lx, vUv.y * lz);                 // cm
      vec2 id = floor(p / piastrella), q = p - id * piastrella; // cm dentro la piastrella
      float hsh = h21(id + 7.), hsh2 = h21(id * 1.7 + 3.1);
      // distanza dal bordo della piastrella
      vec2 e = min(q, piastrella - q); float d = min(e.x, e.y);
      float inFuga = 1. - smoothstep(fuga * .5 - .04, fuga * .5 + .04, d);
      // campionamento della foto: una foto ≈ 120 cm, rotazione a passi di 90°, spostamento casuale
      float rot = floor(hsh * 4.); vec2 uvp = (q - piastrella * .5);
      mat2 R = rot < 1. ? mat2(1., 0., 0., 1.) : rot < 2. ? mat2(0., 1., -1., 0.) : rot < 3. ? mat2(-1., 0., 0., -1.) : mat2(0., -1., 1., 0.);
      vec2 uvf = (R * uvp) / 120. + vec2(hsh, hsh2) * 3.;
      vec3 col = texture2D(tc, uvf).rgb;                       // lineare (texture sRGB decodificata)
      vec3 nrm = texture2D(tn, uvf).xyz * 2. - 1.; nrm.xy = transpose(R) * nrm.xy; nrm.xy *= .55;
      float rgh = texture2D(tr, uvf).r;
      // tinta e lucidità per piastrella + macro-variazione su tutto il pavimento
      float macro = fbm(p / 70.), tinta = (hsh - .5) * .05 + (macro - .5) * .06;
      col = col * vec3(1.03, 1.0, .965) * (.98 + tinta);
      rgh = clamp(.34 + (rgh - .5) * .25 + (hsh2 - .5) * .06 + (macro - .5) * .05, .2, .7);
      // smusso di 1 mm sul bordo della piastrella: la normale si inclina verso la fuga
      float sm = 1. - smoothstep(fuga * .5, fuga * .5 + .12, d);
      vec2 dirB = e.x < e.y ? vec2(q.x < piastrella * .5 ? -1. : 1., 0.) : vec2(0., q.y < piastrella * .5 ? -1. : 1.);
      nrm.xy += dirB * sm * .9;
      // leggerissimo dislivello tra piastrelle (posa reale): inclinazione costante per piastrella
      nrm.xy += (vec2(hsh, hsh2) - .5) * .012;
      // fuga: cemento grigio-beige, opaca, incavata
      float gn = fbm(p * 3.1);
      vec3 colF = srgb2lin(vec3(.56, .53, .49)) * (.9 + gn * .2);
      col = mix(col, colF, inFuga); rgh = mix(rgh, .88, inFuga); nrm.xy = mix(nrm.xy, (vec2(gn) - .5) * .3, inFuga);
      // polvere: un velo nelle fughe e verso i bordi del balcone (muro e ringhiera)
      float bordo = min(min(p.x, lx - p.x), min(p.y, lz - p.y));
      float polvere = inFuga * .25 + (1. - smoothstep(0., 9., bordo)) * .35 * fbm(p * .7);
      col = mix(col, srgb2lin(vec3(.62, .58, .52)), polvere * .5); rgh = mix(rgh, .8, polvere);
      vec3 n = normalize(vec3(nrm.xy, 1.));
      gl_FragColor = uscita < .5 ? vec4(col, 1.) : uscita < 1.5 ? vec4(n * .5 + .5, 1.) : vec4(rgh, rgh, rgh, 1.);
    }`;
  return disegna(renderer, w, h, frag, { tc: { value: T.c }, tn: { value: T.n }, tr: { value: T.r }, lx: { value: lx }, lz: { value: lz }, piastrella: { value: piastrella }, fuga: { value: fuga } });
}

// Vernice goffrata (buccia d'arancia) per la ringhiera: normale e ruvidità, ripetibili
export function texVerniceGoffrata(renderer, px = 512) {
  const frag = `${COMUNE} uniform float uscita; varying vec2 vUv;
    float hgt(vec2 p){ return fbm(p * 18.) * .7 + vn(p * 61.) * .3; }
    void main(){ vec2 p = vUv; float e = 1. / ${px}.;
      float a = hgt(p), bx = hgt(p + vec2(e, 0.)), by = hgt(p + vec2(0., e));
      vec3 n = normalize(vec3((a - bx) * 6., (a - by) * 6., 1.));
      float r = .42 + (fbm(p * 9.) - .5) * .08;
      gl_FragColor = uscita < .5 ? vec4(n * .5 + .5, 1.) : vec4(r, r, r, 1.); }`;
  // la vernice ripete su 0..1: tile seamless approssimato (rumore a grande scala)
  return disegna(renderer, px, px, frag, {}, ['n', 'r']);
}
