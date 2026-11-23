// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';
import { CSS2DObject } from '../motore/CSS2DRenderer160.js';
import { $, V, rad, ease, Orologio } from '../util.js';
import { RAIL_Z, POT_Z, WIRE_Z, HOME, ARM_DEG, ML_VASO, SECTION_X, POTS } from '../dati/config.js';
import { PARTS, PART, BOXKEYS, TAP_ORDER, EXTRA_TAP, STEPS, GENERAL, pzHtml } from '../dati/parti.js';
import { vp, renderer, labelRenderer, scene, camera, controls, pipeline, pixelRatio, governa } from '../motore/renderer.js';
import { clipMats, pompaMat, valvMat } from '../materiali/libreria.js';
import { pickables, compsByKey, labels, boxG, pivot, parts, dropMesh, drops, potLabels, qTop, qSide, setTank, updateHose, updateDrops, invalidaTubo } from '../scene/balcone.js';
import { campiona, benchPasso, p95 } from '../motore/perf.js';
import { rigeneraTexture } from '../ambiente/ambiente.js';
import { AMB, MOBILE, ambienteFrame, vincolaCamera, disponiEtichetteMain, aggiornaVento } from '../ambiente/ambiente.js';

// prefers-reduced-motion: salti di camera invece dei voli
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const tweenAttivo = () => !!tween;
export function completaTween() { if (tween) { camera.position.copy(tween.tp); controls.target.copy(tween.tt); tween = null; controls.enabled = true; } }
export const statoInterno = { get explodeT() { return explodeT; }, get tween() { return tween; } };

// righe 853-900
/* Numeri sul disegno */
export function dotLabel(p, parent, pos) {
  const b = document.createElement('button'); b.className = 'dot'; b.textContent = p.n; b.setAttribute('aria-label', p.title);
  b.addEventListener('click', ev => { ev.stopPropagation(); select(p.id); });
  b.addEventListener('pointerdown', ev => ev.stopPropagation());
  const o = new CSS2DObject(b); o.position.copy(pos); parent.add(o);
  labels.push({ o, cat: 'dot', d: b });
}
/* Barra delle parti */
export const nav = $('parts');
export function chip(id, n, text) {
  const b = document.createElement('button'); b.className = 'pc'; b.dataset.id = id;
  b.innerHTML = `<span class="n">${n || '◎'}</span>` + text;
  b.addEventListener('click', () => id === 'tutto' ? select(null) : select(id));
  nav.appendChild(b);
}
/* Evidenza / trasparenza */
// v2: oggetti davanti alla parte: grigio neutro trasparente (17 %) con un leggero fresnel speculare, mai azzurro
export const ghostMat = new THREE.MeshStandardMaterial({ color: 0x8f8f91, roughness: .3, metalness: 0, transparent: true, opacity: .17, depthWrite: false });
let fuoco = null;
export function impostaFuoco(f) { fuoco = f; }
export const renderables = [];
export function keyOf(o) { while (o) { if (o.userData && o.userData.key) return o.userData.key; o = o.parent; } return null; }
export function applyFocus(p) {
  for (const o of renderables) {
    const k = o.userData.k;
    const normal = !p || p.mode === 'top' || p.mode === 'section' || p.keys.includes(k) || p.ctx.includes(k);
    // v2: un oggetto "fantasma" non proietta ombra (niente varianti di profondità da compilare a caldo)
    if (normal) { o.visible = true; if (o.isMesh) { o.material = o.userData.orig; if (o.userData.ombra !== undefined) { o.castShadow = o.userData.ombra; delete o.userData.ombra; } } }
    else if (p.mode === 'solo') o.visible = false;
    else if (o.isMesh) { o.visible = true; o.material = ghostMat; if (o.userData.ombra === undefined) o.userData.ombra = o.castShadow; o.castShadow = false; }
    else o.visible = false;
  }
  dropMesh.visible = !p || p.mode !== 'solo';
  dropMesh.userData.vis = dropMesh.visible;   // v2: updateDrops la rispetta
}

export function initPresentazione() {
for (const p of PARTS) {
  if (p.dot) dotLabel(p, scene, p.dot);
  else if (p.dotObj === 'box') dotLabel(p, boxG, V(0, 73.5, 9));
  else if (p.dotObj === 'arm') dotLabel(p, pivot, V(0, -19, 3));
}
chip('tutto', 0, 'Tutto');
PARTS.forEach(p => chip(p.id, p.n, p.chip));
scene.traverse(o => {
  if ((o.isMesh || o.isLine) && o !== dropMesh) {
    let q = o, inQuote = false; while (q) { if (q === qTop || q === qSide) inQuote = true; q = q.parent; }
    if (inQuote) return;
    o.userData.k = keyOf(o); o.userData.orig = o.material; renderables.push(o);
  }
});
}


// righe 901-1108 (senza STEPS e GENERAL, spostati in dati/parti.js)
/* Ciclo */
export const S = { bx: HOME, arm: 0, running: false, paused: false, step: -1, el: 0, dur: 1, from: HOME, ml: 0, total: 0, tank: 10, tank0: 10, watering: false };

export const CYCLE_HTML = `<div class="cyc">
<div class="row"><span id="cStep"></span><span id="cMl"></span></div>
<div class="row stato"><span id="cPompa"></span><span id="cServo"></span></div>
<div class="bar"><i id="cBar"></i></div>
<div class="cbtns"><button id="cPause">❚❚ Pausa</button><button id="cRestart">↺ Ricomincia</button></div>
</div>`;
export function cycleUI() {
  if (current !== 'ciclo') return;
  const st = STEPS[Math.max(0, S.step)];
  const done = !S.running && S.step === STEPS.length - 1;
  $('cStep').textContent = S.paused ? `${st.title} (pausa)` : st.title;
  $('cMl').textContent = done ? `${Math.round(S.total)} ml` : (st.t === 'water' ? `${Math.round(S.ml)} / ${ML_VASO} ml` : `${Math.round(S.total)} ml`);
  $('cBar').style.width = ((S.step + 1) / STEPS.length * 100) + '%';
  statoCiclo(true);
  const bp = $('cPause'); bp.disabled = !S.running; bp.textContent = S.paused ? '▶ Riprendi' : '❚❚ Pausa';
}
// pompa ON/OFF con livello del serbatoio e angolo del servo: testo aggiornato solo quando cambia
let uP = -1, uT = -1, uS = -1;
export function statoCiclo(forza) {
  if (current !== 'ciclo') return;
  const p = S.watering ? 1 : 0, t = Math.round(S.tank * 100), g = Math.round(S.arm);   // confronto numerico: nessuna stringa se non cambia
  if (!forza && p === uP && t === uT && g === uS) return; uP = p; uT = t; uS = g;
  $('cPompa').textContent = `${p ? 'Pompa ON' : 'Pompa OFF'} · serbatoio ${(t / 100).toFixed(2).replace('.', ',')} l`; $('cServo').textContent = `Servo ${g}°`;
}
export function syncCycleBtn() {
  $('bCycle').textContent = S.running ? (S.paused ? '▶ Riprendi' : '● In corso') : '▶ Ciclo';
}
export function enterStep(i) {
  S.step = i; S.el = 0; const st = STEPS[i]; S.from = S.bx;
  S.dur = st.t === 'move' ? Math.max(.6, Math.abs(st.to - S.bx) / 24) : st.dur;
  if (st.t === 'water') { S.ml = 0; S.tank0 = S.tank; }
  cycleUI();
}
export function resetCycle() {
  Object.assign(S, { bx: HOME, arm: 0, running: false, paused: false, step: -1, ml: 0, total: 0, tank: 10, watering: false });
  potLabels.forEach(p => { p.d.textContent = p.base; p.d.classList.remove('done'); });
  for (const d of drops) d.on = false;
  setTank(10);
}
export function startCycle() { resetCycle(); S.running = true; enterStep(0); syncCycleBtn(); }
export function updateCycle(dt) {
  S.watering = false;
  if (!S.running || S.paused) return;
  const st = STEPS[S.step];
  S.el += dt;
  const k = Math.min(1, S.el / S.dur);
  if (st.t === 'move') S.bx = S.from + (st.to - S.from) * ease(k);
  else if (st.t === 'down') S.arm = ARM_DEG * ease(k);
  else if (st.t === 'up') S.arm = ARM_DEG * (1 - ease(k));
  if (st.t === 'down' || st.t === 'up') statoCiclo();
  else if (st.t === 'water') {
    S.watering = k < .98;
    const prev = S.ml; S.ml = ML_VASO * k; S.total += S.ml - prev;
    S.tank = S.tank0 - ML_VASO / 1000 * k; setTank(S.tank);
    if (k >= 1) { const p = potLabels[st.pot]; p.d.textContent = `${p.base} ✓`; p.d.classList.add('done'); }
    cycleUI();
  }
  if (k >= 1) {
    if (S.step + 1 < STEPS.length) enterStep(S.step + 1);
    else { S.running = false; S.paused = false; syncCycleBtn(); cycleUI(); }
  }
}

/* Selezione delle parti */
export let current = null;
export let explodeT = 0, explodeTarget = 0, tween = null, hl = null, camGoal = null;
export const clipPlanes = [new THREE.Plane(V(-1, 0, 0), SECTION_X), new THREE.Plane(V(1, 0, 0), -82)];
export const app = $('app'), sheet = $('sheet'), body = $('sheetBody');

export function openSheet(badge, title, sub, html) {
  $('sheetBadge').textContent = badge; $('sheetTitle').textContent = title; $('sheetSub').textContent = sub;
  body.innerHTML = html;
  sheet.hidden = false; app.classList.remove('nosheet');
  body.scrollTop = 0;
}
export function closeSheet() { sheet.hidden = true; app.classList.add('nosheet'); }

export function select(id) {
  if (PART[id] && PART[id].apri) { AUTOPLA.open(); return; }
  if (window.AMB_PRONTO && id !== 'ciclo') AMB.segui = false;
  clearHL();
  const wasCycle = current === 'ciclo';
  if (S.running && !S.paused && id !== 'ciclo') { S.paused = true; syncCycleBtn(); }
  current = id;
  const p = PART[id] || null;
  document.querySelectorAll('.pc').forEach(c => c.classList.toggle('on', c.dataset.id === (id || 'tutto')));
  if (!S.running) {
    if (p && p.pose) { S.bx = p.pose[0]; S.arm = p.pose[1]; } else { S.bx = HOME; S.arm = 0; }
  }
  explodeTarget = p && p.explode ? 1 : 0;
  const sec = p && p.mode === 'section';
  for (const m of clipMats) m.clippingPlanes = sec ? clipPlanes : null;
  qTop.visible = id === 'vasi'; qSide.visible = !!sec;
  applyFocus(p);
  // v2: messa a fuoco (sez. 11.1) per le modalità ghost, solo e section
  if (fuoco) fuoco.imposta(p && ['ghost', 'solo', 'section'].includes(p.mode) ? p.keys.map(k => compsByKey[k]).filter(Boolean) : null);
  if (window.MAINM) { const legacy = !!p && (p.id === 'box' || p.id === 'braccetto'); window.MAINM.root.visible = !legacy; boxG.visible = legacy; invalidaTubo(); }
  if (p) openSheet(p.n, p.title, p.sub, pzHtml(p.pz) + (p.id === 'box' ? '<button class="pz mechgo" id="mechGo">Dettaglio 3D del meccanismo</button>' : ''));
  else if (id === 'ciclo') { openSheet('▶', 'Ciclo', 'Un giro completo sui tre vasi.', CYCLE_HTML); bindCycleButtons(); cycleUI(); }
  else closeSheet();
  $('hint').hidden = !!id;
  resize();
  flyTo(p ? p.cam : GENERAL, p && p.id === 'box');
  if (wasCycle && id !== 'ciclo') cycleUI();
}
export function flyTo(v, followBox) {
  const target = followBox ? V(S.bx, 67, 8) : v.t.clone();
  const pos = target.clone().add(v.d.clone().normalize().multiplyScalar(fitDist(v.w, v.h)));
  camGoal = { v, followBox };
  tween = { t: 0, fp: camera.position.clone(), ft: controls.target.clone(), tp: pos, tt: target, followBox };
  controls.enabled = false;
}
export function fitDist(w, h) {
  const W = Math.max(1, vp.clientWidth), H = Math.max(1, vp.clientHeight);
  const tv = Math.tan(rad(camera.fov / 2));
  return Math.max((h / 2) / tv, (w / 2) / (tv * W / H)) * 1.1;
}
export function bindCycleButtons() {
  $('cPause').addEventListener('click', () => { if (!S.running) return; S.paused = !S.paused; syncCycleBtn(); cycleUI(); });
  $('cRestart').addEventListener('click', () => { startCycle(); cycleUI(); });
}
$('bCycle').addEventListener('click', () => {
  // v3: unico Play: avvia, mette in pausa e riprende (i pulsanti della scheda sono nascosti)
  const eraCiclo = current === 'ciclo';
  if (!eraCiclo) select('ciclo');
  if (!S.running) startCycle(); else if (S.paused) S.paused = false; else if (eraCiclo) S.paused = true;
  syncCycleBtn(); cycleUI();
});
$('sheetClose').addEventListener('click', () => {
  if (current === 'ciclo') { resetCycle(); syncCycleBtn(); }
  select(null);
});
$('bMecc').addEventListener('click', () => AUTOPLA.open());
$('bHome').addEventListener('click', () => { if (camGoal) flyTo(camGoal.v, camGoal.followBox); });

/* Pezzi: tocco = evidenzia */
export function clearHL() {
  if (hl) { scene.remove(hl); hl.geometry.dispose(); hl = null; richiedi(); }
  body.querySelectorAll('.pz.hit').forEach(e => e.classList.remove('hit'));
}
export function highlight(key) {
  clearHL();
  const g = compsByKey[key]; if (!g) return;
  hl = new THREE.BoxHelper(g, 0xff2d55); hl.material.depthTest = false; hl.renderOrder = 1000; scene.add(hl); richiedi();
  const li = body.querySelector(`.pz[data-k="${key}"]`);
  if (li) { li.classList.add('hit'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
body.addEventListener('click', e => { if (e.target.closest('#mechGo')) { AUTOPLA.open(); return; } const b = e.target.closest('.pz'); if (b) highlight(b.dataset.k); });

/* Tocco sul disegno */
export const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
export let down = null;
export function pick(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  let hits = ray.intersectObjects(pickables, false).filter(h => h.object.visible && h.object.material !== ghostMat);
  if (current === 'braccetto') hits = hits.filter(h => h.point.x <= clipPlanes[0].constant + .2 && h.point.x >= -clipPlanes[1].constant - .2);
  if (!hits.length) return;
  let h = hits[0];
  if (h.object.userData.container) {
    const bb = new THREE.Box3().setFromObject(h.object.parent).expandByScalar(.5);
    const inner = hits.find(q => !q.object.userData.container && bb.containsPoint(q.point));
    if (inner) h = inner;
  }
  const key = keyOf(h.object);
  if (BOXKEYS.includes(key) || key === 'carrello') { window.AUTOPLA && AUTOPLA.open(); return; }  // la box apre il dettaglio del meccanismo
  const cur = PART[current];
  if (cur && cur.keys.includes(key)) { highlight(key); return; }
  let target = TAP_ORDER.find(id => PART[id].keys.includes(key));
  if (target === undefined && key in EXTRA_TAP) target = EXTRA_TAP[key];
  if (!target) return;
  select(target);
  if (compsByKey[key]) highlight(key);
}
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
  down = null;
  if (moved < 8 && dt < 450) pick(e.clientX, e.clientY);
});

/* Visibilità etichette */
export function refreshLabels() {
  for (const e of labels) {
    let vis;
    switch (e.cat) {
      case 'dot': vis = current === null; break;
      case 'pots': vis = current === 'vasi' || current === 'ciclo'; break;
      case 'qtop': vis = current === 'vasi'; break;
      case 'qside': vis = current === 'braccetto'; break;
      case 'box': vis = current === 'box' && explodeT > .6; break;
      case 'amb': vis = current === null && (!MOBILE || !!e.prim); break;
      default: vis = current === e.cat;
    }
    e.o.visible = vis;
  }
}

/* Dimensioni */
export function resize() {
  const W = Math.max(1, vp.clientWidth), H = Math.max(1, vp.clientHeight);
  renderer.setSize(W, H); labelRenderer.setSize(W, H);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  richiedi();
}
new ResizeObserver(resize).observe(vp);
addEventListener('resize', resize);


// righe 1109-1154
/* Avvio */
export const clock = new Orologio();   // v2: al posto di THREE.Clock (deprecato)
export function avvia() {
resize();
updateHose(S.bx);
select(null);
tween.t = 1; camera.position.copy(tween.tp); controls.target.copy(tween.tt); tween = null; controls.enabled = true;
$('loading').remove();
requestAnimationFrame(frame);
}

/* Rendering su richiesta: si disegna solo quando cambia qualcosa (camera, ciclo, selezione, esploso, luce, gocce).
   A scena ferma nessun fotogramma: la GPU resta a zero. Il vento delle piante avanza solo nei fotogrammi disegnati. */
let sporco = true, ultimaFirma = '', camFerma = 0, contestoPerso = false;
export function richiedi() { sporco = true; }
// firma della camera senza allocazioni: confronto con le matrici dell'ultimo fotogramma disegnato
const camPrec = new Float64Array(18).fill(NaN);
function camCambiata() {
  const e = camera.matrixWorld.elements, p = camera.projectionMatrix.elements;
  for (let i = 0; i < 16; i++) if (Math.abs(e[i] - camPrec[i]) > 5e-4) return true;
  return Math.abs(p[0] - camPrec[16]) > 5e-5 || Math.abs(p[5] - camPrec[17]) > 5e-5;
}
function camSalva() { const e = camera.matrixWorld.elements, p = camera.projectionMatrix.elements; for (let i = 0; i < 16; i++) camPrec[i] = e[i]; camPrec[16] = p[0]; camPrec[17] = p[5]; }
// pagina nascosta: niente lavoro; al ritorno l'orologio riparte da zero e si ridisegna
document.addEventListener('visibilitychange', () => { if (!document.hidden) { clock.getDelta(); richiedi(); renderer.shadowMap.needsUpdate = true; } });
// contesto WebGL perso (telefono sotto pressione di memoria): stop del disegno finché non torna
renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); contestoPerso = true; });
renderer.domElement.addEventListener('webglcontextrestored', () => { contestoPerso = false; if (window.AMB_PRONTO) rigeneraTexture(); renderer.shadowMap.needsUpdate = true; richiedi(); });
export function frame(t = performance.now()) {
  requestAnimationFrame(frame);
  if (!$('mech').hidden || document.hidden || contestoPerso) { clock.getDelta(); return; }   // dettaglio aperto: scena principale in pausa
  const dt = Math.min(clock.getDelta(), .05);
  updateCycle(dt);
  boxG.position.x = S.bx;
  pivot.rotation.x = -rad(S.arm);
  if (window.MAINM) { const M = window.MAINM; M.update(S.bx, S.arm); if (M.arco) M.arco.geometry.setDrawRange(0, S.arm > .05 ? Math.max(2, Math.round(S.arm / ARM_DEG * (M.arcoN - 1)) + 1) : 0); }
  updateHose(S.bx);
  if (current === 'braccetto') {
    clipPlanes[0].constant = S.bx + 1; clipPlanes[1].constant = -(S.bx - 18); qSide.position.x = S.bx - 100;
  }
  explodeT += (explodeTarget - explodeT) * Math.min(1, dt * 6);
  if (Math.abs(explodeTarget - explodeT) < .001) explodeT = explodeTarget;
  const ek = ease(Math.min(1, Math.max(0, explodeT)));
  for (const k in parts) parts[k].g.position.copy(parts[k].off).multiplyScalar(ek);
  const glow = S.watering ? .55 + .25 * Math.sin(performance.now() / 120) : 0;
  pompaMat.emissive.setHex(0x2a7de1); pompaMat.emissiveIntensity = glow;
  valvMat.emissive.setHex(0x2a7de1); valvMat.emissiveIntensity = glow;
  updateDrops(dt, S.watering);
  if (tween) {
    tween.t = RIDOTTO ? 1 : Math.min(1, tween.t + dt / .9);
    const k = ease(tween.t);
    if (tween.followBox) tween.tt.set(S.bx, 67, 8);
    camera.position.lerpVectors(tween.fp, tween.tp, k);
    controls.target.lerpVectors(tween.ft, tween.tt, k);
    if (tween.t >= 1) { tween = null; controls.enabled = true; }
  }
  if (window.AMB_PRONTO) ambienteFrame(dt);
  benchPasso(t, camera, controls, richiedi);
  controls.update();
  if (window.AMB_PRONTO) vincolaCamera();
  camera.updateMatrixWorld();
  const gocce = drops.some(d => d.on), muroOp = AMB.muro && AMB.muro[0] ? AMB.muro[0].userData.op : 0;
  if (fuoco) fuoco.aggiorna(dt);
  const firma = S.bx.toFixed(3) + '|' + S.arm.toFixed(3) + '|' + explodeT.toFixed(4) + '|' + current + '|' + AMB.modo + '|' + muroOp + '|' + (hl ? 1 : 0) + '|' + S.watering + '|' + glow.toFixed(3) + '|' + (fuoco ? fuoco.k.toFixed(3) : 0);
  const camMossa = camCambiata();
  if (camMossa) governa(p95(), t);
  // pixel ratio: ridotto mentre la camera si muove, pieno 0,2 s dopo l'ultimo movimento (con un fotogramma in più)
  if (camMossa) { camFerma = 0; pixelRatio(true); }
  else if (camFerma < .2 && (camFerma += dt) >= .2) { pixelRatio(false); sporco = true; }
  const scenaCambiata = firma !== ultimaFirma;
  if (!sporco && !camMossa && !scenaCambiata && !gocce) { campiona(t, false); return; }
  // ombre: ridisegnate solo quando si muove qualcosa nella scena (non per la camera)
  if (sporco || scenaCambiata || gocce) renderer.shadowMap.needsUpdate = true;
  sporco = false; ultimaFirma = firma; camSalva();
  if (window.AMB_PRONTO) aggiornaVento();
  if (hl) hl.update();
  refreshLabels();
  pipeline.render();
  labelRenderer.render(scene, camera);
  if (window.AMB_PRONTO) disponiEtichetteMain();
  campiona(t, true, renderer);
}
