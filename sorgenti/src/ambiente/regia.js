// Regia (v3, punti 6-7): galleggiante nel serbatoio legato al livello simulato, flusso nel tubo flessibile
// (texture a strisce ripetuta, si anima solo texture.offset). Geometrie e materiali creati una volta all'avvio.
import * as THREE from 'three';
import { gTank, waterMesh, hoseTube } from '../scene/balcone.js';
import { clipMats } from '../materiali/libreria.js';

export const REGIA = { galleggiante: null, flusso: null };
export function creaRegia() {
  // galleggiante: disco giallo + asta, dentro il serbatoio (x 19, z 16 cm), sulla superficie dell'acqua
  const g = new THREE.Group(); g.userData.key = 'serbatoio';
  const mF = new THREE.MeshStandardMaterial({ color: 0xf5c542, roughness: .5, metalness: 0 });
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1.2, 20), mF); g.add(disco);
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 8, 8), mF); asta.position.y = 4.6; g.add(asta);
  g.position.set(23 - 7, 0, 16); gTank.add(g); REGIA.galleggiante = g;
  // flusso: strisce chiare/scure lungo la lunghezza del tubo (u della TubeGeometry)
  const N = 16, d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) { const v = i < N / 2 ? 255 : 150; d.set([v, v, v, 255], i * 4); }
  const t = new THREE.DataTexture(d, N, 1); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(90, 1); t.needsUpdate = true;
  const mFl = hoseTube.material.clone(); mFl.map = t; mFl.clippingPlanes = hoseTube.material.clippingPlanes; clipMats.push(mFl);   // segue la sezione come gli altri
  hoseTube.material = mFl; hoseTube.userData.orig = mFl; REGIA.flusso = t;
  aggiornaGalleggiante();
}
// la superficie dell'acqua è in cima a waterMesh (setTank): il galleggiante la segue
export function aggiornaGalleggiante() { const g = REGIA.galleggiante; if (g) g.position.y = waterMesh.position.y + waterMesh.scale.y / 2 + .3; }
// flusso: scorre solo mentre la pompa eroga
export function aggiornaFlusso(dt, attivo) { if (attivo && REGIA.flusso) REGIA.flusso.offset.x -= dt * 1.5; }

// ---------- getto (punto 7): tubo low-poly 16×6 lungo una curva quadratica riusata; buffer aggiornato sul posto ----------
const SEG = 16, RAD = 6, _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _bn = new THREE.Vector3(), _X = new THREE.Vector3(1, 0, 0);
const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
export function creaGetto(scene) {
  const n = (SEG + 1) * (RAD + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) { const k = i * (RAD + 1) + j; uv[k * 2] = i / SEG; uv[k * 2 + 1] = j / RAD; }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, b = a + RAD + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.setDrawRange(0, 0); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const N = 8, d = new Uint8Array(N * 4); for (let i = 0; i < N; i++) { const v = i % 4 < 2 ? 255 : 120; d.set([v, v, v, 255], i * 4); }
  const t = new THREE.DataTexture(d, N, 1); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(3, 1); t.needsUpdate = true;
  const m = new THREE.MeshBasicMaterial({ color: 0x9fd8f5, map: t, transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
  const getto = new THREE.Mesh(g, m); getto.frustumCulled = false; getto.raycast = () => { }; scene.add(getto);
  REGIA.getto = getto; REGIA.gettoTex = t;
}
// da (punta dell'ugello) a (terriccio): parabola con il punto di controllo poco sotto la punta; raggio che si assottiglia
export function aggiornaGetto(dt, attivo, punta, arrivo) {
  const G = REGIA.getto; if (!G) return;
  if (!attivo) { if (G.geometry.drawRange.count) G.geometry.setDrawRange(0, 0); return; }
  curva.v0.copy(punta); curva.v2.copy(arrivo); curva.v1.copy(punta).lerp(arrivo, .35); curva.v1.y = punta.y - (punta.y - arrivo.y) * .2;
  const p = G.geometry.attributes.position, a = p.array;
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG; curva.getPoint(u, _a);
    // derivata analitica della quadratica (Curve.getTangent alloca 2 Vector3 per chiamata)
    _t.subVectors(curva.v1, curva.v0).multiplyScalar(2 * (1 - u)); _t.x += 2 * u * (curva.v2.x - curva.v1.x); _t.y += 2 * u * (curva.v2.y - curva.v1.y); _t.z += 2 * u * (curva.v2.z - curva.v1.z); _t.normalize();
    _n.crossVectors(_t, _X); if (_n.lengthSq() < 1e-6) _n.set(0, 0, 1); _n.normalize(); _bn.crossVectors(_t, _n).normalize();
    const r = .32 * (1 - .55 * u);
    for (let j = 0; j <= RAD; j++) {
      const th = j / RAD * Math.PI * 2, c = Math.cos(th) * r, s = Math.sin(th) * r, k = (i * (RAD + 1) + j) * 3;
      _b.copy(_a).addScaledVector(_n, c).addScaledVector(_bn, s); a[k] = _b.x; a[k + 1] = _b.y; a[k + 2] = _b.z;
    }
  }
  p.needsUpdate = true; G.geometry.setDrawRange(0, SEG * RAD * 6);
  REGIA.gettoTex.offset.x -= dt * 4;
}
