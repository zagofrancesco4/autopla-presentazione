// Diagnosi da telefono (?diag=1): parte da sola, nessun tocco richiesto.
// Mostra GPU, DPR, dimensioni del canvas, MAX_SAMPLES e profilo; poi esegue l'orbita di ?bench=1 (8 s, governor spento,
// DPR fisso) per ogni configurazione e misura p50/p95/max del frame, % di frame lenti (> 1,5 × vsync misurato),
// tempo CPU di renderer.render e del frame.
// L'antialias si sceglie solo alla creazione del contesto: le configurazioni senza antialias (L, M) girano dopo un
// ricaricamento automatico con &aa=0&diagfase=2 (risultati della prima parte in sessionStorage).
// Nel loop di misura (passo/fine) nessuna allocazione: buffer Float32Array preallocati, solo numeri.
import * as THREE from 'three';
import { renderer, scene, camera, controls, sun, DPR_FORZATO, PR_PIENO, PR_MOTO0, mappaOmbra } from './renderer.js';
import { qualita, MOBILE } from './qualita.js';
import { FLAGS, DIAG_H, vsync } from './perf.js';
import { AMB } from '../ambiente/ambiente.js';
import { VENTO } from '../vegetazione/piante.js';

const CHIAVE = 'autopla-diag', q = new URLSearchParams(location.search), FASE2 = q.get('diagfase') === '2';
const DUR = 8000, RISCALDO = 1000;
// orbita di ?bench=1 (stesso raggio, quota e verso); arco 0,2 → 1,6 rad: oltre 1,65 OrbitControls blocca l'azimut e la camera si fermerebbe
const A0 = .2, A1 = 1.6;

const TUTTO = { ombre: 1, clearcoat: 1, rim: 1, a2c: 1, contatto: 1, vento: 1, piante: 1, env: 1, ombreOgniFrame: 0 };
const cfg = (id, nome, dpr, o = {}) => Object.assign({ id, nome, dpr }, TUTTO, o);
const NIENTE = { ombre: 0, clearcoat: 0, rim: 0, a2c: 0, contatto: 0, vento: 0 };
const LISTA1 = [
  cfg('A', 'attuale (DPR del tier in movimento)', 'moto'),
  cfg('B', 'DPR 1', 1),
  cfg('C', 'DPR 2', 2),
  cfg('D', 'C senza ombre', 2, { ombre: 0 }),
  cfg('E', 'C senza clearcoat', 2, { clearcoat: 0 }),
  cfg('F', 'C senza rim', 2, { rim: 0 }),
  cfg('G', 'C senza alphaToCoverage', 2, { a2c: 0 }),
  cfg('H', 'C senza ombra di contatto', 2, { contatto: 0 }),
  cfg('I', 'C senza vento', 2, { vento: 0 }),
  cfg('I2', 'extra: C senza piante', 2, { piante: 0 }),
  cfg('O', 'extra: C senza IBL (environment)', 2, { env: 0 }),
  cfg('N', 'extra: C + ombre ricalcolate a ogni frame (come nel ciclo e in ?bench=1)', 2, { ombreOgniFrame: 1 }),
  cfg('R', 'N con ombre del ciclo a 1024 (mapSize usato durante il ciclo su mobile)', 2, { ombreOgniFrame: 1, mappaOmbra: 1024 }),
  cfg('P', 'DPR 2,5 con tutto acceso', 2.5),
  cfg('Q', 'DPR 3 con tutto acceso', 3),
  cfg('A2', 'extra: A ripetuta (deriva termica)', 'moto')
];
const LISTA2 = [
  cfg('L', 'C senza antialias', 2),
  cfg('M', 'C con tutto spento (antialias, ombre, clearcoat, rim, a2c, contatto, vento)', 2, NIENTE)
];
const LISTA = FASE2 ? LISTA2 : LISTA1;

// ---------- buffer di misura (preallocati) ----------
const N = 4096, bDt = new Float32Array(N), bR = new Float32Array(N), bF = new Float32Array(N), ord = new Float32Array(N);
let n = 0, tPrec = 0, calls = 0, tri = 0;
let stato = 'attesa', ic = 0, tFase = -1, tPronto = 0, interrotta = false, tentativi = 0;
let ultimoCarico = 0, caricati = 0, totali = 0;
const c0 = new THREE.Vector3(); let raggio = 0, quota = 0, cfgCorr = null, vsDiag = 0;

// ---------- stato originale degli effetti ----------
let ORIG = null;
function salvaOriginali() {
  const tutti = new Set(), cc = [], rim = [], a2c = [];
  scene.traverse(o => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) tutti.add(m); });
  for (const m of tutti) {
    if (m.isMeshPhysicalMaterial && m.clearcoat > 0) cc.push([m, m.clearcoat]);
    if (m.userData.rim) rim.push([m, m.onBeforeCompile, m.customProgramCacheKey]);
    if (m.alphaToCoverage) a2c.push(m);
  }
  ORIG = { tutti, cc, rim, a2c, vento: VENTO.ampiezza.value, env: scene.environment, piano: AMB.contatto ? AMB.contatto.piano : null };
}
function applica(c) {
  const O = ORIG;
  renderer.shadowMap.enabled = !!c.ombre; sun.castShadow = !!c.ombre;
  mappaOmbra(c.mappaOmbra || qualita.p.ombra);   // R: 1024 come nel ciclo; tutte le altre: quella del tier
  for (const [m, v] of O.cc) m.clearcoat = c.clearcoat ? v : 0;
  for (const [m, obc, key] of O.rim) {
    if (c.rim) { m.onBeforeCompile = obc; m.customProgramCacheKey = key; }
    else { delete m.onBeforeCompile; delete m.customProgramCacheKey; }   // tornano quelli del prototipo (shader standard)
  }
  for (const m of O.a2c) m.alphaToCoverage = !!c.a2c;
  if (O.piano) O.piano.visible = !!c.contatto;
  VENTO.ampiezza.value = c.vento ? O.vento : 0;
  if (AMB.piante) AMB.piante.visible = !!c.piante;
  scene.environment = c.env ? O.env : null;
  for (const m of O.tutti) m.needsUpdate = true;
  renderer.shadowMap.needsUpdate = true;
  const dpr = c.dpr === 'moto' ? PR_MOTO0 : c.dpr;
  DPR_FORZATO.v = dpr; renderer.setPixelRatio(dpr);
}

// ---------- orbita ----------
function posa(k) {
  const a = A0 + (A1 - A0) * Math.min(1, k);
  controls.target.copy(c0);
  camera.position.set(c0.x + Math.sin(a) * raggio * .8, c0.y + quota, c0.z + Math.cos(a) * raggio * .8);
}

// ---------- agganci chiamati da frame() ----------
function passo(t) {
  if (stato === 'attesa') { if (pronto(t)) inizia(); return; }
  if (stato === 'compila' || stato === 'fine') { if (stato === 'compila') posa(0); return; }
  if (tFase < 0) tFase = t;
  const el = t - tFase;
  if (cfgCorr.ombreOgniFrame) renderer.shadowMap.needsUpdate = true;
  if (stato === 'riscaldo') {
    posa(el / RISCALDO);
    if (el >= RISCALDO) { stato = 'misura'; tFase = t; n = 0; tPrec = 0; }
    return;
  }
  posa(el / DUR);
  if (el >= DUR) chiudi();
}
function fine(t, rCpu, fCpu) {
  if (stato !== 'misura') return;
  if (tPrec && n < N) { bDt[n] = t - tPrec; bR[n] = rCpu; bF[n] = fCpu; n++; }
  tPrec = t; calls = renderer.info.render.calls; tri = renderer.info.render.triangles;
}

function pronto(t) {
  if (!window.AMB_PRONTO || !AMB.pavimentoPronto || caricati < totali) return false;
  if (!tPronto) tPronto = t;
  return t - tPronto > 2500 && performance.now() - ultimoCarico > 1500;
}

// ---------- sequenza ----------
let R = { info: null, risultati: [] }, ui = null;
function inizia() {
  salvaOriginali();
  vsDiag = vsync();   // vsync misurato a scena ferma (prima del carico): la soglia dei frame lenti non si sposta durante le misure
  if (FASE2) R.info2.vsyncMs = r2(vsDiag); else R.info.vsyncMs = r2(vsDiag);
  c0.copy(controls.target); raggio = camera.position.distanceTo(c0); quota = camera.position.y - c0.y;
  controls.enabled = false;
  prepara();
}
function prepara() {
  cfgCorr = LISTA[ic]; stato = 'compila'; tFase = -1; interrotta = false;
  stato_(`${cfgCorr.id} · ${cfgCorr.nome}: compilazione…`);
  applica(cfgCorr); posa(0);
  renderer.compileAsync(scene, camera).catch(() => { }).then(() => { stato = 'riscaldo'; tFase = -1; stato_(`${cfgCorr.id} · ${cfgCorr.nome}: misura (${ic + 1}/${LISTA.length})`); });
}
function perc(cnt, src, p) {
  for (let k = 0; k < cnt; k++) ord[k] = src[k];
  const s = ord.subarray(0, cnt).sort();
  return cnt ? s[Math.min(cnt - 1, Math.floor(p * cnt))] : 0;
}
const r2 = v => Math.round(v * 100) / 100;
function chiudi() {
  stato = 'calcolo';
  // interrotta (schermo spento, pagina nascosta) o troppo pochi frame: si rifà, al più 2 volte
  if ((interrotta || n < 20) && tentativi < 2) { tentativi++; stato_(`${cfgCorr.id}: interrotta, la rifaccio`); prepara(); return; }
  tentativi = 0;
  if (!n) { n = 1; bDt[0] = bR[0] = bF[0] = 0; }
  const sl = 1.5 * vsDiag; let over = 0, lenti = 0, max = 0; for (let k = 0; k < n; k++) { if (bDt[k] > 16.7) over++; if (bDt[k] > sl) lenti++; if (bDt[k] > max) max = bDt[k]; }
  const cv = renderer.domElement;
  R.risultati.push({
    id: cfgCorr.id, nome: cfgCorr.nome, dpr: r2(renderer.getPixelRatio()), aa: FLAGS.aa, canvasPx: `${cv.width}x${cv.height}`, mpx: r2(cv.width * cv.height / 1e6),
    frame: n, vsync: r2(vsDiag), sogliaLento: r2(sl), p50: r2(perc(n, bDt, .5)), p95: r2(perc(n, bDt, .95)), max: r2(max), lenti: r2(100 * lenti / n), sopra16_7: r2(100 * over / n),
    renderCpuP50: r2(perc(n, bR, .5)), renderCpuP95: r2(perc(n, bR, .95)), frameCpuP50: r2(perc(n, bF, .5)), frameCpuP95: r2(perc(n, bF, .95)),
    calls, triangoli: tri, interrotta, mappaOmbra: sun.shadow.mapSize.x, programmi: renderer.info.programs ? renderer.info.programs.length : 0
  });
  ic++;
  if (ic < LISTA.length) { prepara(); return; }
  stato = 'fine';
  if (!FASE2) {
    try { sessionStorage.setItem(CHIAVE, JSON.stringify(R)); } catch (e) { /* memoria piena: si perde solo la parte 1 */ }
    stato_('Parte 1 finita: ricarico senza antialias per L e M…');
    const u = new URL(location.href); u.searchParams.set('aa', '0'); u.searchParams.set('diagfase', '2');
    setTimeout(() => location.replace(u.toString()), 600);
    return;
  }
  try { sessionStorage.removeItem(CHIAVE); } catch (e) { /* niente */ }
  tabella();
}

// ---------- informazioni sul dispositivo ----------
function infoDispositivo() {
  const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), cv = renderer.domElement, ca = gl.getContextAttributes() || {};
  return {
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    devicePixelRatio: window.devicePixelRatio, canvasCss: `${cv.clientWidth}x${cv.clientHeight}`, canvasPx: `${cv.width}x${cv.height}`,
    maxSamples: gl.getParameter(gl.MAX_SAMPLES), samplesCanvas: gl.getParameter(gl.SAMPLES), antialias: !!ca.antialias,
    profilo: qualita.nome, mobile: MOBILE, pointerCoarse: matchMedia('(pointer: coarse)').matches, finestra: `${innerWidth}x${innerHeight}`,
    prMax: qualita.p.prMax, prRiposo: PR_PIENO, prMoto: PR_MOTO0, ombraMapSize: qualita.p.ombra,
    core: navigator.hardwareConcurrency || null, memoriaGB: navigator.deviceMemory || null, ua: navigator.userAgent
  };
}

// ---------- interfaccia ----------
const CSS = `#diagBox{position:fixed;inset:0 0 auto 0;z-index:9999;max-height:100%;overflow:auto;background:rgba(10,11,13,.93);color:#e8eaed;
font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px 10px 14px;-webkit-text-size-adjust:100%}
#diagBox h2{font:600 16px/1.2 system-ui,sans-serif;margin:0 0 6px}#diagBox .st{color:#f5b942;margin:6px 0;font-size:14px}
#diagBox .inf{white-space:pre-wrap;word-break:break-word;font-size:12px;color:#c9ccd1}
#diagBox table{border-collapse:collapse;font-size:12px;margin:8px 0;min-width:100%}
#diagBox th,#diagBox td{border:1px solid #3a3d42;padding:3px 4px;text-align:right;white-space:nowrap}
#diagBox th{background:#1d1f23;color:#f5b942}#diagBox td:first-child,#diagBox th:first-child{text-align:left;font-weight:700}
#diagBox .ok{color:#5fd38a}#diagBox .ko{color:#ff6b6b}#diagBox .leg{font-size:12px;color:#c9ccd1}
#diagBox button{font:600 16px system-ui,sans-serif;padding:10px 18px;margin:6px 8px 6px 0;border-radius:8px;border:0;background:#f5b942;color:#111;min-height:44px}
#diagBox button.sec{background:#3a3d42;color:#e8eaed}#diagBox textarea{width:100%;height:90px;font:11px ui-monospace,monospace;background:#16181b;color:#c9ccd1;border:1px solid #3a3d42}`;
function creaUi() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const box = document.createElement('div'); box.id = 'diagBox';
  box.innerHTML = '<h2>Autopla · diagnosi</h2><div class="inf"></div><div class="st">In attesa del caricamento completo…</div>';
  document.body.appendChild(box);
  return { box, inf: box.querySelector('.inf'), st: box.querySelector('.st') };
}
function stato_(s) { if (ui) ui.st.textContent = s; }
function mostraInfo(I) {
  ui.inf.textContent = `GPU ${I.gpu} (${I.vendor})\nDPR dispositivo ${I.devicePixelRatio} · canvas ${I.canvasCss} CSS px → ${I.canvasPx} px reali\n` +
    `MAX_SAMPLES ${I.maxSamples} · campioni del canvas ${I.samplesCanvas} · antialias ${I.antialias ? 'sì' : 'no'}\n` +
    `profilo ${I.profilo} (mobile ${I.mobile}, pointer coarse ${I.pointerCoarse}, finestra ${I.finestra}) · DPR riposo ${I.prRiposo} · moto ${I.prMoto} · ombre ${I.ombraMapSize}\n` +
    `core ${I.core ?? '?'} · memoria ${I.memoriaGB ?? '?'} GB\nNon toccare lo schermo e tienilo acceso (~3 min, la pagina si ricarica una volta).`;
}
function tabella() {
  const rs = R.risultati, cl = (v, r) => v > (r.sogliaLento || 25) ? 'ko' : 'ok';
  let h = '<table><tr><th>conf</th><th>DPR</th><th>Mpx</th><th>p50</th><th>p95</th><th>max</th><th>lenti</th><th>rend p50</th><th>rend p95</th><th>frame p95</th><th>calls</th><th>ktri</th></tr>';
  for (const r of rs) h += `<tr><td>${r.id}</td><td>${r.dpr}</td><td>${r.mpx}</td><td class="${cl(r.p50, r)}">${r.p50}</td><td class="${cl(r.p95, r)}">${r.p95}</td><td>${r.max}</td><td>${r.lenti}%</td>` +
    `<td>${r.renderCpuP50}</td><td>${r.renderCpuP95}</td><td>${r.frameCpuP95}</td><td>${r.calls}</td><td>${(r.triangoli / 1000).toFixed(0)}</td></tr>`;
  const v0 = rs.length ? rs[rs.length - 1] : { vsync: 0, sogliaLento: 0 };
  h += `</table><div class="leg">ms per frame (intervallo rAF) · vsync misurato ${v0.vsync} ms · lenti = % frame &gt; 1,5 × vsync (${v0.sogliaLento} ms), verde/rosso sulla stessa soglia · rend = CPU di renderer.render · frame = CPU di tutto frame()<br>` + rs.map(r => `<b>${r.id}</b> ${r.nome}`).join(' · ') + '</div>';
  const json = JSON.stringify(R);
  ui.st.textContent = 'Finito. Fotografa la tabella o premi Copia e incolla il testo.';
  ui.box.insertAdjacentHTML('beforeend', h + '<div><button id="diagCopia">Copia</button><button class="sec" id="diagRipeti">Ripeti</button><button class="sec" id="diagChiudi">Chiudi</button></div><textarea readonly></textarea>');
  const ta = ui.box.querySelector('textarea'); ta.value = json;
  ui.box.querySelector('#diagCopia').addEventListener('click', e => {
    const ok = () => { e.target.textContent = 'Copiato ✓'; };
    // http su IP locale non è un contesto sicuro: navigator.clipboard può mancare → execCommand sulla textarea
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(json).then(ok, () => copiaVecchio(ta) && ok());
    else if (copiaVecchio(ta)) ok(); else e.target.textContent = 'Seleziona il testo qui sotto';
  });
  ui.box.querySelector('#diagRipeti').addEventListener('click', () => { const u = new URL(location.href); u.searchParams.delete('aa'); u.searchParams.delete('diagfase'); location.replace(u.toString()); });
  ui.box.querySelector('#diagChiudi').addEventListener('click', () => { ui.box.remove(); DPR_FORZATO.v = 0; controls.enabled = true; });
}
function copiaVecchio(ta) { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); try { return document.execCommand('copy'); } catch (e) { return false; } }

export function avviaDiagnosi() {
  if (!FASE2) { try { sessionStorage.removeItem(CHIAVE); } catch (e) { /* niente */ } }
  else { try { const s = sessionStorage.getItem(CHIAVE); if (s) R = JSON.parse(s); } catch (e) { /* niente */ } }
  ui = creaUi();
  const I = infoDispositivo();
  if (FASE2) R.info2 = I; else R.info = I;
  mostraInfo(I);
  // governor spento da subito: DPR fisso a quello di moto iniziale finché non parte la prima configurazione
  DPR_FORZATO.v = PR_MOTO0;
  // texture ancora in arrivo: la misura parte 1,5 s dopo l'ultimo caricamento
  const LM = THREE.DefaultLoadingManager, segna = (u, a, b) => { ultimoCarico = performance.now(); caricati = a; totali = b; };
  LM.onStart = segna; LM.onProgress = segna; ultimoCarico = performance.now();
  document.addEventListener('visibilitychange', () => { if (document.hidden && (stato === 'misura' || stato === 'riscaldo')) interrotta = true; });
  DIAG_H.passo = passo; DIAG_H.fine = fine;
}
