// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
// Integrazione nella presentazione: il nuovo meccanismo al posto di cinghia, rotaia e motore della stazione (righe 2308-2334).
import { V } from '../util.js';
import { CONFIG, RAIL_X0, RAIL_X1, RAIL_Y, RAIL_BAR_R } from '../dati/config.js';
import { scene } from '../motore/renderer.js';
import { gTrack, gBelt, gIdler, gMot, gClamp, pCar, pBelt, pickables, labels, label, compsByKey, updateHose, invalidaTubo } from '../scene/balcone.js';
import { renderables, keyOf, S, select, current } from '../ui/presentazione.js';
import * as Mecc from './mecc.js';

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
      scene.add(M.root);
      M.root.traverse(o => { if (o.isMesh) { o.userData.mainMech = true; o.userData.k = keyOf(o); o.userData.orig = o.material; pickables.push(o); renderables.push(o); } });
      Object.assign(compsByKey, M.gruppi, { carrello: M.car });
      mainLabels.push(label('Tubo e cremagliera', scene, V(110, RAIL_Y - 5, 6), 'rotaia'),
        label('Staffa con fascette', M.root, V(M.D.staffe[1] ?? M.D.staffe[0], 45, 40), 'rotaia'),
        label('Cremagliera', scene, V(110, RAIL_Y + 5, 6), 'cinghia'),
        label('Box: motore e pignone', M.car, V(0, M.D.yTopOut + 25, 0), 'cinghia'));
      window.MAINM = M; M.update(S.bx, S.arm); invalidaTubo(); updateHose(S.bx);
      if (window.AMB_UNISCI) window.AMB_UNISCI(M);
    }
  });
  select(current);
}
}
