// Renderer, scena e camera della presentazione (righe 368-393 dell'originale).
// Antialiasing nativo, tone mapping Neutral, rendering su richiesta (ui/presentazione.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from './CSS2DRenderer160.js';
import { $ } from '../util.js';
import { Pipeline } from './pipeline.js';
import { qualita } from './qualita.js';

/* Renderer, scena, camera */
export const vp = $('viewport');
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);   // trasparente: sotto c'è lo sfondo CSS
// pixel ratio pieno (fino a 2) a camera ferma, un po' ridotto mentre la camera si muove
export let PR_PIENO = Math.min(window.devicePixelRatio || 1, qualita.p.prMax);
export let PR_MOTO = Math.max(1, PR_PIENO * .75);
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
// governor (solo mobile): se il p95 in movimento supera 20 ms scala il DPR di moto di 0,1 (min 1); risale sotto 12 ms.
// Isteresi: decisione al più ogni 2 s.
let ultimaDecisione = 0;
export function governa(p95, t) {
  if (qualita.nome !== 'Mobile' || !p95 || t - ultimaDecisione < 2000) return;
  const max = Math.max(1, PR_PIENO * .75);
  if (p95 > 20 && PR_MOTO > 1) { PR_MOTO = Math.max(1, +(PR_MOTO - .1).toFixed(2)); ultimaDecisione = t; }
  else if (p95 < 12 && PR_MOTO < max) { PR_MOTO = Math.min(max, +(PR_MOTO + .1).toFixed(2)); ultimaDecisione = t; }
}
// pixel ratio: ridotto durante il movimento della camera, pieno a camera ferma
export function pixelRatio(inMoto) {
  const pr = inMoto ? PR_MOTO : PR_PIENO;
  if (renderer.getPixelRatio() !== pr) renderer.setPixelRatio(pr);
}
