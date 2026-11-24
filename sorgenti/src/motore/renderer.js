// Renderer, scena e camera della presentazione (righe 368-393 dell'originale).
// Antialiasing nativo, tone mapping Neutral, rendering su richiesta (ui/presentazione.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from './CSS2DRenderer160.js';
import { $ } from '../util.js';
import { Pipeline } from './pipeline.js';
import { qualita } from './qualita.js';
import { FLAGS, GOV, sogliaLento } from './perf.js';

/* Renderer, scena, camera */
export const vp = $('viewport');
export const renderer = new THREE.WebGLRenderer({ antialias: FLAGS.aa, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);   // trasparente: sotto c'è lo sfondo CSS
// pixel ratio: desktop pieno (fino a 2) a camera ferma e ×0,75 in movimento; mobile FISSO min(DPR, prMax),
// nessun cambio tra riposo e moto (il cambio ridimensionava il canvas: picco di 44 ms misurato su iPhone)
export const MOBILE_FISSO = qualita.nome === 'Mobile';
export let PR_PIENO = Math.min(window.devicePixelRatio || 1, qualita.p.prMax);
export let PR_MOTO = MOBILE_FISSO ? PR_PIENO : Math.max(1, PR_PIENO * .75);
export const PR_MOTO0 = PR_MOTO;   // valore iniziale (prima del governor)
// diagnosi (?diag=1): DPR fisso (v > 0) e governor spento
export const DPR_FORZATO = { v: 0 };
renderer.setPixelRatio(PR_PIENO);
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
vp.appendChild(renderer.domElement);
export const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.id = 'labels';
vp.appendChild(labelRenderer.domElement);

export const scene = new THREE.Scene();
scene.background = null;
export const camera = new THREE.PerspectiveCamera(42, 1, 1, 20000);
camera.position.set(330, 230, 300);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .09;
controls.rotateSpeed = .7;
controls.zoomSpeed = .8;
controls.screenSpacePanning = true;
controls.minDistance = 8;
controls.maxDistance = 1600;
controls.maxPolarAngle = Math.PI * .5;
controls.target.set(105, 55, 35);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd3d9e0, 2.4));
export const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(180, 320, 260); scene.add(sun);
export const fill = new THREE.DirectionalLight(0xffffff, .9); fill.position.set(-220, 160, -140); scene.add(fill);

export const pipeline = new Pipeline(renderer, scene, camera);
// governor (solo mobile, unico DPR fisso): conta i frame disegnati in finestre di 1 s di tempo disegnato.
// Finestra "lenta" = più del 10 % dei frame oltre 1,5 × vsync misurato. 2 finestre lente consecutive (2 s) → DPR −0,25
// (minimo 1,5); risale di 0,25 solo dopo 5 s di finestre buone consecutive (massimo il DPR del tier); al più un cambio ogni 3 s.
// A scena ferma non si disegna e non si conta nulla: il governor agisce solo su ciò che l'utente vede muoversi.
const GOV_MIN = 1.5, GOV_MAX = PR_PIENO;
let finMs = 0, finTot = 0, finLenti = 0, lenteDi = 0, buoneMs = 0, ultimoCambio = -1e9;
export function governa(dt, t) {
  if (DPR_FORZATO.v || !MOBILE_FISSO || GOV_MAX <= GOV_MIN || !dt || dt > 250) return;
  finMs += dt; finTot++; if (dt > sogliaLento()) finLenti++;
  if (finMs < 1000) return;
  const lenta = finTot >= 10 && finLenti > finTot * .1;
  finMs = finTot = finLenti = 0;
  if (lenta) { lenteDi++; buoneMs = 0; } else { lenteDi = 0; buoneMs += 1000; }
  if (t - ultimoCambio < 3000) return;
  let v = PR_PIENO;
  if (lenteDi >= 2) v = Math.max(GOV_MIN, PR_PIENO - .25);
  else if (buoneMs >= 5000) v = Math.min(GOV_MAX, PR_PIENO + .25);
  if (v === PR_PIENO) return;
  GOV.cambi++; GOV.ultimo = `${PR_PIENO}→${v} a ${(t / 1000).toFixed(1)} s`;
  PR_PIENO = PR_MOTO = v; ultimoCambio = t; lenteDi = 0; buoneMs = 0;
  renderer.setPixelRatio(v);   // unico punto del loop che cambia il DPR: solo quando il valore cambia davvero
}
// mapSize dell'ombra del sole (usato solo da ?diag=1, riga R): la shadow map viene liberata e ricreata alla dimensione nuova al prossimo ricalcolo
// (stesso programma shader: la dimensione è un uniform). Restituisce true se è cambiata davvero.
export function mappaOmbra(sz) {
  if (sun.shadow.mapSize.x === sz) return false;
  sun.shadow.mapSize.set(sz, sz);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  renderer.shadowMap.needsUpdate = true;
  return true;
}
// pixel ratio: ridotto durante il movimento della camera, pieno a camera ferma (su mobile i due valori coincidono).
// Chiamata solo ai passaggi riposo ↔ moto, non a ogni frame; restituisce true se il valore è cambiato davvero.
export function pixelRatio(inMoto) {
  const pr = DPR_FORZATO.v || (inMoto ? PR_MOTO : PR_PIENO);
  if (renderer.getPixelRatio() === pr) return false;
  renderer.setPixelRatio(pr); return true;
}
