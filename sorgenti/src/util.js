// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';

// righe 352-355
export const $ = id => document.getElementById(id);
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rad = THREE.MathUtils.degToRad;
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// sequenza di Halton (jitter dell'accumulo e del sole)
export function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }

// orologio con la stessa interfaccia di THREE.Clock (deprecato dalla r183): getDelta() in secondi, avvio al primo uso
export class Orologio { constructor() { this.t = null; } getDelta() { const n = performance.now(); const d = this.t === null ? 0 : (n - this.t) / 1000; this.t = n; return d; } }
