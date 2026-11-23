// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';
import { CSS2DObject } from '../motore/CSS2DRenderer160.js';
import { V, rad } from '../util.js';
import { RAIL_Y, RAIL_Z, RAIL_X0, RAIL_X1, PUL_Y, PUL_R, MOT_X, IDL_X, WIRE_Y, WIRE_Z, HOSE_Y, POT_Z, POTS, GHOST_X, HOME, PIVOT_Y, PIVOT_Z, ARM_L, ARM_DEG, CLAMPS, SECTION_X, N_RINGS, DROPS } from '../dati/config.js';
import { scene } from '../motore/renderer.js';
import { qualita } from '../motore/qualita.js';
import { mat, edgeMat, dashMat, pompaMat, valvMat, clipMats } from '../materiali/libreria.js';

// righe 431-781
/* Utilità per costruire */
export const pickables = [];
export const compsByKey = {};
export function comp(key, parent = scene) { const g = new THREE.Group(); g.userData.key = key; parent.add(g); if (!compsByKey[key]) compsByKey[key] = g; return g; }
export function add(geo, material, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  g.add(m); pickables.push(m); return m;
}
export const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const C = (rt, rb, h, s = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
export const Cz = (r, h, s = 20) => C(r, r, h, s).rotateX(Math.PI / 2);
export const Cx = (r, h, s = 16) => C(r, r, h, s).rotateZ(Math.PI / 2);
export function tubeAlong(points, r, material, g, segs = 48) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return add(new THREE.TubeGeometry(curve, segs, r, 8, false), material, g);
}

/* Etichette */
export const labels = [];
export function label(text, parent, pos, cat, cls = '', extra = {}) {
  const d = document.createElement('div'); d.className = 'lbl ' + cls; d.textContent = text;
  const o = new CSS2DObject(d); o.position.copy(pos); parent.add(o);
  const e = Object.assign({ o, cat, d }, extra); labels.push(e); return e;
}

/* ===== SCENA ===== */
export const gFloor = comp('pavimento');
add(B(300, 4, 100), mat.pavimento, gFloor, 150, -2, 50);
{
  const p = [];
  for (let x = 50; x < 300; x += 50) p.push(x, .06, 0, x, .06, 100);
  p.push(0, .06, 50, 300, .06, 50);
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const lm = new THREE.LineBasicMaterial({ color: 0xc8cdd4 }); clipMats.push(lm);
  gFloor.add(new THREE.LineSegments(lg, lm));
}

export const gWall = comp('porta');
add(B(10, 260, 30), mat.muro, gWall, -5, 130, 15);
add(B(10, 260, 10), mat.muro, gWall, -5, 130, 95);
add(B(10, 40, 60), mat.muro, gWall, -5, 240, 60);
add(B(11, 220, 3), mat.telaio, gWall, -5, 110, 31.5);
add(B(11, 220, 3), mat.telaio, gWall, -5, 110, 88.5);
add(B(11, 3, 60), mat.telaio, gWall, -5, 218.5, 60);
add(B(11, 2, 60), mat.telaio, gWall, -5, 1, 60);
add(B(1, 214, 54), mat.vetro, gWall, -4, 109, 60);
add(B(1.6, 1.6, 9), mat.fissaggi, gWall, -2.6, 105, 80);

export const gRail0 = comp('ringhiera');
add(B(300, 4, 5), mat.ringhiera, gRail0, 150, 150, 0);
add(B(300, 3, 3), mat.ringhiera, gRail0, 150, 8, 0);
add(B(4, 152, 4), mat.ringhiera, gRail0, 2, 76, 0);
add(B(4, 152, 4), mat.ringhiera, gRail0, 298, 76, 0);
export const barGeo = C(.8, .8, 140, 10);
for (let x = 12; x < 297; x += 12) add(barGeo, mat.ringhiera, gRail0, x, 79, 0);

export const gTrack = comp('rotaia');
add(B(RAIL_X1 - RAIL_X0, 2, 2), mat.rotaia, gTrack, (RAIL_X0 + RAIL_X1) / 2, RAIL_Y, RAIL_Z);

export const gClamp = comp('morsetti');
export const tieGeo = new THREE.TorusGeometry(1.1, .18, 6, 18);
for (const x of CLAMPS) {
  add(B(2.4, 3, 1.2), mat.fissaggi, gClamp, x, RAIL_Y, 1.4);
  for (const y of [73.2, 76.8]) { const t = add(tieGeo, mat.scuro, gClamp, x, y, .6, Math.PI / 2); t.scale.set(1, 1.3, 1); }
}

export const gBelt = comp('cinghia');
export const beltLen = IDL_X - MOT_X;
add(B(beltLen, .5, 1), mat.cinghia, gBelt, (MOT_X + IDL_X) / 2, PUL_Y + PUL_R, RAIL_Z);
add(B(beltLen, .5, 1), mat.cinghia, gBelt, (MOT_X + IDL_X) / 2, PUL_Y - PUL_R, RAIL_Z);
export const halfLoop = new THREE.TorusGeometry(PUL_R, .26, 6, 20, Math.PI);
add(halfLoop, mat.cinghia, gBelt, MOT_X, PUL_Y, RAIL_Z, 0, 0, Math.PI / 2);
add(halfLoop, mat.cinghia, gBelt, IDL_X, PUL_Y, RAIL_Z, 0, 0, -Math.PI / 2);
{
  const tg = B(.35, .35, 1.02);
  for (let x = MOT_X + 2; x < IDL_X - 1; x += 3) add(tg, mat.cinghia, gBelt, x, PUL_Y + PUL_R - .35, RAIL_Z);
}

export const gIdler = comp('rinvio');
export const idlerSpin = new THREE.Group(); idlerSpin.position.set(IDL_X, PUL_Y, RAIL_Z); gIdler.add(idlerSpin);
add(Cz(1.75, 1.4), mat.fissaggi, idlerSpin);
add(B(.4, 1.5, 1.45), mat.scuro, idlerSpin, 0, 1, 0);
add(B(5, 11, .6), mat.fissaggi, gIdler, 185, 79, 1.5);
add(Cz(.3, 2.4), mat.fissaggi, gIdler, IDL_X, PUL_Y, 2.4);

export function endstop(key, x, dir) {
  const g = comp(key);
  add(B(2, 2.4, 1.6), mat.elettronica, g, x, 72.2, RAIL_Z);
  add(B(2.4, .25, .6), mat.fissaggi, g, x + dir * 2, 72.6, RAIL_Z + .4, 0, 0, dir * .25);
  add(B(.8, 2, .8), mat.fissaggi, g, x, 74, 2.2);
  return g;
}
endstop('fc0', 37, 1);
endstop('fc1', 179, -1);

export const gWire = comp('cavetto');
add(Cx(.15, RAIL_X1 - 34, 6), mat.fissaggi, gWire, (34 + RAIL_X1) / 2, WIRE_Y, WIRE_Z);
add(B(1.2, 18, 1.2), mat.fissaggi, gWire, 186.6, 66.5, 3.5);
add(new THREE.TorusGeometry(1, .2, 6, 14), mat.fissaggi, gWire, 34.2, WIRE_Y, WIRE_Z, 0, Math.PI / 2);
export const ringGeo = new THREE.TorusGeometry(1.6, .22, 6, 16);
add(ringGeo, mat.fissaggi, gWire, 35, 57.2, WIRE_Z, 0, Math.PI / 2);
export const rings = [];
for (let i = 0; i < N_RINGS; i++) rings.push(add(ringGeo, mat.fissaggi, gWire, 40, 57.2, WIRE_Z, 0, Math.PI / 2));

export const potLabels = [];
export function makePot(x, key, n) {
  const g = comp(key);
  add(C(10, 7.5, 25, 30, true), mat.vaso, g, x, 12.5, POT_Z);
  add(new THREE.CircleGeometry(7.5, 30), mat.vaso, g, x, .2, POT_Z, -Math.PI / 2);
  add(new THREE.TorusGeometry(10, .7, 8, 30), mat.vaso, g, x, 25, POT_Z, Math.PI / 2);
  add(new THREE.CircleGeometry(9.5, 30), mat.terra, g, x, 22.5, POT_Z, -Math.PI / 2);
  const s = new THREE.SphereGeometry(1, 12, 8);
  [[-3, 26.5, -2, 4.2], [3, 27.5, 2, 3.8], [0, 29.5, -.5, 3.6], [-1, 26, 4, 3]].forEach(([dx, y, dz, r]) => {
    const m = add(s, mat.pianta, g, x + dx, y, POT_Z + dz); m.scale.set(r, r * .75, r);
  });
  potLabels[n] = label(`Vaso ${n + 1}`, scene, V(x, 8, POT_Z + 11), 'pots', '', { base: `Vaso ${n + 1}` });
  return g;
}
POTS.forEach((x, i) => makePot(x, 'vaso' + (i + 1), i));

{
  const g = comp('ghost');
  add(C(10, 7.5, 25, 30, true), mat.ghost, g, GHOST_X, 12.5, POT_Z);
  const circle = (r, y) => { const p = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; p.push(V(GHOST_X + r * Math.cos(a), y, POT_Z + r * Math.sin(a))); } return p; };
  for (const [r, y] of [[10, 25], [7.5, .3]]) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle(r, y)), dashMat); l.computeLineDistances(); g.add(l); }
  const vpts = [];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; vpts.push(V(GHOST_X + 7.5 * Math.cos(a), .3, POT_Z + 7.5 * Math.sin(a)), V(GHOST_X + 10 * Math.cos(a), 25, POT_Z + 10 * Math.sin(a))); }
  const ls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(vpts), dashMat); ls.computeLineDistances(); g.add(ls);
  label('Vaso in più', scene, V(GHOST_X - 6, 31, POT_Z), 'vasi');
}

/* Stazione base */
export const gSt = comp('stazione');
for (const [x, z] of [[4.8, 5.8], [33.2, 5.8], [4.8, 26.2], [33.2, 26.2]]) add(B(1.6, 96, 1.6), mat.telaio, gSt, x, 48, z);
add(B(30, 1.5, 22), mat.telaio, gSt, 19, .75, 16);
add(B(30, 1, 22), mat.telaio, gSt, 19, 31, 16);
add(B(30, 1, 22), mat.telaio, gSt, 19, 63.5, 16);
add(B(36, 1, 30), mat.telaio, gSt, 19, 97.5, 16, 0, 0, -.05);
add(B(3, 7, 7), mat.telaio, gSt, 24, 35, 8);

export const gTank = comp('serbatoio');
export const tankShell = add(B(20, 25, 20), mat.vasca, gTank, 19, 14, 16); tankShell.userData.container = true;
add(B(20.6, 1, 20.6), mat.vasca, gTank, 19, 27, 16).userData.container = true;
export const waterMesh = add(B(19, 1, 19), mat.acquaVasca, gTank, 19, 2, 16); waterMesh.userData.container = true;
{ const e = new THREE.LineSegments(new THREE.EdgesGeometry(B(20, 25, 20)), edgeMat); e.position.set(19, 14, 16); gTank.add(e); }
export function setTank(L) { const h = 23 * Math.max(0, L) / 10; waterMesh.scale.y = Math.max(.01, h); waterMesh.position.y = 2 + h / 2; }
setTank(10);
export const gPump = comp('pompa');
add(C(2.6, 2.6, 5), pompaMat, gPump, 23, 4.6, 20);
add(C(1.6, 1.6, 1.2), mat.elettronica, gPump, 23, 7.6, 20);

export const gReel = comp('avvolgitubo');
export const reelSpin = new THREE.Group(); reelSpin.position.set(24, 46, 8); gReel.add(reelSpin);
add(Cz(8.5, .6), mat.fissaggi, reelSpin, 0, 0, -3);
add(Cz(8.5, .6), mat.fissaggi, reelSpin, 0, 0, 3);
add(Cz(4, 6), mat.telaio, reelSpin);
add(B(16, .8, .7), mat.scuro, reelSpin, 0, 0, 3.4);
export const wound = add(new THREE.CylinderGeometry(1, 1, 5.2, 24).rotateX(Math.PI / 2), mat.acqua, reelSpin);
export const woundCable = add(new THREE.CylinderGeometry(1.01, 1.01, 1.2, 24).rotateX(Math.PI / 2), mat.cavo, reelSpin, 0, 0, 1.6);
add(Cz(3, 2), mat.fissaggi, gReel, 24, 46, 12.4);
export function setWound(r) { wound.scale.set(r, r, 1); woundCable.scale.set(r + .02, r + .02, 1); }

export const gBay = comp('vano');
export const bayBox = add(B(30, 26, 22), mat.vano, gBay, 19, 77, 16); bayBox.userData.container = true;
{ const e = new THREE.LineSegments(new THREE.EdgesGeometry(B(30, 26, 22)), edgeMat); e.position.set(19, 77, 16); gBay.add(e); }
export const gPsu = comp('alimentatore'); add(B(10, 5, 7), mat.elettronica, gPsu, 11, 66.5, 10.5);
export const gFuse = comp('fusibile'); add(Cx(.9, 3.5), mat.elettronica, gFuse, 18.5, 65, 10.5); add(Cx(.95, .8), mat.fissaggi, gFuse, 18.5, 65, 10.5);
export const gBrd = comp('centralina');
add(B(10, 1.2, 7), mat.elettronica, gBrd, 12, 64.6, 21);
add(B(2.4, .7, 2.4), mat.scuro, gBrd, 11, 65.5, 21);
add(C(.25, .25, 5), mat.scuro, gBrd, 16, 67.5, 23.5);
export const gDrv = comp('driver'); add(B(5, 2, 5), mat.elettronica, gDrv, 23.5, 65, 21);
export const gMot = comp('motore');
add(Cz(2.8, 6), mat.elettronica, gMot, MOT_X, PUL_Y, 9);
add(B(7, 7, .6), mat.fissaggi, gMot, MOT_X, PUL_Y, 5.6);
add(Cz(.3, 3.6), mat.fissaggi, gMot, MOT_X, PUL_Y, 4.4);
export const motSpin = new THREE.Group(); motSpin.position.set(MOT_X, PUL_Y, RAIL_Z); gMot.add(motSpin);
add(Cz(1.75, 1.4), mat.fissaggi, motSpin);
add(B(.4, 1.5, 1.45), mat.scuro, motSpin, 0, 1, 0);

export const gSock = comp('presa');
add(B(1.2, 9, 9), mat.presa, gSock, .6, 100, 18);
add(B(2.6, 4, 4), mat.scuro, gSock, 1.9, 100, 18);
export const gCab = comp('cavo');
tubeAlong([V(8, 69, 10.5), V(8, 88, 10.5), V(7, 92, 12), V(4.5, 97, 15.5), V(3.2, 100, 18)], .3, mat.cavo, gCab);
tubeAlong([V(21.5, 8, 18.5), V(21.5, 27, 18.5), V(14, 30, 25.5), V(7, 36, 27.5), V(6.5, 55, 27.5), V(7, 63.8, 25)], .28, mat.cavo, gCab);
tubeAlong([V(27, 64, 12.6), V(27.5, 57, 12.8), V(25, 50, 12.8), V(24, 47, 12.2)], .28, mat.cavo, gCab);
tubeAlong([V(179, 71.2, 2.6), V(178, 72.4, 1.7), V(110, 72.4, 1.7), V(40, 72.4, 1.7), V(36, 72.4, 3), V(34.2, 72, 6)], .2, mat.cavo, gCab, 80);
export const gTube = comp('tubo');
tubeAlong([V(23, 8, 20), V(23, 27.5, 20), V(23.5, 33, 17), V(24.5, 41, 14.5), V(24, 46, 12.2)], .4, mat.acqua, gTube);

/* Box (carrello) */
export const boxG = comp('box');
export const parts = {};
export function part(key, off) { const g = new THREE.Group(); g.userData.key = key; boxG.add(g); parts[key] = { g, off }; compsByKey[key] = g; return g; }
export const pBody = part('involucro', V(0, 0, 0));
add(B(8, .3, 6), mat.box, pBody, 0, 64.15, 6);
add(B(8, 5.4, .3), mat.box, pBody, 0, 66.7, 3.15);
add(B(8, 5.4, .3), mat.box, pBody, 0, 66.7, 8.85);
add(B(.3, 5.4, 5.4), mat.box, pBody, -3.85, 66.7, 6);
add(B(.3, 5.4, 5.4), mat.box, pBody, 3.85, 66.7, 6);
{ const e = new THREE.LineSegments(new THREE.EdgesGeometry(B(8, 5.4, 6)), edgeMat); e.position.set(0, 66.7, 6); pBody.add(e); }
export const pLid = part('coperchio', V(0, 8, 0));
add(B(8, .4, 6), mat.box, pLid, 0, 69.8, 6);
{ const e = new THREE.LineSegments(new THREE.EdgesGeometry(B(8, .4, 6)), edgeMat); e.position.set(0, 69.8, 6); pLid.add(e); }
export const pGask = part('guarnizione', V(0, 4.5, 0));
add(B(8, .22, .45), mat.scuro, pGask, 0, 69.5, 3.25); add(B(8, .22, .45), mat.scuro, pGask, 0, 69.5, 8.75);
add(B(.45, .22, 5.1), mat.scuro, pGask, -3.75, 69.5, 6); add(B(.45, .22, 5.1), mat.scuro, pGask, 3.75, 69.5, 6);
export const pCar = part('attacco_rotaia', V(-11, 8, 0));
add(B(8, .4, 3), mat.fissaggi, pCar, 0, 77.8, 3.6);
add(B(8, 7.8, .5), mat.fissaggi, pCar, 0, 73.9, 4.6);
for (const dx of [-2.5, 2.5]) { add(Cz(.75, 1.6), mat.scuro, pCar, dx, 76.75, 3); add(Cz(.6, 1.2), mat.scuro, pCar, dx, 73.4, 3.6); }
export const pBelt = part('attacco_cinghia', V(11, 3, 0));
add(B(3, 1.8, 1.6), mat.scuro, pBelt, 0, 79, RAIL_Z);
export const pValve = part('valvola', V(-13, -2, 4));
add(Cx(1, 3.4), valvMat, pValve, -1.2, 65.6, 5.4);
add(B(1.6, 1.4, 1.6), mat.elettronica, pValve, -1.2, 67.1, 5.4);
export const pServo = part('servo', V(13, -2, 4));
add(B(2.4, 2.2, 1.6), mat.elettronica, pServo, 1.8, 65.7, 7.2);
add(Cx(.35, 1.2), mat.box, pServo, 3.3, 65.2, 7.2);
export const pGland = part('pressacavi', V(-6, -8, 3));
for (const z of [4.4, 5.9]) { add(C(.6, .6, 1.2, 12), mat.cavo, pGland, -2, 63.4, z); add(C(.85, .85, .35, 6), mat.cavo, pGland, -2, 63.95, z); }
export const pArm = part('braccetto', V(6, -3, 6));
add(B(3, .8, 1.4), mat.fissaggi, pArm, 0, 63.7, PIVOT_Z);
export const pivot = new THREE.Group(); pivot.position.set(0, PIVOT_Y, PIVOT_Z); pArm.add(pivot);
add(Cx(.7, 3), mat.fissaggi, pivot);
add(C(.45, .45, ARM_L, 12), mat.acqua, pivot, 0, -ARM_L / 2, 0);
add(C(.9, 1.7, 3, 16, true), mat.schermo, pivot, 0, -ARM_L + 1.2, 0);
export const gLead = comp('cavetto', boxG);
add(ringGeo, mat.fissaggi, gLead, -5, 57.2, WIRE_Z, 0, Math.PI / 2);
add(B(.3, 5.4, .3), mat.fissaggi, gLead, -4.3, 61.4, 4.6);

/* Tubo e cavo che seguono la box */
export const hoseTube = add(new THREE.BufferGeometry(), mat.acqua, gTube);
export const hoseCable = add(new THREE.BufferGeometry(), mat.cavo, gCab);
export function hosePts(bx, zr, z, gz, kind) {
  const lead = bx - 5, xs = [35];
  for (let i = 1; i <= N_RINGS; i++) xs.push(35 + (lead - 35) * i / (N_RINGS + 1));
  xs.push(lead);
  const pts = [V(24, 53.9, zr), V(29.5, 55.7, (zr + z) / 2), V(35, HOSE_Y, z)];
  for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1], b = xs[i], s = b - a;
    if (s > 3) pts.push(V((a + b) / 2, HOSE_Y - Math.min(1, s * .06), z));
    pts.push(V(b, HOSE_Y, z));
  }
  const E = window.MAINM && window.MAINM.root.visible ? window.MAINM.gland(kind) : null;   // pressacavo / passaparete della box nuova
  // dal filo il tubo scende sotto la box lontano dal braccetto (≥ 3 cm di lato), poi entra nel passaparete dal lato balcone
  if (E) pts.push(V(Math.min(E.x, bx) - 3.2, (HOSE_Y + E.y) / 2 - 3, E.z + 2), V(E.x - 1.8, E.y - 1.5, E.z + 4), V(E.x, E.y, E.z + 2.5), V(E.x, E.y, E.z));
  else pts.push(V(bx - 3.6, 59.6, (z + gz) / 2), V(bx - 2, 62.7, gz));
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) if (pts[i].distanceTo(out[out.length - 1]) > .35) out.push(pts[i]);
  return { pts: out, xs };
}
let lastHoseX = null;
// v3 (punto 8): tubo e cavo con geometria preallocata (stessa struttura di TubeGeometry: 121 anelli × 7 vertici, UV e indici fissi);
// a ogni spostamento si riscrivono solo posizioni e normali. Curve riusate; telaio a trasporto parallelo (nessuna torsione).
const SEG_T = 120, RAD_T = 6, curvaTubo = new THREE.CatmullRomCurve3([], false, 'centripetal'), curvaCavo = new THREE.CatmullRomCurve3([], false, 'centripetal');
const _c = new THREE.Vector3(), _c2 = new THREE.Vector3(), _tg = new THREE.Vector3(), _nn = new THREE.Vector3(), _bb = new THREE.Vector3(), _tmp = new THREE.Vector3();
function geometriaTubo() {
  const n = (SEG_T + 1) * (RAD_T + 1), uv = new Float32Array(n * 2), idx = [];
  for (let i = 0; i <= SEG_T; i++) for (let j = 0; j <= RAD_T; j++) { const k = i * (RAD_T + 1) + j; uv[k * 2] = i / SEG_T; uv[k * 2 + 1] = j / RAD_T; }
  for (let i = 1; i <= SEG_T; i++) for (let j = 1; j <= RAD_T; j++) { const a = (RAD_T + 1) * (i - 1) + (j - 1), b = (RAD_T + 1) * i + (j - 1), c = (RAD_T + 1) * i + j, d = (RAD_T + 1) * (i - 1) + j; idx.push(a, b, d, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
function tuboSulPosto(mesh, curva, pts, r) {
  if (!mesh.geometry.attributes.position) { mesh.geometry.dispose(); mesh.geometry = geometriaTubo(); }
  curva.points = pts; curva.updateArcLengths();
  const P = mesh.geometry.attributes.position.array, Nn = mesh.geometry.attributes.normal.array;
  for (let i = 0; i <= SEG_T; i++) {
    const u = i / SEG_T; curva.getPointAt(u, _c); curva.getPointAt(Math.min(1, u + 1e-3), _c2); curva.getPointAt(Math.max(0, u - 1e-3), _tmp);
    _tg.subVectors(_c2, _tmp).normalize();
    if (i === 0) { _nn.set(0, 1, 0); if (Math.abs(_tg.y) > .9) _nn.set(1, 0, 0); }
    _nn.addScaledVector(_tg, -_nn.dot(_tg)).normalize(); _bb.crossVectors(_tg, _nn);   // trasporto parallelo
    for (let j = 0; j <= RAD_T; j++) {
      const v = j / RAD_T * Math.PI * 2, sn = Math.sin(v), cs = -Math.cos(v), k = (i * (RAD_T + 1) + j) * 3;
      const nx = cs * _nn.x + sn * _bb.x, ny = cs * _nn.y + sn * _bb.y, nz = cs * _nn.z + sn * _bb.z;
      Nn[k] = nx; Nn[k + 1] = ny; Nn[k + 2] = nz; P[k] = _c.x + r * nx; P[k + 1] = _c.y + r * ny; P[k + 2] = _c.z + r * nz;
    }
  }
  mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.attributes.normal.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
}
export function invalidaTubo() { lastHoseX = null; }
export function updateHose(bx) {
  if (lastHoseX !== null && Math.abs(bx - lastHoseX) < .02) return;
  lastHoseX = bx;
  const a = hosePts(bx, 7, 3.4, 4.4, 'tubo'), b = hosePts(bx, 9.4, 4.6, 5.9, 'cavo');
  tuboSulPosto(hoseTube, curvaTubo, a.pts, .4); tuboSulPosto(hoseCable, curvaCavo, b.pts, .3);
  for (let i = 0; i < N_RINGS; i++) rings[i].position.x = a.xs[i + 1];
  const out = bx - HOME;
  setWound(7.6 - out / 130 * 1.6);
  reelSpin.rotation.z = -out / 6.5;
  motSpin.rotation.z = out / 1.75;
  idlerSpin.rotation.z = out / 1.75;
}

/* Gocce */
// v2: acqua vera (trasmissione con IOR 1,333 su Alta/Ultra), gocce allungate lungo la velocità: il getto si assottiglia e si spezza
export const matGocce = qualita.p.trasmissione
  ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .02, metalness: 0, transmission: 1, ior: 1.333, thickness: .6, attenuationColor: new THREE.Color(0xdff3f2), attenuationDistance: 8, specularIntensity: 1 })
  : new THREE.MeshPhysicalMaterial({ color: 0xd8ecf2, roughness: .03, metalness: 0, transparent: true, opacity: .55, ior: 1.333, specularIntensity: 1, depthWrite: false });
export const dropMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.38, 12, 8), matGocce, DROPS);
dropMesh.frustumCulled = false; dropMesh.raycast = () => {};
scene.add(dropMesh);
export const drops = Array.from({ length: DROPS }, () => ({ on: false, p: V(0, 0, 0), v: V(0, 0, 0) }));
export const tmpM = new THREE.Matrix4(), zeroM = new THREE.Matrix4().makeScale(0, 0, 0);
for (let i = 0; i < DROPS; i++) dropMesh.setMatrixAt(i, zeroM);
let spawnAcc = 0;
const _qg = new THREE.Quaternion(), _su = new THREE.Vector3(0, 1, 0), _dv = new THREE.Vector3(), _sg = new THREE.Vector3();
export function updateDrops(dt, emitting) {
  if (emitting) {
    spawnAcc += dt * 70;
    const tip = window.MAINM && window.MAINM.root.visible ? window.MAINM.tip() : pivot.localToWorld(V(0, -ARM_L - .2, 0));
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      const d = drops.find(q => !q.on); if (!d) break;
      d.on = true; d.p.copy(tip).add(V((Math.random() - .5) * .8, 0, (Math.random() - .5) * .8));
      d.v.set((Math.random() - .5) * 4, -25 - Math.random() * 10, (Math.random() - .5) * 4);
    }
  }
  for (let i = 0; i < DROPS; i++) {
    const d = drops[i];
    if (d.on) {
      d.v.y -= 260 * dt; d.p.addScaledVector(d.v, dt);
      if (d.p.y < 22.8) d.on = false;
    }
    if (d.on) { const v = d.v.length(), k = Math.min(3.2, 1 + v / 60); _qg.setFromUnitVectors(_su, _dv.copy(d.v).normalize()); dropMesh.setMatrixAt(i, tmpM.compose(d.p, _qg, _sg.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)))); }
    else dropMesh.setMatrixAt(i, zeroM);
  }
  dropMesh.instanceMatrix.needsUpdate = true;
  dropMesh.visible = dropMesh.userData.vis !== false && drops.some(q => q.on);   // invisibile senza gocce: niente passaggio di trasmissione
}

/* Quote essenziali */
export const qMat = new THREE.LineBasicMaterial({ color: 0x5b4a00, depthTest: false, transparent: true });
export function quoteGroup() { const g = new THREE.Group(); g.visible = false; scene.add(g); return g; }
export function qLine(g, cat, a, b, tick, text, lp) {
  const t = tick.clone().multiplyScalar(1.8);
  const pts = [a, b, a.clone().add(t), a.clone().sub(t), b.clone().add(t), b.clone().sub(t)];
  const ls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), qMat); ls.renderOrder = 999; g.add(ls);
  if (text) label(text, g, lp || a.clone().add(b).multiplyScalar(.5), cat, 'q');
}
export const qTop = quoteGroup();
qLine(qTop, 'qtop', V(70, 1, 52), V(100, 1, 52), V(0, 0, 1), '30 cm', V(85, 1, 59));
qLine(qTop, 'qtop', V(100, 1, 52), V(130, 1, 52), V(0, 0, 1), '30 cm', V(115, 1, 59));
qLine(qTop, 'qtop', V(54, 1, 0), V(54, 1, 20), V(1, 0, 0), '20 cm', V(47, 1, 12));
export const qSide = quoteGroup();
export const SX = SECTION_X + 2;
qLine(qSide, 'qside', V(SX, 0, -15), V(SX, 150, -15), V(0, 0, 1), '150 cm', V(SX, 104, -15));
qLine(qSide, 'qside', V(SX, 0, -7), V(SX, RAIL_Y, -7), V(0, 0, 1), '75 cm', V(SX, 22, -7));
qLine(qSide, 'qside', V(SX, -2, 0), V(SX, -2, POT_Z), V(0, 1, 0), '20 cm', V(SX, -7, 10));
{
  const p = [];
  for (let i = 0; i <= 12; i++) { const a = rad(ARM_DEG * i / 12); p.push(V(SX, PIVOT_Y - 8 * Math.cos(a), PIVOT_Z + 8 * Math.sin(a))); }
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), qMat); arc.renderOrder = 999; qSide.add(arc);
  const ref = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([V(SX, PIVOT_Y, PIVOT_Z), V(SX, PIVOT_Y - 11, PIVOT_Z)]), qMat); ref.renderOrder = 999; qSide.add(ref);
  label('30°', qSide, V(SX, PIVOT_Y - 15, PIVOT_Z + 1), 'qside', 'q');
}

/* Etichette dei pezzi */
label('Finecorsa', scene, V(37, 68.6, RAIL_Z), 'rotaia');
label('Ringhiera', scene, V(60, 120, 0), 'rotaia');

label('Involucro', pBody, V(0, 66.7, 9.8), 'box', 'ex');
label('Coperchio', pLid, V(0, 71.6, 6), 'box', 'ex');
label('Guarnizione', pGask, V(9, 69.5, 6), 'box', 'ex');
label('Attacco rotaia', pCar, V(0, 80, 4), 'box', 'ex');
label('Attacco cinghia', pBelt, V(0, 81.6, RAIL_Z), 'box', 'ex');
label('Valvola', pValve, V(-1.2, 63.4, 5.4), 'box', 'ex');
label('Servo', pServo, V(1.8, 63.4, 7.2), 'box', 'ex');
label('Pressacavi', pGland, V(-2, 61.4, 5.2), 'box', 'ex');
label('Braccetto', pivot, V(0, -7, 1.5), 'box', 'ex');
label('Braccetto', pivot, V(0, -8, 12), 'braccetto');
label('Filo teso', scene, V(165, 60.5, WIRE_Z), 'filo');
label('Anelli', scene, V(100, 53, WIRE_Z), 'filo');
label('Tubo e cavo', scene, V(62, 60.5, WIRE_Z), 'filo');
label('Avvolgitubo', scene, V(24, 38.5, 13.5), 'filo');
label('Presa', scene, V(1, 107, 18), 'stazione');
label('Vano elettronica', scene, V(19, 93, 27.5), 'stazione');
label('Centralina', scene, V(16, 62.5, 25), 'stazione');
label('Alimentatore', scene, V(10, 73.5, 10.5), 'stazione');
label('Avvolgitubo', scene, V(24, 38.5, 13.5), 'stazione');
label('Serbatoio', scene, V(19, 22, 27), 'stazione');
label('Pompa', scene, V(23, 5, 27), 'stazione');
