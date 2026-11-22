// Precompilazione (sez. 6.10): tutti i programmi shader che servono dopo il caricamento vengono creati qui,
// con compileAsync (KHR_parallel_shader_compile, non blocca), una variante per volta.
// Varianti di materiale: oggetti "sostituti" che condividono geometria e tipo (Mesh / InstancedMesh)
// aggiunti alla scena solo durante la parte sincrona di compile, quindi mai disegnati.
import * as THREE from 'three';

const attendiInattivo = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 500 }) : setTimeout(r, 50)));

export function sostituti(materiali) {
  const g = new THREE.Group(), geo = new THREE.BoxGeometry(1, 1, 1);
  for (const m of materiali) {
    g.add(new THREE.Mesh(geo, m));
    const im = new THREE.InstancedMesh(geo, m, 1); g.add(im);
  }
  return g;
}

// varianti: [{ nome, applica(), ripristina() }]; ogni variante può aggiungere oggetti alla scena in applica()
// rt: il bersaglio in cui la scena viene davvero disegnata (la catena di postprocessing disegna in un buffer
// HalfFloat lineare, senza tone mapping): le chiavi dei programmi devono coincidere con quelle del rendering reale.
export async function precompila(renderer, scene, camera, varianti = [], rt = null) {
  const t0 = performance.now(), log = [];
  // rt === false: disegno diretto a schermo (bersaglio null)
  const bersaglio = rt === false ? null : (rt || new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }));
  for (const v of [{ nome: 'base', applica() { }, ripristina() { } }, ...varianti]) {
    await attendiInattivo();
    let p;
    v.applica();
    const prec = renderer.getRenderTarget();
    // con v.g (oggetti sostituti) si compilano solo quelli, con le luci della scena intera
    try { renderer.setRenderTarget(bersaglio); p = v.g ? renderer.compileAsync(v.g, v.camera || camera, scene) : renderer.compileAsync(scene, v.camera || camera); } finally { renderer.setRenderTarget(prec); v.ripristina(); }
    await p;
    log.push(`${v.nome}: ${renderer.info.programs.length} programmi`);
  }
  if (bersaglio && !rt) bersaglio.dispose();
  return { ms: performance.now() - t0, log };
}
