// Inquadratura adattiva (fase 3, punto 9), comune a presentazione e gemello.
// - areaLibera: rettangolo del canvas meno gli overlay che lo coprono (letto solo a resize/selezione, mai nel rAF);
// - fitDistanza: distanza a cui un riquadro w × h (unità della scena) entra nell'area libera, con il FOV verticale E
//   orizzontale (vale il più restrittivo) e un margine (10 % di default);
// - offsetArea: sposta la proiezione (setViewOffset) perché il centro dell'inquadratura cada al centro dell'area libera.
// Lo zoom dell'utente si conserva come fattore rispetto alla distanza di fit (gestito da chi chiama).

export const area = () => ({ W: 1, H: 1, top: 0, bottom: 0, left: 0, right: 0 });

export function areaLibera(host, ids, A = area()) {
  const r = host.getBoundingClientRect(), W = Math.max(1, r.width), H = Math.max(1, r.height);
  A.W = W; A.H = H; A.top = A.bottom = A.left = A.right = 0;
  for (const id of ids) {
    const e = document.getElementById(id); if (!e || e.hidden || !e.offsetWidth) continue;
    const b = e.getBoundingClientRect();
    const x0 = Math.max(b.left, r.left), x1 = Math.min(b.right, r.right), y0 = Math.max(b.top, r.top), y1 = Math.min(b.bottom, r.bottom);
    const ow = x1 - x0, oh = y1 - y0;
    if (ow <= 0 || oh <= 0 || ow * oh < .03 * W * H) continue;          // fuori dal canvas o piccolo (es. ⟲): non conta
    if (ow >= oh * 1.5) {                                                // barra orizzontale: sopra o sotto
      if ((y0 + y1) / 2 < r.top + H / 2) A.top = Math.max(A.top, y1 - r.top); else A.bottom = Math.max(A.bottom, r.bottom - y0);
    } else {                                                             // pannello verticale: a sinistra o a destra
      if ((x0 + x1) / 2 < r.left + W / 2) A.left = Math.max(A.left, x1 - r.left); else A.right = Math.max(A.right, r.right - x0);
    }
  }
  // l'area libera non scende sotto metà canvas per lato (overlay enormi: meglio un po' coperto che minuscolo)
  const kv = Math.min(1, H * .5 / Math.max(1e-6, A.top + A.bottom)), kh = Math.min(1, W * .5 / Math.max(1e-6, A.left + A.right));
  A.top *= kv; A.bottom *= kv; A.left *= kh; A.right *= kh;
  return A;
}

export function fitDistanza(cam, w, h, A, margine = 1.1) {
  const tv = Math.tan(cam.fov * Math.PI / 360);
  const Wf = Math.max(1, A.W - A.left - A.right), Hf = Math.max(1, A.H - A.top - A.bottom);
  const dv = (h / 2) / tv * (A.H / Hf), dh = (w / 2) / (tv * cam.aspect) * (A.W / Wf);
  return Math.max(dv, dh) * margine;
}

export function offsetArea(cam, A) {
  const dx = (A.right - A.left) / 2, dy = (A.bottom - A.top) / 2;
  if (Math.abs(dx) < .5 && Math.abs(dy) < .5) cam.clearViewOffset();
  else cam.setViewOffset(A.W, A.H, dx, dy, A.W, A.H);   // chiama updateProjectionMatrix
}

// debounce: fn eseguita ms dopo l'ultima chiamata
export function rimanda(fn, ms = 150) { let id = 0; return () => { clearTimeout(id); id = setTimeout(fn, ms); }; }
