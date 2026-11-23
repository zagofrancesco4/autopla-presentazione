// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
// Integrazione nella presentazione: il nuovo meccanismo al posto di cinghia, rotaia e motore della stazione (righe 2308-2334).
import * as THREE from 'three';
import { V } from '../util.js';
import { CONFIG, RAIL_X0, RAIL_X1, RAIL_Y, RAIL_BAR_R } from '../dati/config.js';
import { scene } from '../motore/renderer.js';
import { gTrack, gBelt, gIdler, gMot, gClamp, pCar, pBelt, pickables, labels, label, compsByKey, updateHose, invalidaTubo } from '../scene/balcone.js';
import { renderables, keyOf, S, select, current } from '../ui/presentazione.js';
import * as Mecc from './mecc.js';
import { FLAGS } from '../motore/perf.js';

export function integra() {
for (const g of [gTrack, gBelt, gIdler, gMot, gClamp, pCar, pBelt]) g.visible = false;
{
  const mainLabels = [];
  Mecc.buildMain({
    lunghezza: (RAIL_X1 - RAIL_X0) * 10,                       // stesso tratto della vecchia rotaia (cm → mm)
    inizioFerri: (RAIL_X1 * 10) % (CONFIG.ringhiera.passoFerri), // ferri della scena: uno ogni 12 cm da x = 0
    staffaMin: CONFIG.staffe.prima,
    xFine: RAIL_X1, y: RAIL_Y,
    z: RAIL_BAR_R + (CONFIG.ringhiera.distanza + CONFIG.tubo.lato / 2) / 10,   // faccia dei ferri + distanza + mezzo tubo
    onBuild(M) {
      // registra le parti nuove per tocco, evidenza e trasparenze della presentazione
      for (const arr of [pickables, renderables]) for (let i = arr.length - 1; i >= 0; i--) if (arr[i].userData.mainMech) arr.splice(i, 1);
      mainLabels.forEach(l => { l.o.removeFromParent(); labels.splice(labels.indexOf(l), 1); }); mainLabels.length = 0;
      // v3 (Modulo 5.5): clearcoat leggero solo sul guscio della box (impostato prima del primo disegno: nessun cambio di programma a runtime)
      if (FLAGS.clearcoat) M.root.traverse(o => { if (o.isMesh && o.material.userData.tipo === 'petg' && o.material.isMeshPhysicalMaterial) { o.material.clearcoat = .4; o.material.clearcoatRoughness = .25; } });
      scene.add(M.root);
      M.root.traverse(o => { if (o.isMesh) { o.userData.mainMech = true; o.userData.k = keyOf(o); o.userData.orig = o.material; pickables.push(o); renderables.push(o); } });
      Object.assign(compsByKey, M.gruppi, { carrello: M.car });
      mainLabels.push(label('Tubo e cremagliera', scene, V(110, RAIL_Y - 5, 6), 'rotaia'),
        label('Staffa con fascette', M.root, V(M.D.staffe[1] ?? M.D.staffe[0], 45, 40), 'rotaia'),
        label('Cremagliera', scene, V(110, RAIL_Y + 5, 6), 'cinghia'),
        label('Box: motore e pignone', M.car, V(0, M.D.yTopOut + 25, 0), 'cinghia'));
      // v3: arco del servo (Line preallocata, 31 punti, solo setDrawRange): stessa variabile S.arm del braccetto
      { const r = CONFIG.braccetto.lunghezza * .45, n = 31, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const a = CONFIG.braccetto.angolo * Math.PI / 180 * i / (n - 1); pos[i * 3 + 1] = -r * Math.cos(a); pos[i * 3 + 2] = -r * Math.sin(a); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
        const arco = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf5b942, depthTest: false })); arco.renderOrder = 999; arco.raycast = () => { };
        arco.position.copy(M.pivot.position); M.pivot.parent.add(arco); M.arco = arco; M.arcoN = n; }
      window.MAINM = M; M.update(S.bx, S.arm); invalidaTubo(); updateHose(S.bx);
      if (window.AMB_UNISCI) window.AMB_UNISCI(M);
    }
  });
  select(current);
}
}
