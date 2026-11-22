// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';

// righe 395-429
/* Materiali */
export const clipMats = [];
export function M(color, o = {}) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .7, metalness: .05 }, o));
  if (!o.transparent) m.side = THREE.DoubleSide;
  clipMats.push(m); return m;
}
export const mat = {
  ringhiera: M(0x3b4047, { roughness: .45, metalness: .35 }),
  rotaia: M(0xe8771c, { roughness: .45 }),
  cinghia: M(0xd2620f, { roughness: .6 }),
  box: M(0xffffff, { roughness: .35 }),
  acqua: M(0x2a7de1, { roughness: .35 }),
  cavo: M(0x16181b, { roughness: .55 }),
  elettronica: M(0x1fa45a, { roughness: .5 }),
  vaso: M(0xc4683f, { roughness: .85 }),
  pavimento: M(0xdfe3e7, { roughness: .95 }),
  fissaggi: M(0x8b929b, { roughness: .4, metalness: .45 }),
  scuro: M(0x4c525b, { roughness: .6 }),
  muro: M(0xeeeae3, { roughness: .95 }),
  telaio: M(0xb9bfc7, { roughness: .5 }),
  vetro: M(0xbfdcf2, { transparent: true, opacity: .35, roughness: .1 }),
  terra: M(0x4f3a2b, { roughness: 1 }),
  pianta: M(0x8fa070, { roughness: .9 }),
  vasca: M(0xffffff, { transparent: true, opacity: .3, roughness: .15, depthWrite: false }),
  acquaVasca: M(0x2a7de1, { transparent: true, opacity: .6, roughness: .2 }),
  vano: M(0xe6ecf1, { transparent: true, opacity: .25, roughness: .15, depthWrite: false }),
  ghost: M(0xc4683f, { transparent: true, opacity: .14, depthWrite: false }),
  schermo: M(0xdde5ec, { transparent: true, opacity: .85, roughness: .3 }),
  presa: M(0xf7f7f5, { roughness: .5 })
};
export const pompaMat = M(0x2a7de1, { roughness: .4, emissive: 0x000000 });
export const valvMat = M(0x2a7de1, { roughness: .35, emissive: 0x000000 });
export const edgeMat = new THREE.LineBasicMaterial({ color: 0x59636f }); clipMats.push(edgeMat);
export const dashMat = new THREE.LineDashedMaterial({ color: 0xc4683f, dashSize: 2.2, gapSize: 1.6 }); clipMats.push(dashMat);
