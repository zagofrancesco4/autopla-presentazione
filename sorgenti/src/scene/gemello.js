// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
// Vista di dettaglio del gemello digitale (chunk separato, caricato all'apertura o quando il browser è inattivo).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../motore/CSS2DRenderer160.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $, ease, Orologio } from '../util.js';
import { CONFIG } from '../dati/config.js';
import { DEV } from '../dati/parti.js';
import { precompila } from '../motore/precompilazione.js';
import { Pipeline } from '../motore/pipeline.js';
import { qualita } from '../motore/qualita.js';
import { CIELO_HDRI } from '../ambiente/cielo-hdri.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
const QLINE = new LineMaterial({ color: 0xf5b942, linewidth: 1.6, depthTest: false, transparent: true, worldUnits: false });
import { VISTA, D2R, SQ2, v3, fmt, QMAT, ST, D, root, car, RUL, LAB, EXP, modoFunzione, MAT, REALE,
  setModo, setTrasp, setEtichette, btn, panel, info, animUI, toggleAnim, setX, toggleEsploso, applyEsploso, stopEcc, applyEcc,
  syncInstances, dropLabels, dispose, armDeg } from '../meccanismo/mecc.js';

const _p = v3();
export function scr(vec, parent, W, H) { _p.copy(vec).applyMatrix4(parent.matrixWorld).project(V.cam); return { x: (_p.x + 1) / 2 * W, y: (1 - _p.y) / 2 * H, ok: _p.z < 1 && _p.z > -1 }; }
export function layoutTags() {
  const host = $('mechTags'), svg = $('mechLines');
  const on = LAB && ST.etichette && !(ST.ecc > 0 || ST.eccT > 0);
  host.style.display = svg.style.display = on ? '' : 'none'; if (!on) return;
  const view_ = $('mechView'), vb = view_.getBoundingClientRect(), W = vb.width, H = vb.height, few = W < 700, M = 4;
  const obst = [];
  for (const id of ['mechPanel', 'mechInfo', 'mechLegend', 'mechChecks', 'mechScale']) { const e = $(id); if (e && !e.hidden && e.offsetParent && e.style.visibility !== 'hidden') { const r = e.getBoundingClientRect(); obst.push({ x0: r.left - vb.left - M, y0: r.top - vb.top - M, x1: r.right - vb.left + M, y1: r.bottom - vb.top + M }); } }
  if (RUL && RUL.visible) {               // il righello resta libero
    RUL.updateMatrixWorld(true); const pr = [v3(-55, -2, 0), v3(55, -2, 0), v3(-55, 18, 0), v3(55, 18, 0)].map(q => scr(q, RUL, W, H));
    obst.push({ x0: Math.min(...pr.map(q => q.x)) - M, y0: Math.min(...pr.map(q => q.y)) - M, x1: Math.max(...pr.map(q => q.x)) + M, y1: Math.max(...pr.map(q => q.y)) + M });
  }
  view_.querySelectorAll('.mlbl').forEach(e => { const r = e.getBoundingClientRect(); if (r.width) obst.push({ x0: r.left - vb.left - M, y0: r.top - vb.top - M, x1: r.right - vb.left + M, y1: r.bottom - vb.top + M }); });
  const vis = [];
  for (const it of LAB.items) {
    const wa = it.a.clone().applyMatrix4(it.parent.matrixWorld);
    const A = scr(it.a, it.parent, W, H), Lp = scr(it.l, it.parent, W, H);
    it.show = A.ok && Lp.ok && (!few || it.prim) && !(ST.sez && wa.x < ST.xCut - .5) && A.x > -20 && A.x < W + 20 && A.y > -20 && A.y < H + 20;
    it.el.style.display = it.show ? '' : 'none'; if (!it.show) continue;
    if (!it.w) { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; }
    it.ax = A.x; it.ay = A.y; it.x = Lp.x - it.w / 2; it.y = Lp.y - it.h / 2; vis.push(it);
  }
  for (let k = 0; k < 40; k++) {
    let moved = false;
    for (let i = 0; i < vis.length; i++) {
      const a = vis[i];
      for (let j = i + 1; j < vis.length; j++) {
        const b = vis[j], ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + M, oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + M;
        if (ox > 0 && oy > 0) { moved = true; if (oy < ox) { const d = (a.y < b.y ? -1 : 1) * oy / 2; a.y += d; b.y -= d; } else { const d = (a.x < b.x ? -1 : 1) * ox / 2; a.x += d; b.x -= d; } }
      }
      for (const o of obst) {
        const ox = Math.min(a.x + a.w, o.x1) - Math.max(a.x, o.x0), oy = Math.min(a.y + a.h, o.y1) - Math.max(a.y, o.y0);
        if (ox > 0 && oy > 0) { moved = true; if (oy < ox) a.y += (a.y + a.h / 2 < (o.y0 + o.y1) / 2 ? -oy : oy); else a.x += (a.x + a.w / 2 < (o.x0 + o.x1) / 2 ? -ox : ox); }
      }
      a.x = Math.max(M, Math.min(W - a.w - M, a.x)); a.y = Math.max(M, Math.min(H - a.h - M, a.y));
    }
    if (!moved) break;
  }
  // ultima passata: tiene prima le etichette principali; quelle che restano sovrapposte vengono nascoste
  const ok = [], hit = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0;
  for (const it of [...vis].sort((a, b) => b.prim - a.prim)) {
    const r = { x0: it.x - 1, y0: it.y - 1, x1: it.x + it.w + 1, y1: it.y + it.h + 1 };
    if (ok.some(o => hit(o, r)) || obst.some(o => hit(o, r))) { it.el.style.display = 'none'; continue; }
    ok.push(r); it.ok = true;
  }
  vis.splice(0, vis.length, ...vis.filter(it => it.ok)); vis.forEach(it => { it.ok = false; });
  let d = '';
  for (const it of vis) {
    it.el.style.transform = `translate(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px)`;
    const cx = Math.max(it.x, Math.min(it.ax, it.x + it.w)), cy = Math.max(it.y, Math.min(it.ay, it.y + it.h));
    d += `M${it.ax.toFixed(1)} ${it.ay.toFixed(1)}L${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<path d="${d}" stroke="#d8d8dc" stroke-opacity=".55" stroke-width="1" fill="none"/>` + vis.map(it => `<circle cx="${it.ax.toFixed(1)}" cy="${it.ay.toFixed(1)}" r="3" fill="#0b0b0c" stroke="#fff" stroke-width="1.5"/>`).join('');
}

// scala in sezione: barra in basso a sinistra, lunga un valore tondo in mm sul piano di taglio
export function layoutScale() {
  const sc = $('mechScale'); if (!ST.sez) { sc.hidden = true; return; }
  const vb = $('mechView').getBoundingClientRect(), Pm = v3(ST.xCut, (D.yTopOut + D.yBotOut) / 2, D.zLeftOut);
  const a = Pm.clone().project(V.cam), b = Pm.clone().add(v3(0, 0, 10)).project(V.cam), c = Pm.clone().add(v3(0, 10, 0)).project(V.cam);
  const pxmm = Math.max(Math.hypot((b.x - a.x) * vb.width / 2, (b.y - a.y) * vb.height / 2), Math.hypot((c.x - a.x) * vb.width / 2, (c.y - a.y) * vb.height / 2)) / 10;
  const L = [5, 10, 20, 50, 100, 200].find(l => l * pxmm >= 70) || 200;
  const pn = $('mechPanel'); sc.style.bottom = (!pn.hidden ? pn.offsetHeight + 20 : 10) + 'px';
  sc.hidden = false; $('mechScaleBar').style.width = (L * pxmm).toFixed(1) + 'px'; $('mechScaleT').textContent = `${L} mm`;
}


let V = null, running = false, dims = null;
export function initView() {
  // v2: studio fotografico (sez. 11.2): sfondo grafite a curva infinita, HDRI CC0 da studio per i riflessi,
  // key light morbida + fill + contorno, griglia sottile solo sul pavimento, stessa catena di rendering della scena principale
  const host = $('mechView');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualita.p.prMax));
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.shadowMap.autoUpdate = false;   // ombre ridisegnate solo quando qualcosa si muove
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const lr = new CSS2DRenderer(); lr.domElement.id = 'mechLabels'; host.appendChild(lr.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x111214);
  scene.fog = new THREE.Fog(0x111214, 2600, 9000);   // il pavimento sfuma nello sfondo: nessun bordo visibile
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;
  const sun = new THREE.DirectionalLight(0xfff6ec, 2.6); sun.castShadow = true;   // key light (unica con ombre)
  const om = 2048;
  sun.shadow.mapSize.set(om, om); sun.shadow.bias = -.0003; sun.shadow.normalBias = .3; sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 10, far: 3000 });
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xe8eef7, .55); scene.add(fill); scene.add(fill.target);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); scene.add(rim); scene.add(rim.target);
  // pavimento a curva infinita: disco scuro leggermente lucido + griglia sottile che svanisce con la distanza
  const pav = new THREE.Mesh(new THREE.CircleGeometry(14000, 128), new THREE.MeshStandardMaterial({ color: 0x141517, roughness: .62, metalness: 0, envMapIntensity: .35 }));
  pav.rotation.x = -Math.PI / 2; pav.receiveShadow = true; pav.name = 'studioPavimento'; pav.raycast = () => { };
  const griglia = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.ShaderMaterial({
    name: 'StudioGriglia', transparent: true, depthWrite: false, uniforms: { centro: { value: new THREE.Vector3() } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 centro; varying vec3 vW;
      float linea(vec2 p, float passo){ vec2 q = p / passo; vec2 g = abs(fract(q - .5) - .5) / fwidth(q); return 1. - min(min(g.x, g.y), 1.); }
      void main(){ vec2 p = vW.xz; float d = length(p - centro.xz);
        float a = (linea(p, 10.) * .25 + linea(p, 100.) * .75) * (1. - smoothstep(150., 900., d));
        gl_FragColor = vec4(vec3(.26), a * .45);
        #include <colorspace_fragment>
      }`
  }));
  griglia.rotation.x = -Math.PI / 2; griglia.position.y = .5; griglia.renderOrder = 1; griglia.raycast = () => { };
  const studio = new THREE.Group(); studio.add(pav, griglia); studio.position.y = -335; scene.add(studio);
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 20000);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.dampingFactor = .1;
  const pipe = new Pipeline(renderer, scene, cam);
  V = { renderer, lr, scene, cam, ctl, sun, fill, rim, pipe, studio, griglia, clock: new Orologio(), tween: null };
  VISTA.V = V; VISTA.dopoBuild = () => { V.sporco = true; V.scene.add(root); setTrasp(ST.trasp); setEtichette(ST.etichette); ombreMinuteria(); view(V.vista || 'iso'); };
  scene.add(root);
  // HDRI da studio (Poly Haven studio_small_09, CC0): sostituisce l'ambiente provvisorio quando arriva
  V.ambientePronto = new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL + 'asset/cielo/studio-1k.webp').then(tx => {
    tx.colorSpace = THREE.SRGBColorSpace; tx.mapping = THREE.EquirectangularReflectionMapping;
    // F10: ambiente dei riflessi = HDRI dello studio + fascia bianca all'orizzonte (la parete chiara del ciclorama, come in
    // uno studio fotografico vero). Senza, i fianchi dell'alluminio riflettevano solo il fondo grafite e il tubo "Struttura"
    // risultava nero invece del grigio chiaro della legenda (#c9cdd2), come nell'originale con la RoomEnvironment.
    const amb = new THREE.Scene(); amb.background = tx; amb.backgroundIntensity = CIELO_HDRI.studio.Lmax * .055;
    const fascia = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 3.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(.85, .86, .88), side: THREE.BackSide }));
    fascia.position.y = -.4; amb.add(fascia);
    scene.environment = pmrem.fromScene(amb, 0, .1, 100).texture; scene.environmentIntensity = 1;
    fascia.geometry.dispose(); fascia.material.dispose(); tx.dispose(); V.sporco = true;
  }).catch(() => { });
  new ResizeObserver(resizeView).observe(host);
}
export function resizeView() {
  if (!V) return; const host = $('mechView'), W = Math.max(1, host.clientWidth), H = Math.max(1, host.clientHeight);
  V.renderer.setSize(W, H); V.lr.setSize(W, H); V.cam.aspect = W / H; V.cam.updateProjectionMatrix();
  QLINE.resolution.set(W, H); V.sporco = true;
}
// quota: linea con estensioni e valore in mm
export function dim(a, b, off, testo) {
  const on = off.clone().normalize(), u = v3().subVectors(b, a).normalize(), A = a.clone().add(off), Bp = b.clone().add(off);
  const t = u.clone().add(on).normalize().multiplyScalar(2.2);
  const pts = [a.clone().addScaledVector(on, 1.5), A.clone().addScaledVector(on, 2.5), b.clone().addScaledVector(on, 1.5), Bp.clone().addScaledVector(on, 2.5),
    A, Bp, A.clone().sub(t), A.clone().add(t), Bp.clone().sub(t), Bp.clone().add(t)];
  const lg = new LineSegmentsGeometry(); lg.setPositions(pts.flatMap(p => [p.x, p.y, p.z]));
  const ls = new LineSegments2(lg, QLINE); ls.renderOrder = 999; dims.add(ls);   // v2: Line2, spessore costante in pixel
  const el = document.createElement('div'); el.className = 'mlbl mq'; el.textContent = testo ?? `${fmt(a.distanceTo(b), 1)} mm`;
  const lo = new CSS2DObject(el); lo.position.copy(A).add(Bp).multiplyScalar(.5).addScaledVector(on, 3); dims.add(lo);
}
export function buildDims(sezione, xCut) {
  if (dims) { dropLabels(dims); dims.removeFromParent(); dispose(dims); }
  dims = new THREE.Group();
  const h = D.h, t = CONFIG.tubo.spessore;
  if (sezione) {
    V.scene.add(dims);
    const x = xCut + .1, yW = D.cTop + (D.Ro - D.half) / SQ2;
    dim(v3(x, D.yBotOut, D.zLeftOut), v3(x, D.yBotOut, D.zRight), v3(0, -16, 0));
    dim(v3(x, D.yBotOut, D.zLeftOut), v3(x, D.yTopOut, D.zLeftOut), v3(0, 0, -16));
    dim(v3(x, -h + t, -h), v3(x, -h + t, h), v3(0, 8, 0));
    dim(v3(x, yW, D.zRuotaMax), v3(x, yW, D.zRailNear), v3(0, 34, 0), `${fmt(D.zRailNear - D.zRuotaMax, 1)} mm`);
  } else {                                       // quote del box: si muovono con il carrello
    car.add(dims);
    dim(v3(-D.xHalf, D.yBotOut, D.zLeftOut), v3(D.xHalf, D.yBotOut, D.zLeftOut), V.vista === 'alto' ? v3(0, 0, -16) : v3(0, -16, 0));
    if (V.vista !== 'alto') dim(v3(-D.xHalf, D.yBotOut, D.zLeftOut), v3(-D.xHalf, D.yTopOut, D.zLeftOut), V.vista === 'lato' ? v3(0, 0, -16) : v3(-16, 0, 0));
  }
}
export function camTo(tgt, dir, dist, inst) {
  const pos = tgt.clone().addScaledVector(dir.clone().normalize(), dist);
  V.cam.near = dist / 50; V.cam.far = dist * 20; V.cam.updateProjectionMatrix();
  if (inst) { V.cam.position.copy(pos); V.ctl.target.copy(tgt); V.ctl.update(); V.tween = null; }
  else V.tween = { t: 0, fp: V.cam.position.clone(), ft: V.ctl.target.clone(), tp: pos, tt: tgt.clone() };
  V.sun.position.copy(tgt).add(v3(-500, 900, -650)); V.sun.target.position.copy(tgt);
  V.fill.position.copy(tgt).add(v3(700, 300, 500)); V.fill.target.position.copy(tgt);
  V.rim.position.copy(tgt).add(v3(600, 500, 900)); V.rim.target.position.copy(tgt);
  if (V.griglia) V.griglia.material.uniforms.centro.value.copy(tgt);
}
// v2: il piano di taglio è sempre presente (nessun nuovo programma shader); senza sezione sta all'infinito
const pianoTaglio = new THREE.Plane(v3(1, 0, 0), 1e9);
export function setClip(x) { V.renderer.clippingPlanes = [pianoTaglio]; pianoTaglio.constant = x == null ? 1e9 : -x; if (V.studio) V.studio.visible = x == null; }   // in sezione lo studio sparirebbe tagliato
export function view(name = 'iso', inst) {
  if (!V) return;
  const Xc = ST.X, cy = (D.yTopOut + D.yBotOut) / 2, zR = D.zMontante + CONFIG.ringhiera.montante, cz = (D.zLeftOut + zR) / 2;
  const span = Math.max(D.yTopOut - D.yBotOut, zR - D.zLeftOut, 2 * D.xHalf) + 70;
  const set = { iso: [v3(-1.1, .8, -1.3), Xc], fronte: [v3(0, 0, -1), Xc], alto: [v3(0, 1, -.0001), Xc], lato: [v3(-1, 0, 0), Xc],
    sezione: [v3(-1, 0, 0), Xc + D.xSt[1]], sezioneMotore: [v3(-1, 0, 0), Xc] }[name];
  if (!set) return;
  V.vista = name;
  const [dir, xCut] = set, cut = name.startsWith('sezione');
  if (cut) { ST.sez = true; ST.xCut = xCut; } else if (!ST.sez) setClip(null);
  if (ST.sez) { setClip(ST.xCut); syncSezioneUI(); }
  const fit = Math.min(1, V.cam.aspect), dist = span / 2 / Math.tan(V.cam.fov / 2 * D2R) / fit * (name === 'iso' ? 1.5 : 1.05);
  camTo(v3(cut ? xCut : Xc, cy, cz), dir, dist, inst);
  buildDims(ST.sez, ST.xCut);
  document.querySelectorAll('#mechBar [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === name));
}

export function syncSezioneUI() {
  const r = $('mechCut'); if (!r) return;
  r.min = ST.X - D.xHalf - 20; r.max = ST.X + D.xHalf + 20; r.value = ST.xCut; $('mechCutT').textContent = `X ${fmt(ST.xCut - ST.X, 1)} mm dal centro`;
}
export function toggleSezione() {
  ST.sez = !ST.sez; btn('sezione', ST.sez);
  if (ST.sez) {
    ST.xCut = ST.X + D.xSt[1];
    panel(`<label class="mrow">Taglio <input id="mechCut" type="range" step="0.5"><span id="mechCutT"></span></label>` + (ST.anim ? '<div class="mrow"><span id="mechCnt"></span></div>' : ''));
    $('mechCut').addEventListener('input', e => { ST.xCut = +e.target.value; setClip(ST.xCut); syncSezioneUI(); buildDims(true, ST.xCut); });
    view('sezione');
  } else { setClip(null); panel(ST.anim ? '<div class="mrow"><span id="mechCnt"></span></div>' : null); view('iso'); }
}
// Eccentrico: zoom sulla ruota inferiore, boccola ruotata di 180°, la ruota sale (disegno x10)
export function toggleEcc() {
  if (ST.anim) toggleAnim();
  if (ST.espT) { ST.espT = 0; btn('esploso', false); }
  ST.eccT = ST.eccT > 0 ? 0 : 1; btn('eccentrico', ST.eccT > 0);
  const xw = ST.X + D.xSt[1];
  ST.sez = true; ST.xCut = xw - 3; setClip(ST.xCut); btn('sezione', true);
  panel(null);
  camTo(v3(xw, D.yShank - 4, (CONFIG.ruote.inferiore.z + D.zBlk0) / 2), v3(-1, .25, -.45), 105);
  buildDims(true, ST.xCut);
}

export function reset() {
  if (ST.anim) toggleAnim();
  ST.espT = ST.esp = 0; applyEsploso(0); btn('esploso', false);
  stopEcc(true); ST.sez = false; setClip(null); btn('sezione', false); panel(null);
  setX(CONFIG.vista.carrello); ST.X0 = ST.X; ST.v = CONFIG.animazione.velocita;
  setTrasp(true); setEtichette(true); syncInstances(); view('iso');
}
export function loop() {
  if (!running) return;
  const dt = Math.min(V.clock.getDelta(), .05); let moved = false;
  if (ST.anim) {
    const C = CONFIG, lo = C.vista.inizio + D.xHalf + 10, hi = C.vista.inizio + C.vista.lunghezza - D.xHalf - 10;
    let X = ST.X + ST.dir * ST.v * dt; if (X > hi) { X = hi; ST.dir = -1; } if (X < lo) { X = lo; ST.dir = 1; }
    setX(X); animUI(); moved = true;
  }
  if (ST.esp !== ST.espT) { ST.esp += Math.sign(ST.espT - ST.esp) * Math.min(Math.abs(ST.espT - ST.esp), dt / 1.2); applyEsploso(ease(ST.esp)); moved = true; }
  if (ST.ecc !== ST.eccT) { ST.ecc += Math.sign(ST.eccT - ST.ecc) * Math.min(Math.abs(ST.eccT - ST.ecc), dt / 3); applyEcc(ST.ecc); if (ST.ecc === 0) info(null); moved = true; }
  if (moved) syncInstances();
  if (V.tween) {
    const tw = V.tween; tw.t = Math.min(1, tw.t + dt / .8); const k = ease(tw.t);
    V.cam.position.lerpVectors(tw.fp, tw.tp, k); V.ctl.target.lerpVectors(tw.ft, tw.tt, k); if (tw.t >= 1) V.tween = null;
  }
  const camMossa = V.ctl.update();
  if (RUL) { RUL.visible = !ST.sez; RUL.quaternion.copy(car.quaternion).invert().multiply(V.cam.quaternion); RUL.children.forEach(c => { if (c.isCSS2DObject) c.visible = !ST.sez; }); }
  const firma = [ST.X, ST.esp, ST.ecc, ST.sez ? ST.xCut : '-', ST.trasp, ST.etichette, modoFunzione, armDeg, V.vista].join('|');
  // rendering su richiesta: solo se cambia la camera o lo stato del gemello
  requestAnimationFrame(loop);
  const scena = firma !== V.firma;
  if (!V.sporco && !camMossa && !scena && !moved && !V.tween) return;
  if (V.sporco || scena || moved) V.renderer.shadowMap.needsUpdate = true;
  V.sporco = false; V.firma = firma;
  V.pipe.render();
  V.lr.render(V.scene, V.cam); layoutTags(); layoutScale();
}
export function legend() {
  const nomi = { trasmissione: 'Trasmissione', guide: 'Guide', elettronica: 'Elettronica', acqua: 'Acqua' };
  $('mechLegend').innerHTML = Object.entries(CONFIG.aspetto.funzioni).map(([k, c]) => `<span><i style="background:${c}"></i>${nomi[k] || k}</span>`).join('') + '<span><i style="background:#c9cdd2"></i>Struttura</span>';
}

// v2: preparazione anticipata (quando il browser è inattivo): stessa inizializzazione della prima apertura, a vista nascosta
// (solo WebGL: il DOM resta com'è finché il gemello non viene aperto, come nell'originale)
export function prepara() {
  if (!V) { initView(); setClip(null); ombreMinuteria(); }
  return V;
}
// la minuteria (raggio < 6 mm) non proietta ombra: a questa scala non si vede e dimezza le draw call dell'ombra
function ombreMinuteria() {
  root.traverse(o => { if (!o.isMesh || o.material.transparent) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius < 6) o.castShadow = false; });
}
function traspMateriale(on) {     // parte "materiale" di setTrasp, senza toccare i pulsanti
  const m = MAT('petg'); m.transparent = on; m.opacity = on ? REALE.petg.opacity : 1; m.depthWrite = !on; m.needsUpdate = true;
  root.traverse(o => { if (o.isMesh && o.material === m) { o.castShadow = !on; o.receiveShadow = !on; } });
}
export async function precompilaGemello() {
  prepara();
  const m = MAT('petg');
  await V.ambientePronto;
  const r = await precompila(V.renderer, V.scene, V.cam, [
    { nome: 'box opaca', applica() { traspMateriale(false); }, ripristina() { traspMateriale(true); } },
    { nome: 'quote', applica() { const g = new LineSegmentsGeometry(); g.setPositions([0, 0, 0, 1, 1, 1]); this.l = new LineSegments2(g, QLINE); V.scene.add(this.l); }, ripristina() { this.l.removeFromParent(); } }
  ]);
  // le mappe d'ombra usano programmi di profondità che compile() non crea: un disegno per stato, a vista nascosta
  camTo(v3(ST.X, 0, 0), v3(-1.1, .8, -1.3), 600, true);     // sole e camera sul carrello (nessun effetto sul DOM)
  V.renderer.shadowMap.needsUpdate = true; traspMateriale(false); V.pipe.render(); V.renderer.shadowMap.needsUpdate = true; traspMateriale(true); V.pipe.render();
  r.log.push('ombre: ' + V.renderer.info.programs.length + ' programmi');
  return r;
}
let domPronto = false;
export function open() {
  $('mech').hidden = false;
  if (!domPronto) {
    domPronto = true;
    $('mechChecks').hidden = true; $('mechCk').hidden = !DEV;
    $('mechSub').textContent = DEV ? 'Gemello digitale · misure in mm da CONFIG' : 'Gemello digitale del meccanismo';
    legend(); prepara(); setTrasp(true); setEtichette(true);
  }
  resizeView(); view('iso', true); V.sporco = true;
  if (!running) { running = true; V.clock.getDelta(); requestAnimationFrame(loop); }
}
export function close() {
  $('mech').hidden = true; running = false;
  if (location.hash === '#meccanismo') history.replaceState(null, '', location.pathname + location.search);
}
$('mechClose').addEventListener('click', close);
$('mechCk').addEventListener('click', () => { const b = $('mechChecks'); b.hidden = !b.hidden; });
$('mechColor').addEventListener('click', () => { setModo(!modoFunzione); if (V) V.sporco = true; });
$('mechBar').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (V) V.sporco = true;
  if (b.dataset.v) { if (ST.sez && !b.dataset.v.startsWith('sezione')) { ST.sez = false; setClip(null); btn('sezione', false); panel(ST.anim ? '<div class="mrow"><span id="mechCnt"></span></div>' : null); } view(b.dataset.v); return; }
  ({ animazione: toggleAnim, esploso: toggleEsploso, sezione: toggleSezione, eccentrico: toggleEcc,
    etichette: () => setEtichette(!ST.etichette), trasparenza: () => setTrasp(!ST.trasp), reset })[b.dataset.a]?.();
});

// v2: misure per scripts/budget.mjs
export function misure() { if (!V) return null; const r = V.renderer, inf = r.info; inf.autoReset = false; inf.reset(); r.render(V.scene, V.cam); const out = { calls: inf.render.calls, tri: inf.render.triangles }; inf.autoReset = true; return out; }
