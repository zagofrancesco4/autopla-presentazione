// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CIELO_HDRI } from './cielo-hdri.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { texPavimento, texVerniceGoffrata, caricaTerna } from '../materiali/generatori.js';
// risoluzione delle texture dei grandi piani (px per metro) per preset
const PX_M = { Alta: 1024 };
let _ph = null;
export function segnaposti() {
  if (_ph) return _ph;
  const px = (r, g, b, srgb) => { const d = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1); d.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; d.needsUpdate = true; return d; };
  return (_ph = { c: px(255, 255, 255, true), n: px(128, 128, 255), r: px(230, 230, 230) });
}
// sostituisce le mappe segnaposto con quelle vere (stesso programma shader); rip = ripetizione per le UV
export function applicaMappe(m, T, rip) {
  const prep = t => { if (rip) { t = t.clone(); t.repeat.set(rip, rip); t.needsUpdate = true; } renderer.initTexture(t); return t; };
  m.map = prep(T.c); m.normalMap = prep(T.n); m.roughnessMap = prep(T.r);
  richiedi();
}
import { $, V, ease } from '../util.js';
import { ML_VASO, CONFIG, RAIL_Y, RAIL_X0, RAIL_X1, WIRE_Y, WIRE_Z, HOSE_Y, POT_Z, POTS, ARM_DEG, RAIL_BAR_R, MURO, SOLETTA, PIANTE, FORME_VASO, CIELO } from '../dati/config.js';
import { DEV, GENERAL, STEPS } from '../dati/parti.js';
import { creaPianta, materialeVaso, coloraVaso, lineaStampo, geometriaTerriccio, materialeTerriccio, bagnaTerriccio, sassolini, VENTO } from '../vegetazione/piante.js';
import { vp, renderer, scene, camera, controls, sun, fill, pipeline } from '../motore/renderer.js';
import { qualita } from '../motore/qualita.js';
import { mat, clipMats } from '../materiali/libreria.js';
import { pickables, compsByKey, labels, label, gFloor, gWall, gRail0, barGeo, gSt, gTank, gPump, gBay, gPsu, gFuse, gBrd, gDrv, gSock, gCab, gTube, gWire, gReel,
  reelSpin, waterMesh, hoseTube, hoseCable, rings, motSpin, idlerSpin, updateHose, invalidaTubo } from '../scene/balcone.js';
import { renderables, keyOf, S, select, flyTo, current, resize, tweenAttivo, completaTween, richiedi } from '../ui/presentazione.js';

// righe 2335-2720 (MURO, SOLETTA, PIANTE, FORME_VASO, CIELO spostati in dati/config.js)
/* =====================================================================
   AMBIENTE — balcone, luci, sfondo e inquadrature della presentazione.
   Il gruppo 'ambiente' è in mm (1 unità = 1 mm) e sta nella scena (in cm) con scala 0,1.
   ===================================================================== */
export const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
export const ambiente = new THREE.Group(); ambiente.name = 'ambiente'; ambiente.scale.setScalar(.1);
export const AMB = { modo: 0, modoT: 0, segui: false, sguardo: null, vasi: [], foglie: null, muro: [], muroLato: [], prec: new THREE.Vector3() };
// misure del balcone lette dal pavimento esistente (cm → mm): nessun numero duplicato
export const BALCONE = (() => { const b = new THREE.Box3().setFromObject(gFloor.children[0]); return { x0: b.min.x * 10, x1: b.max.x * 10, z0: b.min.z * 10, z1: b.max.z * 10, y: b.max.y * 10 }; })();

// --- registrazione nei sistemi della presentazione (tocco, evidenza, trasparenze) ---
export function registra(o, key) {
  if (key) o.userData.key = key;
  o.traverse(m => { if (m.isMesh) { m.userData.k = keyOf(m); m.userData.orig = m.material; pickables.push(m); renderables.push(m); } });
}
export function deregistra(o) { o.traverse(m => { for (const a of [pickables, renderables]) { const i = a.indexOf(m); if (i >= 0) a.splice(i, 1); } }); }

// --- unione delle mesh statiche per chiave e materiale (riduce le draw call) ---
export function unisci(node, tieni = () => false, ombra = true) {
  node.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(node.matrixWorld).invert(), gruppi = new Map(), via = [];
  node.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible) return;
    for (let p = o; p && p !== node; p = p.parent) if (tieni(p) || !p.visible) return;
    const k = keyOf(o) + '|' + o.material.uuid;
    if (!gruppi.has(k)) gruppi.set(k, { mat: o.material, key: keyOf(o), list: [] });
    gruppi.get(k).list.push(o);
  });
  for (const g of gruppi.values()) {
    if (g.list.length < 2) continue;
    const geos = g.list.map(o => { let q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      q.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return q; });
    const conUv = !!(g.mat.map || g.mat.normalMap || g.mat.roughnessMap) && geos.every(q => q.attributes.uv);   // v2: anche per le mappe di dettaglio
    geos.forEach(q => { for (const a of Object.keys(q.attributes)) if (a !== 'position' && a !== 'normal' && !(conUv && a === 'uv')) q.deleteAttribute(a); if (!q.attributes.normal) q.computeVertexNormals(); });
    const merged = mergeGeometries(geos, false); geos.forEach(q => q.dispose()); if (!merged) continue;
    const m = new THREE.Mesh(merged, g.mat); m.castShadow = ombra && !g.mat.transparent; m.receiveShadow = true;
    m.userData.key = g.key; node.add(m); registra(m);
    g.list.forEach(o => { deregistra(o); via.push(o); });
  }
  via.forEach(o => o.removeFromParent());
}

// copia del meccanismo nella scena: parti fisse, carrello, rotore e braccetto uniti per materiale
export function unisciMeccanismo(M) {
  for (const g of Object.values(M.gruppi)) unisci(g);
  unisci(M.car, p => p === M.rotor || p === M.pivot || p.name === 'pressacavo' || p.name === 'passaTubo');
  unisci(M.rotor); unisci(M.pivot, p => p.name === 'ugello');
  // ombra solo dalle parti grandi (la minuteria a questa scala non lascia un'ombra visibile)
  M.root.traverse(o => { if (o.isMesh) { o.userData.mainMech = true; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    o.castShadow = !o.material.transparent && o.geometry.boundingSphere.radius * o.getWorldScale(new THREE.Vector3()).x > 1.5; o.receiveShadow = true; } });
}

// --- texture procedurali (CanvasTexture) ---
export function canvas(n, disegna) { const c = document.createElement('canvas'); c.width = c.height = n; disegna(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
export const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();   // pseudo-casuale ripetibile
// piastrelle 300x300 con fughe da 3 mm: una texture = 4x4 piastrelle (1200 mm)
// (v2: texPiastrelle() dell'originale tolta: sostituita da texture fotografiche CC0)
// intonaco chiaro: rumore leggero
// (v2: texIntonaco() dell'originale tolta: sostituita da texture fotografiche CC0)
// foglia con contorno (trasparenza con alphaTest)
// (v2: texFoglia() dell'originale tolta: sostituita da texture fotografiche CC0)

// --- pavimento: piastrelle 300x300 con fughe da 3 mm ---
export function miglioraPavimento() {
  // v2: gres 50×50 generato sulla GPU (materiali/generatori.js) da una foto CC0; lati della lastra in intonaco liscio
  const floor = gFloor.children[0], ph = segnaposti();
  const m = new THREE.MeshStandardMaterial({ map: ph.c, normalMap: ph.n, roughnessMap: ph.r, roughness: 1, metalness: 0 }); clipMats.push(m);
  const lato = new THREE.MeshStandardMaterial({ color: 0xd6d1c8, roughness: .9, metalness: 0 }); clipMats.push(lato);
  floor.material = [lato, lato, m, lato, lato, lato]; floor.userData.orig = floor.material; floor.receiveShadow = true;
  AMB.piastrella = 50;   // cm: reticolo originale ogni 50 cm (prompt sez. 8)
  texPavimento(renderer, { lx: (BALCONE.x1 - BALCONE.x0) / 10, lz: (BALCONE.z1 - BALCONE.z0) / 10, piastrella: AMB.piastrella, pxPerM: PX_M[qualita.nome] }).then(T => { applicaMappe(m, T); AMB.pavimentoPronto = true; });
  const griglia = gFloor.children.find(c => c.isLineSegments); if (griglia) { deregistra(griglia); griglia.removeFromParent(); }
}

// --- soletta del balcone: spessore 150, sbalzo oltre la ringhiera, gocciolatoio sotto il bordo ---
export function creaSoletta(tex) {
  const s = SOLETTA, z0 = BALCONE.z0 - s.sbalzo, z1 = BALCONE.z1 + MURO.spessore, y0 = -s.spessore, yF = -40;   // yF: sotto il pavimento esistente
  const p = new THREE.Shape(); const gz = z0 + s.goccia.da;
  p.moveTo(z0, BALCONE.y); p.lineTo(z0, y0); p.lineTo(gz, y0); p.lineTo(gz, y0 + s.goccia.l); p.lineTo(gz + s.goccia.l, y0 + s.goccia.l); p.lineTo(gz + s.goccia.l, y0);
  p.lineTo(z1, y0); p.lineTo(z1, yF); p.lineTo(BALCONE.z0, yF); p.lineTo(BALCONE.z0, BALCONE.y); p.lineTo(z0, BALCONE.y);
  const g = new THREE.ExtrudeGeometry(p, { depth: BALCONE.x1 - BALCONE.x0, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(BALCONE.x1, 0, 0);
  const ph = segnaposti(), ms = new THREE.MeshStandardMaterial({ color: 0xd8d4cd, map: ph.c, normalMap: ph.n, roughnessMap: ph.r, roughness: 1 });
  caricaTerna('intonacoGrezzo', '1k').then(T => applicaMappe(ms, T, 1 / 1500));    // UV in mm: una foto ogni 1,5 m
  const m = new THREE.Mesh(g, ms); m.receiveShadow = true; m.name = 'soletta';
  ambiente.add(m);
}

// --- muro di casa (lato opposto alla ringhiera) con portafinestra 1200x2400, telaio 70 ---
export function creaMuro(tex) {
  const d = MURO, P = d.porta, x0 = -100, x1 = BALCONE.x1, z0 = BALCONE.z1;
  const sh = new THREE.Shape(); sh.moveTo(x0, 0); sh.lineTo(x1, 0); sh.lineTo(x1, d.altezza); sh.lineTo(x0, d.altezza); sh.lineTo(x0, 0);
  const h = new THREE.Path(); const px0 = P.x - P.l / 2, px1 = P.x + P.l / 2;
  h.moveTo(px0, 0.1); h.lineTo(px1, 0.1); h.lineTo(px1, P.h); h.lineTo(px0, P.h); h.lineTo(px0, 0.1); sh.holes.push(h);
  const g = new THREE.ExtrudeGeometry(sh, { depth: d.spessore, bevelEnabled: false }); g.translate(0, 0, z0);
  const ph = segnaposti();
  const mm = new THREE.MeshStandardMaterial({ color: 0xf4f0e9, map: ph.c, normalMap: ph.n, roughnessMap: ph.r, roughness: 1, transparent: true });
  caricaTerna('intonaco', '1k').then(T => {   // Media: 1K (budget memoria texture ≤ 200 MB)
    applicaMappe(mm, T, 1 / 1500); applicaMappe(mat.muro, T, 1 / 1.5); });   // muro di casa: UV in mm; muro laterale: UV in metri (sotto)
  const muro = new THREE.Mesh(g, mm); muro.receiveShadow = true; muro.userData.key = 'muro'; ambiente.add(muro);
  // v2: portafinestra (MURO.porta): telaio a profili smussati con guarnizioni, maniglia, vetrocamera, soglia in pietra,
  // e un interno appena suggerito (stanza in penombra con una tenda) dietro il vetro. Tutto dentro l'apertura del muro.
  const tm = new THREE.MeshStandardMaterial({ color: 0xf1f0ec, roughness: .38, metalness: 0, transparent: true });
  const gm = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: .7, metalness: 0, transparent: true });       // guarnizioni EPDM
  const am = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: .25, metalness: 1, transparent: true });      // maniglia in alluminio satinato
  const T = P.telaio, zc = z0 + T / 2, f = new THREE.Group(); f.userData.key = 'muro';
  const rb = (w, hh, dd, x, y, z, m, r = 3) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, hh, dd, 2, r), m); b.position.set(x, y, z); f.add(b); return b; };
  rb(T, P.h, T, px0 + T / 2, P.h / 2, zc, tm); rb(T, P.h, T, px1 - T / 2, P.h / 2, zc, tm); rb(P.l, T, T, P.x, P.h - T / 2, zc, tm); rb(P.l, T * .6, T, P.x, T * .3, zc, tm);
  rb(T, P.h - T * 1.6, T, P.x, P.h / 2 - T * .2, zc, tm);                                                            // montante centrale (due ante)
  const lv = (P.l - 3 * T) / 2, hv = P.h - T * 1.6, yv = T * .6 + hv / 2;
  for (const sx of [-1, 1]) {                                                                                     // guarnizioni attorno a ciascun vetro (lato balcone)
    const xv = P.x + sx * (lv / 2 + T / 2), zg = z0 + 6;
    rb(lv, 6, 8, xv, yv + hv / 2 - 3, zg, gm, 1.5); rb(lv, 6, 8, xv, yv - hv / 2 + 3, zg, gm, 1.5);
    rb(6, hv, 8, xv - lv / 2 + 3, yv, zg, gm, 1.5); rb(6, hv, 8, xv + lv / 2 - 3, yv, zg, gm, 1.5);
  }
  // maniglia a leva sul montante centrale, a 1050 mm (lato balcone)
  const pm = new THREE.Mesh(new RoundedBoxGeometry(28, 120, 10, 2, 3), am); pm.position.set(P.x + 10, 1050, z0 - 5); f.add(pm);
  const lev = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 120, 20), am); lev.rotation.z = Math.PI / 2; lev.position.set(P.x + 10 + 55, 1080, z0 - 32); f.add(lev);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 30, 20), am); col.rotation.x = Math.PI / 2; col.position.set(P.x + 10, 1080, z0 - 20); f.add(col);
  // vetrocamera: riflessi dell'ambiente + fresnel, tinta lievissima
  const vm = new THREE.MeshPhysicalMaterial({ color: 0xeef4f2, roughness: .03, metalness: 0, transparent: true, opacity: .16, envMapIntensity: 1.6, depthWrite: false, specularIntensity: 1, ior: 1.52 });
  vm.userData.pieno = .16;
  for (const sx of [-1, 1]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(lv, hv), vm); v.position.set(P.x + sx * (lv / 2 + T / 2), yv, zc); v.rotation.y = Math.PI; f.add(v); }
  // soglia in pietra
  const sm_ = new THREE.MeshStandardMaterial({ color: 0xc9c2b6, roughness: .55, metalness: 0, transparent: true });
  const soglia = new THREE.Mesh(new RoundedBoxGeometry(P.l + 60, 20, d.spessore + 40, 2, 3), sm_);
  soglia.position.set(P.x, 10, z0 + d.spessore / 2 - 20); f.add(soglia);
  // interno in penombra (pochi poligoni): pavimento, pareti e soffitto di una stanza, tenda chiara mossa
  const im_ = new THREE.MeshStandardMaterial({ color: 0x8d877e, roughness: .95, metalness: 0, envMapIntensity: .12, side: THREE.BackSide, transparent: true });
  const stanza = new THREE.Mesh(new THREE.BoxGeometry(3400, d.altezza, 3600), im_); stanza.position.set(P.x, d.altezza / 2, z0 + d.spessore + 1800); f.add(stanza);
  const tg = new THREE.PlaneGeometry(lv * 1.25, P.h - 120, 48, 1), tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setZ(i, Math.sin(tp.getX(i) / 55) * 22 + Math.sin(tp.getX(i) / 13) * 4);
  tg.computeVertexNormals();
  const tmat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: .9, metalness: 0, envMapIntensity: .35, side: THREE.DoubleSide, transparent: true });
  const tenda = new THREE.Mesh(tg, tmat); tenda.position.set(P.x - lv * .55, (P.h - 120) / 2 + 30, z0 + d.spessore + 120); tenda.rotation.y = Math.PI; f.add(tenda);
  ambiente.add(f); unisci(f, o => o.material === vm, false);
  AMB.muro = [mm, tm, vm, sm_, gm, am, im_, tmat];
  // muro laterale esistente: stesso intonaco
  Object.assign(mat.muro, { map: ph.c, normalMap: ph.n, roughnessMap: ph.r, roughness: 1, transparent: true }); mat.muro.needsUpdate = true; mat.muro.color.set(0xf4f0e9); AMB.muroLato = [mat.muro];
  mat.telaio.transparent = true; mat.telaio.needsUpdate = true;
  // v2: dietro la porta del muro laterale, una stanza in penombra (sparisce con il muro laterale)
  const il = new THREE.MeshStandardMaterial({ color: 0x847e76, roughness: .95, metalness: 0, envMapIntensity: .12, side: THREE.BackSide, transparent: true });
  const st2 = new THREE.Mesh(new THREE.BoxGeometry(3600, MURO.altezza, 3000), il); st2.position.set(-100 - 1800, MURO.altezza / 2, 600); ambiente.add(st2);
  AMB.muroLato.push(il);
  // il muro laterale esistente ha UV per faccia: ripeti la texture in proporzione
  gWall.traverse(o => { if (o.isMesh && o.material === mat.muro) { const b = o.geometry.parameters; o.geometry = o.geometry.clone(); const uv = o.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(b.depth, b.width) / 100, uv.getY(i) * b.height / 100); uv.needsUpdate = true; } });
}

// --- ringhiera: misure esistenti, verniciatura scura metallica, corrimano piatto 40x8, ferri in InstancedMesh ---
export function miglioraRinghiera() {
  // v2: vernice nel tono originale (#3b4047), dielettrica, finitura leggermente goffrata (mappa generata)
  const vg = texVerniceGoffrata(renderer, 512); vg.n.repeat.set(1, 28); vg.r.repeat.set(1, 28);
  Object.assign(mat.ringhiera, { roughness: 1, metalness: 0, normalMap: vg.n, roughnessMap: vg.r, normalScale: new THREE.Vector2(.35, .35) }); mat.ringhiera.color.set(0x3b4047); mat.ringhiera.needsUpdate = true;
  const top = gRail0.children.find(o => o.isMesh && o.geometry.parameters && o.geometry.parameters.width === 300 && o.position.y > 100);
  const pb = top.geometry.parameters, yTop = (top.position.y + pb.height / 2) * 10;
  const cor = new THREE.Mesh(new THREE.BoxGeometry(BALCONE.x1 - BALCONE.x0, 8, 40), mat.ringhiera);
  cor.position.set((BALCONE.x0 + BALCONE.x1) / 2, yTop + 4, top.position.z * 10); cor.castShadow = true;
  const gc = new THREE.Group(); gc.add(cor); ambiente.add(gc); registra(gc, 'ringhiera');
  // ferri: una sola InstancedMesh nelle stesse posizioni (le staffe del tubo restano sui ferri)
  const ferri = gRail0.children.filter(o => o.isMesh && o.geometry === barGeo);
  const im = new THREE.InstancedMesh(barGeo, mat.ringhiera, ferri.length); im.castShadow = im.receiveShadow = true;
  ferri.forEach((o, i) => { o.updateMatrix(); im.setMatrixAt(i, o.matrix); deregistra(o); o.removeFromParent(); });
  gRail0.add(im); registra(im);
  unisci(gRail0, o => o === im);
}

// raggio massimo (mm, dal centro del vaso) ammesso per la pianta alla quota y sopra il terriccio:
// dentro la parete interna fino al bordo, dentro il bordo interno sopra (margine per il vento)
export function limiteVaso(F, ySuolo, rI, rS, s) {
  const hB = F.h - F.bordo, margine = VENTO.ampiezza.value + 2;
  return y => { const yv = ySuolo + y; if (yv < 0) return 0;
    if (yv < hB) return rI + (rS - rI) * (yv / hB) - s - 1;
    return rS - s - margine; };
}
// verifica: ogni vertice di foglie e steli, con la scala applicata, dentro il limite del suo vaso e sopra il terriccio
export function verificaPiante() {
  const out = [];
  for (const p of AMB.piante ? AMB.piante.children : []) {
    const c = p.userData.campioni(), lim = p.userData.lim; let fuori = 0, sporgenza = -Infinity, yMin = Infinity;
    for (let k = 0; k < c.length; k += 3) {
      const y = c[k + 1] * p.scale.y, r = Math.hypot(c[k], c[k + 2]) * p.scale.x, d = r - lim(y);
      sporgenza = Math.max(sporgenza, d); yMin = Math.min(yMin, y); if (d > 1e-6 || y < -3) fuori++;   // fino a 3 mm sotto il terriccio (zolle ±3,5 mm) = sepolto nel vaso
    }
    out.push({ vaso: p.userData.vaso + 1, pianta: p.name, vertici: c.length / 3, fuori, sporgenzaMaxMm: +sporgenza.toFixed(2), yMinMm: +yMin.toFixed(2) });
  }
  return out;
}
export function creaVasi() {
  const M = window.MAINM; M.update(S.bx, 0); M.root.updateMatrixWorld(true);
  const tipY = M.tip().y * 10;                                   // punto più basso del braccetto a riposo (mm)
  const gp = new THREE.Group(); ambiente.add(gp);
  POTS.forEach((xcm, i) => {
    const F = FORME_VASO[i % FORME_VASO.length], x = xcm * 10, z = POT_Z * 10, rS = F.dSup / 2, rI = F.dInf / 2, s = 8;
    const prof = [[0, 0], [rI, 0], [rS, F.h - F.bordo], [rS + 6, F.h - F.bordo], [rS + 6, F.h], [rS - s, F.h], [rI - s, s], [0, s]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.Group(); g.userData.key = 'vaso' + (i + 1);
    // v2: vaso con materiale vero (terracotta porosa o plastica satinata), bordo più scuro, parete spessa visibile sul bordo
    const vm = materialeVaso(F), geo = new THREE.LatheGeometry(prof, MOBILE ? 32 : 72); coloraVaso(geo, F);
    const vaso = new THREE.Mesh(geo, vm); vaso.castShadow = vaso.receiveShadow = true; g.add(vaso);
    if (!/terracotta/.test(F.nome)) { const ls = new THREE.Mesh(lineaStampo(F, rI, rS), vm); ls.castShadow = false; g.add(ls); }
    const ySuolo = F.h - 28, rSuolo = rI + (rS - rI) * (ySuolo / (F.h - F.bordo)) - s;
    const tm = materialeTerriccio(), terra = new THREE.Mesh(geometriaTerriccio(rSuolo), tm);
    terra.position.y = ySuolo; terra.receiveShadow = true; g.add(terra);
    const ss = sassolini(rSuolo, MOBILE ? 5 : 10); ss.position.y = ySuolo; g.add(ss);
    g.position.set(x, 0, z); ambiente.add(g); registra(g);
    // vecchio vaso nascosto: stessa chiave, nuova forma
    const old = compsByKey['vaso' + (i + 1)]; deregistra(old); old.visible = false; compsByKey['vaso' + (i + 1)] = g;
    const topPianta = Math.min(tipY - PIANTE.margine, F.h + 170), rP = rSuolo * .78;
    AMB.vasi.push({ x, z, h: F.h, rS: rS + 6, rIn: rSuolo, top: topPianta, nome: F.nome, terra: tm, w: 0 });
    // pianta: una specie per vaso; dentro il limite di altezza (topPianta, con il margine del vento) e, sopra il bordo, dentro il raggio del vaso
    const p = creaPianta(i, { hMax: topPianta - ySuolo - 50, rMax: rP, rBordo: rS - s, hBordo: F.h - ySuolo });
    // contenimento: sotto il bordo dentro la parete interna, sopra il bordo dentro il bordo interno meno il vento
    const c = p.userData.campioni(), lim = limiteVaso(F, ySuolo, rI, rS, s);
    let maxY = 0, sx = 1;
    for (let k = 0; k < c.length; k += 3) { maxY = Math.max(maxY, c[k + 1]); const r = Math.hypot(c[k], c[k + 2]); if (r > 0) sx = Math.min(sx, lim(c[k + 1]) / r); }
    const limY = topPianta - ySuolo - VENTO.ampiezza.value - 2, sy = Math.min(1, limY / maxY);
    p.scale.set(sx, sy, sx); p.position.set(x, ySuolo, z); p.userData.vaso = i; p.userData.lim = lim; gp.add(p);
  });
  registra(gp, 'piante');
  AMB.piante = gp;
}
// vento leggero: oscillazione dell'inclinazione di ogni foglia (altezza sempre sotto il limite)
export const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
// vento: avanza solo nei fotogrammi disegnati (a scena ferma le piante restano ferme e la GPU a zero)
export function aggiornaVento() { vento(performance.now() / 1000); }
export function vento(t) {
  VENTO.tempo.value = t;      // v2: il vento è nel vertex shader delle foglie (vegetazione/piante.js)
  const F = AMB.foglie; if (!F) return;
  F.list.forEach((f, i) => {
    let tilt = f.tilt + .06 * Math.sin(t * 1.6 + f.ph) + .03 * Math.sin(t * 3.1 + f.ph * 2);
    const hMax = (f.top - f.y) / f.L; if (Math.cos(tilt) > hMax) tilt = Math.acos(Math.min(1, hMax));
    _e.set(tilt, f.yaw, 0, 'YXZ'); _q.setFromEuler(_e); _v.set(f.x, f.y, f.z); _s.set(f.W, f.L, 1);
    F.im.setMatrixAt(i, _m.compose(_v, _q, _s));
  });
  F.im.instanceMatrix.needsUpdate = true;
}

// --- fascette del filo teso: il filo che porta tubo e cavo è legato sui ferri, uno ogni 3 (~360 mm) ---
export function creaFascetteFilo() {
  const passo = 120 * 3, xs = [];   // ferri ogni 120 mm nella scena
  for (let x = Math.ceil(345 / 120) * 120; x <= RAIL_X1 * 10 - 60; x += passo) xs.push(x);
  const geo = new THREE.TorusGeometry(1, .09, 6, 20); geo.rotateX(Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: .6 }), xs.length);
  const zc = (0 + WIRE_Z * 10) / 2, a = (WIRE_Z * 10 + 2 * 8) / 2 + 4;
  xs.forEach((x, i) => im.setMatrixAt(i, _m.compose(_v.set(x, WIRE_Y * 10, zc), _q.identity(), _s.set(10, 30, a))));
  const g = new THREE.Group(); g.add(im); ambiente.add(g); registra(g, 'cavetto');
}

// v2: cielo e illuminazione da HDRI CC0 (ambiente/cielo-hdri.js); niente più sagome piatte né nebbia
export let cielo = null, cieloPronto = null;
export function creaSfondo() {
  // sfondo: griglia tecnica in CSS dietro un canvas trasparente (nessun costo GPU, nessun HDRI da scaricare)
  scene.background = null;
  // riflessi: ambiente da studio procedurale (RoomEnvironment), calcolato una volta sola
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .4;
  pm.dispose();
  cieloPronto = Promise.resolve();
  AMB.sagome = [];
  scene.fog = new THREE.Fog(0x141517, 900, 2600);   // parti lontane (soletta, stanze) sfumano nel colore dello sfondo
}

// --- luci e rendering ---
export let sole, emi;
// sole tarato sull'HDRI (scripts/prepara-hdri.mjs): irradianza e colore del disco tolto dall'immagine.
// Tramonto: il sole dell'HDRI è a 3,3° e velato; luce = 6 × irradianza del cielo, colore tra quello dell'HDRI e quello del giorno (SCELTE-ASPETTO.md).
const SOLE = (() => {
  const g = CIELO_HDRI.giorno.sole.irradianza, mx = Math.max(...g);
  const t = CIELO_HDRI.tramonto.sole.irradianza, mt = Math.max(...t), cg = g.map(v => v / mx), ct0 = t.map(v => v / mt);
  const ct = cg.map((v, i) => v * .4 + ct0[i] * .6), lt = .2126 * ct[0] + .7152 * ct[1] + .0722 * ct[2];
  const Et = 6 * CIELO_HDRI.tramonto.cielo.irradianzaOrizz;
  return { giorno: { colore: new THREE.Color(...cg), int: mx }, tramonto: { colore: new THREE.Color(...ct), int: Et / lt } };
})();
// esposizione fissa per modalità: intonaco chiaro al sole ≈ bianco prima del tone mapping
// giorno: .58 era tarato su wide_street_01 (esposizione suggerita .490); circus_maximus_2 → .646: stessa proporzione
const ESPOSIZIONE = { giorno: .76, tramonto: .72 };
// ombra del sole: frustum stretto sul balcone (BALCONE + muro), ricalcolato quando il sole si muove
const _ang = [];
function adattaOmbra(dir) {
  const x0 = BALCONE.x0 / 10 - 15, x1 = BALCONE.x1 / 10 + 15, z0 = BALCONE.z0 / 10 - 20, z1 = (BALCONE.z1 + MURO.spessore) / 10 + 5, y0 = -16, y1 = MURO.altezza / 10;
  const c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  sole.target.position.copy(c); sole.position.copy(c).addScaledVector(dir, 900);
  sole.updateMatrixWorld(); sole.target.updateMatrixWorld();
  const cam = sole.shadow.camera; cam.position.copy(sole.position); cam.lookAt(c); cam.updateMatrixWorld();
  const inv = cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  let a = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const p = new THREE.Vector3(x, y, z).applyMatrix4(inv); a = [Math.min(a[0], p.x), Math.max(a[1], p.x), Math.min(a[2], p.y), Math.max(a[3], p.y), Math.min(a[4], -p.z), Math.max(a[5], -p.z)]; }
  Object.assign(cam, { left: a[0], right: a[1], bottom: a[2], top: a[3], near: Math.max(1, a[4] - 10), far: a[5] + 10 });
  cam.updateProjectionMatrix();
}
export function creaLuci() {
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;   // v2: PCFSoftShadowMap è deprecato dalla r182 (PCF ora è morbido)
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;      // aggiornate solo quando si muove qualcosa
  mat.telaio.color.set(0xa4a9b0); mat.telaio.metalness = .45; mat.telaio.roughness = .55;   // v2: profili e ripiani in alluminio anodizzato
  // v2: la luce d'ambiente viene dall'HDRI (PMREM): via l'emisferica e la luce di riempimento
  emi = scene.children.find(o => o.isHemisphereLight); if (emi) scene.remove(emi); scene.remove(fill);
  sole = sun;
  sole.castShadow = true; const sz = qualita.p.ombra; sole.shadow.mapSize.set(sz, sz);
  sole.shadow.bias = -.0002; sole.shadow.normalBias = .04; sole.shadow.radius = 2;
  scene.add(sole.target);
  // ombre solo dove servono
  for (const g of [gRail0, gSt, gTank, gPump]) g.traverse(o => { if (o.isMesh) o.castShadow = !o.material.transparent; });
  scene.traverse(o => { if (o.isMesh && !o.material.transparent) o.receiveShadow = true; });
  luceModo(0);
}
// interpola giorno (0) e tramonto (1): sole (colore, angolo, intensità), cielo HDRI, esposizione
export const _c = new THREE.Color();
export function luceModo(k) {
  const A = CIELO.giorno, B = CIELO.tramonto, L = (a, b) => a + (b - a) * k;
  const el = THREE.MathUtils.degToRad(L(A.elev, B.elev)), az = THREE.MathUtils.degToRad(L(A.azim, B.azim));
  const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az));   // il sole sta dal lato della strada (z < 0)
  adattaOmbra(dir);
  sole.color.copy(SOLE.giorno.colore).lerp(SOLE.tramonto.colore, k); sole.intensity = L(SOLE.giorno.int, SOLE.tramonto.int);
  renderer.toneMappingExposure = 1; pipeline.esposizione = L(ESPOSIZIONE.giorno, ESPOSIZIONE.tramonto);
  if (cielo) cielo.aggiorna(k);
  AMB.solePos = sole.position.clone(); AMB.soleDir = dir.clone();
}
// --- inquadrature predefinite (cm) ---
export const INQ = {
  panoramica: { t: V(150, 60, 50), d: V(0, .3, 1), w: 320, h: 200 },
  rotaia: { t: V(105, 58, 18), d: V(.12, .55, 1), w: 180, h: 120 },
  segui: { d: V(.35, .32, 1), w: 70, h: 62 }
};
export function inquadratura(nome) {
  if (nome === 'dettaglio') { AUTOPLA.open(); return; }
  if (current !== null && current !== 'ciclo') select(null);
  AMB.segui = nome === 'segui';
  if (AMB.segui) { const c = posCarrello(); flyTo({ t: c, d: INQ.segui.d, w: INQ.segui.w, h: INQ.segui.h }); AMB.prec.copy(c); }
  else flyTo(INQ[nome]);
  document.querySelectorAll('#vistePres [data-q]').forEach(b => b.classList.toggle('on', b.dataset.q === nome));
}
export function posCarrello() { const M = window.MAINM; M.root.updateMatrixWorld(true); return M.car.getWorldPosition(new THREE.Vector3()); }

// --- vincoli della camera: target sul balcone, niente camera sotto il pavimento o dentro i muri ---
export function vincolaCamera() {
  const t = controls.target, c = camera.position;
  t.x = THREE.MathUtils.clamp(t.x, -20, 320); t.y = THREE.MathUtils.clamp(t.y, 0, 200); t.z = THREE.MathUtils.clamp(t.z, -40, 110);
  if (c.y < 10) c.y = 10;
  const zM0 = BALCONE.z1 / 10 - 2, zM1 = (BALCONE.z1 + MURO.spessore) / 10 + 2;
  if (c.z > zM0 && c.z < zM1 && c.y < MURO.altezza / 10 + 2 && c.x > -12) c.z = c.z - zM0 < zM1 - c.z ? zM0 : zM1;
  if (c.x > -12 && c.x < 2 && c.z > 0 && c.z < zM1 && c.y < 262) c.x = c.x < -5 ? -12 : 2;
}

// --- etichette della scena principale: stesso metodo anti-sovrapposizione del dettaglio ---
export function disponiEtichetteMain() {
  const vb = vp.getBoundingClientRect(), M = 4, it = [], ob = [];
  for (const e of labels) {
    const el = e.d; if (!el || !e.o.visible || el.style.display === 'none') continue;
    el.style.visibility = '';
    const r = el.getBoundingClientRect(); if (!r.width) continue;
    const box = { x: r.left - vb.left, y: r.top - vb.top, w: r.width, h: r.height };
    if (e.cat === 'dot') ob.push(box); else it.push(Object.assign(box, { el, x0: box.x, y0: box.y }));
  }
  for (const id of ['vistePres', 'hint', 'bHome']) { const e = $(id); if (e && !e.hidden) { const r = e.getBoundingClientRect(); if (r.width) ob.push({ x: r.left - vb.left, y: r.top - vb.top, w: r.width, h: r.height }); } }
  for (let k = 0; k < 30; k++) {
    let mosso = false;
    for (let i = 0; i < it.length; i++) {
      const a = it[i];
      for (const b of [...it.slice(i + 1), ...ob]) {
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + M, oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + M;
        if (ox <= 0 || oy <= 0) continue; mosso = true; const fisso = ob.includes(b);
        if (oy < ox) { const d = (a.y < b.y ? -1 : 1) * oy; if (fisso) a.y += d; else { a.y += d / 2; b.y -= d / 2; } }
        else { const d = (a.x < b.x ? -1 : 1) * ox; if (fisso) a.x += d; else { a.x += d / 2; b.x -= d / 2; } }
      }
      a.x = Math.max(M, Math.min(vb.width - a.w - M, a.x)); a.y = Math.max(M, Math.min(vb.height - a.h - M, a.y));
    }
    if (!mosso) break;
  }
  // ultima passata: nasconde le etichette che restano sovrapposte o finiscono lontane dal loro oggetto
  const tenute = [], urta = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0;
  for (const a of it) {
    if (Math.hypot(a.x - a.x0, a.y - a.y0) > 90 || tenute.some(b => urta(a, b)) || ob.some(b => urta(a, b))) { a.el.style.visibility = 'hidden'; continue; }
    tenute.push(a);
    if (a.x !== a.x0 || a.y !== a.y0) a.el.style.transform += ` translate(${(a.x - a.x0).toFixed(1)}px,${(a.y - a.y0).toFixed(1)}px)`;
  }
}

// --- aggiornamento per fotogramma: luce, vento, carrello da seguire, muri in trasparenza ---
export function ambienteFrame(dt) {
  // v2: terriccio bagnato (S.ml / ML_VASO del vaso in erogazione), asciugatura lenta (~1 min)
  { const st = STEPS[Math.max(0, S.step)];
    AMB.vasi.forEach((v, i) => { if (!v.terra) return; let w = v.w; if (S.running && st && st.t === 'water' && st.pot === i) w = Math.max(w, S.ml / ML_VASO); else w = Math.max(0, w - dt / 60); if (w !== v.w || !v.wi) { v.w = w; v.wi = true; bagnaTerriccio(v.terra, w); } }); }
  if (AMB.modo !== AMB.modoT) { AMB.modo += Math.sign(AMB.modoT - AMB.modo) * Math.min(Math.abs(AMB.modoT - AMB.modo), dt); luceModo(ease(AMB.modo)); }
  if (AMB.segui && window.MAINM && !tweenAttivo()) { const c = posCarrello(), d = c.clone().sub(AMB.prec); controls.target.add(d); camera.position.add(d); AMB.prec.copy(c); }
  // spaccato: il muro di casa diventa trasparente quando la camera è dal lato casa
  const fuori = camera.position.z > BALCONE.z1 / 10, lato = camera.position.x < 0;
  for (const [mats, via] of [[AMB.muro, fuori], [AMB.muroLato, lato]]) for (const m of mats) {
    const pieno = m.userData.pieno ?? (m.isMeshPhysicalMaterial ? .35 : 1), o = m.userData.op ?? pieno, tgt = via ? 0 : pieno, n = Math.abs(tgt - o) < .01 ? tgt : o + (tgt - o) * Math.min(1, dt * 6);
    m.userData.op = n; m.opacity = n; m.visible = n > .01; m.depthWrite = n > .98 && !m.isMeshPhysicalMaterial;
  }
}

// --- verifica dell'ambiente lungo la corsa (solo con ?dev=1) ---
export function verificaAmbiente() {
  const M = window.MAINM, out = [], salva = [S.bx, S.arm], br = CONFIG.braccetto, ug = CONFIG.ugello;
  const rA = Math.max(br.d, ug.dOut) / 20;   // raggio prudente braccetto/ugello (cm)
  const seg = (P, T, f) => { let g = Infinity; for (let k = 0; k <= 30; k++) { const q = P.clone().lerp(T, k / 30); g = Math.min(g, f(q)); } return g; };
  const dPianta = (q, v) => { const dx = Math.hypot(q.x - v.x / 10, q.z - v.z / 10) - v.rS / 10, dy = q.y - v.top / 10; return dx > 0 && dy > 0 ? Math.hypot(dx, dy) : Math.max(dx, dy); };
  const hose = hoseTube.geometry.attributes.position;
  let gP = Infinity, gV = Infinity, gR = Infinity, gH = Infinity, wP = '', wH = '';
  // corsa reale: il carrello resta tutto sul tubo
  const Lt = (RAIL_X1 - RAIL_X0) * 10, bxMin = RAIL_X1 - (Lt - M.D.xHalf + M.D.xArm) / 10, bxMax = RAIL_X1 - (M.D.xHalf + M.D.xArm) / 10;
  out.push(['Corsa verificata', true, `braccetto da x ${bxMin.toFixed(1)} a ${bxMax.toFixed(1)} cm, passo 1 cm`]);
  for (const arm of [0, ARM_DEG]) for (let bx = bxMin; bx <= bxMax + 1e-9; bx += 1) {
    M.update(bx, arm); M.root.updateMatrixWorld(true); invalidaTubo(); updateHose(bx);
    const P = M.pivot.getWorldPosition(new THREE.Vector3()), T = M.tip();
    for (const v of AMB.vasi) { const g = seg(P, T, q => dPianta(q, v)) - rA; if (g < gP) { gP = g; wP = `${v.nome} a bx ${bx} cm, braccetto ${arm}°`; } }
    gR = Math.min(gR, seg(P, T, q => q.z - RAIL_BAR_R) - rA);
    const ph = hoseTube.geometry.attributes.position; let gh = Infinity;
    for (let i = 0; i < ph.count; i += 3) { const p = new THREE.Vector3(ph.getX(i), ph.getY(i), ph.getZ(i)); if (p.y > P.y + 1) continue; gh = Math.min(gh, seg(P, T, q => q.distanceTo(p))); }
    if (gh - rA - .5 < gH) { gH = gh - rA - .5; wH = `bx ${bx} cm, braccetto ${arm}°`; }
  }
  const yBox = RAIL_Y + M.D.yBotOut / 10, topMax = Math.max(...AMB.vasi.map(v => v.top / 10)); gV = yBox - topMax;
  out.push(['Piante e vasi ↔ braccetto/ugello (0° e 30°, tutta la corsa)', gP > 0, `gioco minimo ${gP.toFixed(1)} cm (${wP})`]);
  out.push(['Piante ↔ fondo del carrello', gV > 0, `gioco ${gV.toFixed(1)} cm`]);
  out.push(['Braccetto ↔ ferri della ringhiera', gR > 0, `gioco minimo ${gR.toFixed(1)} cm`]);
  out.push(['Braccetto ↔ tubo flessibile', gH > 0, `gioco minimo ${gH.toFixed(1)} cm (${wH})`]);
  POTS.forEach((x, i) => { M.update(x, ARM_DEG); const T = M.tip(), v = AMB.vasi[i], drift = .4 + 2 * Math.sqrt(2 * (T.y - v.h / 10) / 260);
    const d = Math.hypot(T.x - v.x / 10, T.z - v.z / 10) + drift; out.push([`Gocce dentro il vaso ${i + 1}`, d < v.rIn / 10, `ugello a ${(d - drift).toFixed(1)} cm dal centro (+${drift.toFixed(1)} deriva), raggio utile ${(v.rIn / 10).toFixed(1)} cm`]); });
  M.update(...salva); invalidaTubo(); updateHose(S.bx);
  for (const [n, ok, d] of out) console.log(`%c${ok ? 'PASS' : 'FAIL'}%c [Ambiente] ${n} — ${d}`, `font-weight:bold;color:${ok ? '#16723a' : '#b3261e'}`, 'color:inherit');
  return out;
}


// righe 2721-2745: avvio dell'ambiente
export function initAmbiente() {
  scene.add(ambiente);
  const intonaco = null;   // v2: intonaci fotografici CC0 (caricaTerna)
  creaSfondo(); creaLuci(); miglioraPavimento(); creaSoletta(intonaco); creaMuro(intonaco); miglioraRinghiera(); creaVasi(); creaFascetteFilo();
  // meno draw call: unisci le parti statiche della presentazione
  const fisse = o => o === reelSpin || o === waterMesh || o === hoseTube || o === hoseCable || rings.includes(o) || o.userData.container || o === motSpin || o === idlerSpin;
  for (const g of [gWall, gSt, gBay, gPsu, gFuse, gBrd, gDrv, gSock, gCab, gTube, gWire, gTank, gPump, gReel, compsByKey.fc0, compsByKey.fc1, compsByKey.stazione]) if (g) unisci(g, fisse, false);
  window.AMB_UNISCI = unisciMeccanismo; unisciMeccanismo(window.MAINM);
  if (MOBILE) INQ.panoramica.w = 230;               // sul telefono (schermo verticale) la panoramica è più stretta
  Object.assign(GENERAL, INQ.panoramica);
  // etichette dell'ambiente (vista generale; sul telefono solo le principali)
  const S0 = AMB.vasi[1];
  label('Serbatoio e pompa', scene, V(19, 30, 30), 'amb', '', { prim: true });
  label('Vasi', scene, V(S0.x / 10, S0.h / 10 + 14, S0.z / 10 + 14), 'amb', '', { prim: true });
  label('Tubo flessibile sul filo', scene, V(120, HOSE_Y - 4, WIRE_Z), 'amb');
  select(null); completaTween();
  // camera: mai sotto il pavimento, mai dal lato strada né dietro il muro laterale; movimenti morbidi
  controls.minDistance = 30; controls.maxDistance = 900; controls.minPolarAngle = .08; controls.maxPolarAngle = Math.PI * .45;
  controls.minAzimuthAngle = -.35; controls.maxAzimuthAngle = 1.65;
  $('vistePres').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.q) inquadratura(b.dataset.q); });
  document.querySelector('#vistePres [data-q="panoramica"]').classList.add('on');
  window.AMB_PRONTO = true;
  if (DEV) { window.verificaAmbiente = verificaAmbiente; verificaAmbiente(); }
}
