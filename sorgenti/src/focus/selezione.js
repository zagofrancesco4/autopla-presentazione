// Messa a fuoco della parte selezionata: la parte resta a colori reali, il contesto è già reso "fantasma"
// da applyFocus (ui/presentazione.js); qui solo una luce di contorno bianca appena percettibile, con transizione di 350 ms.
// Nessun post-processing.
import * as THREE from 'three';

export class Fuoco {
  constructor(renderer, scene, camera, contorno = null) {
    Object.assign(this, { renderer, scene, camera });
    this.k = 0; this.kT = 0; this.centro = new THREE.Vector3();
    this.contorno = contorno || new THREE.DirectionalLight(0xffffff, 0); this.contorno.name = 'luceContorno';
    if (!this.contorno.parent) { scene.add(this.contorno); scene.add(this.contorno.target); }
  }
  setSize() { }
  imposta(radici) {
    radici = radici || [];
    this.kT = radici.length ? 1 : 0;
    if (radici.length) { const b = new THREE.Box3(); for (const r of radici) b.expandByObject(r); b.getCenter(this.centro); }
  }
  aggiorna(dt) {
    if (this.k !== this.kT) { const v = dt / .35; this.k = this.kT > this.k ? Math.min(this.kT, this.k + v) : Math.max(this.kT, this.k - v); }
    const e = this.k * this.k * (3 - 2 * this.k);
    const dir = new THREE.Vector3().subVectors(this.centro, this.camera.position).normalize();
    this.contorno.position.copy(this.centro).addScaledVector(dir, 400).add(new THREE.Vector3(0, 150, 0));
    this.contorno.target.position.copy(this.centro); this.contorno.target.updateMatrixWorld();
    this.contorno.intensity = 1.1 * e;
  }
}
