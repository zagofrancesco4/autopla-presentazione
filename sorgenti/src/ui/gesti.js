// Gesti sull'area 3D (fase 3, punto 8). La pagina resta zoomabile (accessibilità) sui pannelli di testo, ma un pizzico
// che parte sull'area 3D o sui suoi overlay (badge, etichette, pulsanti) zooma SOLO la camera:
// - CSS: touch-action:none sugli overlay del 3D (il browser non zooma la pagina), pan-x/pan-y sulle barre scorrevoli;
// - qui: il pizzico con almeno un dito fuori dal canvas (che OrbitControls non vede) viene applicato alla camera come dolly;
// - se la pagina è rimasta ingrandita (visualViewport.scale > 1) e si tocca il 3D o si ruota il telefono, torna a scala 1.

// pizzico → dolly della camera attorno al target. ctx(): { camera, controls, richiedi } della vista attiva
export function pizzicoCamera(host, canvas, ctx) {
  const dita = new Map();   // pointerId → { x, y, suCanvas }
  let d0 = 0, attivo = false, eraAbilitato = true;
  const distanza = () => { let a = null, b = null; for (const p of dita.values()) { if (!a) a = p; else if (!b) b = p; } return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; };
  host.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    dita.set(e.pointerId, { x: e.clientX, y: e.clientY, suCanvas: e.target === canvas });
    if (dita.size === 2) {
      let fuori = false; for (const p of dita.values()) if (!p.suCanvas) fuori = true;
      const { controls } = ctx();
      // due dita sul canvas: lo gestisce già OrbitControls
      if (fuori && controls.enabled) { attivo = true; d0 = distanza(); eraAbilitato = controls.enabled; controls.enabled = false; }
    }
  }, true);
  host.addEventListener('pointermove', e => {
    const p = dita.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (!attivo) return;
    const d = distanza(); if (!d || !d0) return;
    const { camera, controls, richiedi } = ctx(), t = controls.target;
    const dist = camera.position.distanceTo(t), nuova = Math.min(controls.maxDistance, Math.max(controls.minDistance, dist * d0 / d));
    camera.position.sub(t).multiplyScalar(nuova / dist).add(t); d0 = d;
    if (richiedi) richiedi();
  }, true);
  const fine = e => {
    if (!dita.delete(e.pointerId)) return;
    if (attivo && dita.size < 2) { attivo = false; ctx().controls.enabled = eraAbilitato; }
  };
  host.addEventListener('pointerup', fine, true); host.addEventListener('pointercancel', fine, true);
  // Safari: gesti di pizzico della pagina (eventi proprietari) bloccati sull'area 3D
  host.addEventListener('gesturestart', e => e.preventDefault());
  host.addEventListener('pointerdown', () => { if (paginaIngrandita()) scalaUno(); }, true);
}

// pagina ingrandita (zoom del browser) → di nuovo a scala 1: Safari rispetta maximum-scale appena impostato e
// rimpicciolisce; dopo un attimo il meta torna com'era (lo zoom della pagina resta permesso)
const vv = window.visualViewport;
export const paginaIngrandita = () => !!vv && vv.scale > 1.01;
let ripristino = 0;
export function scalaUno() {
  const m = document.querySelector('meta[name=viewport]'); if (!m) return;
  const orig = m.dataset.orig || (m.dataset.orig = m.getAttribute('content'));
  m.setAttribute('content', orig + ', maximum-scale=1');
  clearTimeout(ripristino); ripristino = setTimeout(() => m.setAttribute('content', orig), 400);
}
addEventListener('orientationchange', () => { if (paginaIngrandita()) scalaUno(); });
